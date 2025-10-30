using ExpenseTrackerAPI.Data;
using ExpenseTrackerAPI.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace ExpenseTrackerAPI.Controllers
{
    [ApiController]
    [Route("api/reimbursements")]
    public class ReimbursementsController : ControllerBase
    {
        private readonly AppDbContext _db;
        private readonly UserManager<ApplicationUser> _userManager;

        public ReimbursementsController(AppDbContext db, UserManager<ApplicationUser> userManager)
        {
            _db = db;
            _userManager = userManager;
        }

        public record ReimbursementMapItem(int ExpenseId, bool IsReimbursed, DateTime? PaidDateUtc, string? Reference);

        [HttpGet("map")]
        [Authorize(Policy = "RequireAdmin")]
        public async Task<IActionResult> Map([FromQuery] int month, [FromQuery] int year, CancellationToken ct)
        {
            // If your Expense uses a different date prop than DateSubmitted, tell me and I’ll align.
            var reimbursements = await _db.Reimbursements
                .Include(r => r.Expense)
                .Where(r => r.Expense.DateSubmitted.Month == month && r.Expense.DateSubmitted.Year == year)
                .Select(r => new ReimbursementMapItem(r.ExpenseId, true, r.PaidDateUtc, r.Reference))
                .ToListAsync(ct);

            return Ok(reimbursements);
        }

        // Global map for Admin processed history status column (no month/year filter)
        [HttpGet("map-all")]
        [Authorize(Policy = "RequireAdmin")]
        public async Task<IActionResult> MapAll(CancellationToken ct)
        {
            var reimbursements = await _db.Reimbursements
                .Select(r => new ReimbursementMapItem(r.ExpenseId, true, r.PaidDateUtc, r.Reference))
                .ToListAsync(ct);
            return Ok(reimbursements);
        }

        public record MarkPaidRequest(string Reference, decimal Amount);

        [HttpPut("mark-paid/{expenseId:int}")]
        [Authorize(Policy = "RequireAdmin")]
        public async Task<IActionResult> MarkPaid([FromRoute] int expenseId, [FromBody] MarkPaidRequest req, CancellationToken ct)
        {
            var admin = await _userManager.GetUserAsync(User);
            if (admin is null) return Unauthorized();

            // ✅ Required fields
            if (req is null || string.IsNullOrWhiteSpace(req.Reference))
                return BadRequest(new { code = "REFERENCE_REQUIRED", message = "Transaction ID / reference is required." });
            if (req.Amount <= 0)
                return BadRequest(new { code = "AMOUNT_REQUIRED", message = "Amount must be greater than zero." });

            var expense = await _db.Expenses
                .Include(e => e.Category)
                .FirstOrDefaultAsync(e => e.ExpenseId == expenseId, ct);
            if (expense is null) return NotFound(new { code = "EXPENSE_NOT_FOUND" });

            var status = (expense.Status ?? "").Trim();
            if (!string.Equals(status, "Approved", StringComparison.OrdinalIgnoreCase))
                return Conflict(new { code = "NOT_APPROVED", message = "Only approved expenses can be reimbursed." });

            var exists = await _db.Reimbursements.AnyAsync(r => r.ExpenseId == expenseId, ct);
            if (exists)
                return Conflict(new { code = "ALREADY_REIMBURSED", message = "This expense is already reimbursed." });

            // Create reimbursement row
            var reimb = new Reimbursement
            {
                ExpenseId = expenseId,
                Amount = req.Amount,
                Status = "Paid",
                PaidDateUtc = DateTime.UtcNow,
                Reference = req.Reference.Trim(),
                ReimbursedByUserId = admin.Id,
                ReimbursedByName = admin.FullName ?? admin.Email ?? "Admin",
                CreatedAtUtc = DateTime.UtcNow
            };
            _db.Reimbursements.Add(reimb);

            // ✅ Employee notification with UTR; map EmployeeId -> ApplicationUser.Id
            // Your ApplicationUser has EmployeeId (string). Find the user by EmployeeId, then set RecipientId to that user's Id.
            var employeeUser = await _db.Users.FirstOrDefaultAsync(u => u.EmployeeId == expense.EmployeeId, ct);
            if (employeeUser != null)
            {
                var message = $"Your {expense.Category?.Name ?? "expense"} expense has been reimbursed having transaction ID {reimb.Reference}.";
                var notif = new NotificationRecord
                {
                    RecipientId = employeeUser.Id,       // FK to AspNetUsers.Id
                    Recipient = employeeUser,            // nav; EF will set it
                    Message = message,
                    IsRead = false,
                    CreatedAt = DateTime.UtcNow          // ✅ your model uses CreatedAt
                };
                _db.NotificationRecords.Add(notif);
            }
            // else: no matching ApplicationUser for this EmployeeId; skip notification to avoid FK violation.
            // If you want a fallback, share your user/expense linking details and I’ll add a safe fallback.

            await _db.SaveChangesAsync(ct);

            return Ok(new
            {
                message = "Expense reimbursed successfully.",
                expenseId,
                reimb.ReimbursementId,
                reimb.PaidDateUtc,
                reimb.Reference,
                reimb.Amount
            });
        }

        [HttpGet("status/my")]
        [Authorize]
        public async Task<IActionResult> MyStatus(CancellationToken ct)
        {
            var user = await _userManager.GetUserAsync(User);
            if (user is null) return Unauthorized();

            var data = await _db.Reimbursements
                .Include(r => r.Expense)
                .Where(r => r.Expense.EmployeeId == user.EmployeeId)
                .Select(r => new ReimbursementMapItem(r.ExpenseId, true, r.PaidDateUtc, r.Reference))
                .ToListAsync(ct);

            return Ok(data);
        }
    }
}