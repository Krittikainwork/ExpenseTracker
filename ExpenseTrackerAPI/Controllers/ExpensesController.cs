using ExpenseTrackerAPI.Data;
using ExpenseTrackerAPI.Models;
using ExpenseTrackerAPI.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace ExpenseTrackerAPI.Controllers
{
    [ApiController]
    [Route("api/expenses")]
    public class ExpensesController : ControllerBase
    {
        private readonly AppDbContext _db;
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly NotificationService _notify;

        public ExpensesController(AppDbContext db, UserManager<ApplicationUser> userManager, NotificationService notify)
        {
            _db = db; _userManager = userManager; _notify = notify;
        }

        public record SubmitExpenseRequest(string Title, decimal Amount, int CategoryId, DateTime ExpenseDate);
        public record ApproveExpenseRequest(string ManagerName, string ManagerOfficialId, string? ManagerComment);
        public record RejectExpenseRequest(string ManagerName, string ManagerOfficialId, string? ManagerComment);
        public record AdminCommentRequest(string Comment);

        // -------- EMPLOYEE --------

        [HttpPost("submit")]
        [Authorize(Roles = "Employee")]
        public async Task<IActionResult> Submit([FromBody] SubmitExpenseRequest req, CancellationToken ct)
        {
            var user = await _userManager.GetUserAsync(User);
            if (user == null) return Unauthorized();

            var category = await _db.Categories.FindAsync(new object?[] { req.CategoryId }, ct);
            if (category == null) return NotFound(new { code = "CATEGORY_NOT_FOUND" });

            var e = new Expense
            {
                EmployeeId = user.Id,
                EmployeeName = user.FullName ?? user.Email ?? "Employee",
                Title = req.Title,
                Amount = req.Amount,
                CategoryId = req.CategoryId,
                Status = "Pending",
                DateSubmitted = DateTime.UtcNow,
                ExpenseDate = req.ExpenseDate.Date
            };
            _db.Expenses.Add(e);
            await _db.SaveChangesAsync(ct);

            await _notify.CreateForRoleAsync("Manager", $"New expense request: {e.Title} by {e.EmployeeName}", ct);
            return Ok(new { expenseId = e.ExpenseId });
        }

        [HttpGet("my")]
        [Authorize(Roles = "Employee")]
        public async Task<IActionResult> My(CancellationToken ct)
        {
            var uid = _userManager.GetUserId(User);
            var rows = await _db.Expenses
                .Include(x => x.Category)
                .Where(x => x.EmployeeId == uid)
                .OrderByDescending(x => x.DateSubmitted)
                .Select(e => new
                {
                    e.ExpenseId,
                    e.Title,
                    e.Amount,
                    CategoryName = e.Category.Name,
                    e.ExpenseDate,
                    e.DateSubmitted,
                    e.Status,
                    Manager = e.ManagerName == null ? null : $"{e.ManagerName} ({e.ManagerOfficialId})",
                    e.ManagerComment,
                    e.AdminComment
                })
                .ToListAsync(ct);
            return Ok(rows);
        }

        // -------- MANAGER --------

        [HttpGet("pending")]
        [Authorize(Policy = "RequireManager")]
        public async Task<IActionResult> Pending(CancellationToken ct)
        {
            var rows = await _db.Expenses
                .Include(e => e.Category)
                .Where(e => e.Status == "Pending")
                .OrderBy(e => e.DateSubmitted)
                .Select(e => new
                {
                    e.ExpenseId,
                    e.EmployeeName,
                    EmployeeID = e.EmployeeId, // if you store an official employee code, surface it here
                    e.Title,
                    e.Amount,
                    Category = e.Category.Name,
                    DateSubmitted = e.DateSubmitted
                })
                .ToListAsync(ct);

            return Ok(rows);
        }

        [HttpPut("approve/{id:int}")]
        [Authorize(Policy = "RequireManager")]
        public async Task<IActionResult> Approve(int id, [FromBody] ApproveExpenseRequest req, CancellationToken ct)
        {
            var expense = await _db.Expenses.Include(e => e.Category).FirstOrDefaultAsync(e => e.ExpenseId == id, ct);
            if (expense == null) return NotFound();
            if (expense.Status != "Pending") return Conflict(new { code = "NOT_PENDING" });

            var month = expense.ExpenseDate.Month; var year = expense.ExpenseDate.Year;
            var budget = await _db.Budgets.FirstOrDefaultAsync(b => b.CategoryId == expense.CategoryId && b.Month == month && b.Year == year, ct);
            if (budget == null) return Conflict(new { code = "BUDGET_NOT_FOUND" });
            if (budget.RemainingAmount < expense.Amount) return Conflict(new { code = "INSUFFICIENT_BUDGET", remaining = budget.RemainingAmount });

            budget.RemainingAmount -= expense.Amount;
            _db.BudgetTransactions.Add(new BudgetTransaction
            {
                BudgetId = budget.BudgetId,
                ExpenseId = expense.ExpenseId,
                EmployeeName = expense.EmployeeName,
                EmployeeId = expense.EmployeeId,
                ManagerName = req.ManagerName,
                ManagerOfficialId = req.ManagerOfficialId,
                AmountDeducted = expense.Amount,
                RemainingAfterDeduction = budget.RemainingAmount,
                TransactionDate = DateTime.UtcNow
            });

            expense.Status = "Approved";
            expense.ManagerName = req.ManagerName;
            expense.ManagerOfficialId = req.ManagerOfficialId;
            expense.ManagerComment = req.ManagerComment;
            expense.DateReviewed = DateTime.UtcNow;

            await _db.SaveChangesAsync(ct);

            await _notify.CreateForUserAsync(expense.EmployeeId, $"Your expense \"{expense.Title}\" has been approved.", ct);
            return Ok();
        }

        [HttpPut("reject/{id:int}")]
        [Authorize(Policy = "RequireManager")]
        public async Task<IActionResult> Reject(int id, [FromBody] RejectExpenseRequest req, CancellationToken ct)
        {
            var expense = await _db.Expenses.FirstOrDefaultAsync(e => e.ExpenseId == id, ct);
            if (expense == null) return NotFound();
            if (expense.Status != "Pending") return Conflict(new { code = "NOT_PENDING" });

            expense.Status = "Rejected";
            expense.ManagerName = req.ManagerName;
            expense.ManagerOfficialId = req.ManagerOfficialId;
            expense.ManagerComment = req.ManagerComment;
            expense.DateReviewed = DateTime.UtcNow;

            await _db.SaveChangesAsync(ct);

            await _notify.CreateForUserAsync(expense.EmployeeId, $"Your expense \"{expense.Title}\" has been rejected.", ct);
            return Ok();
        }

        [HttpGet("processed")]
        [Authorize(Policy = "RequireManager")]
        public async Task<IActionResult> Processed(CancellationToken ct)
        {
            var rows = await _db.Expenses
                .Include(e => e.Category)
                .Where(e => e.Status != "Pending")
                .OrderByDescending(e => e.DateReviewed)
                .Select(e => new
                {
                    e.ExpenseId,
                    e.EmployeeName,
                    EmployeeID = e.EmployeeId,
                    e.Title,
                    e.Amount,
                    Category = e.Category.Name,
                    DateSubmitted = e.DateSubmitted,
                    e.Status,
                    Manager = e.ManagerName,
                    e.ManagerComment,
                    e.AdminComment
                })
                .ToListAsync(ct);

            return Ok(rows);
        }

        // -------- ADMIN --------

        [HttpGet("all")]
        [Authorize(Policy = "RequireAdmin")]
        public async Task<IActionResult> All([FromQuery] int? month, [FromQuery] int? year, CancellationToken ct)
        {
            var q = _db.Expenses.Include(e => e.Category).AsQueryable();
            if (month.HasValue) q = q.Where(e => e.ExpenseDate.Month == month.Value);
            if (year.HasValue) q = q.Where(e => e.ExpenseDate.Year == year.Value);

            var rows = await q
                .OrderByDescending(e => e.DateSubmitted)
                .Select(e => new
                {
                    e.ExpenseId,
                    Employee = e.EmployeeName,
                    e.Title,
                    e.Amount,
                    Category = e.Category.Name,
                    Date = e.DateSubmitted,
                    e.Status,
                    Manager = e.ManagerName,
                    e.ManagerComment,
                    AdminComment = e.AdminComment
                })
                .ToListAsync(ct);

            return Ok(rows);
        }

        [HttpPut("comment/{id:int}")]
        [Authorize(Policy = "RequireAdmin")]
        public async Task<IActionResult> AdminComment(int id, [FromBody] AdminCommentRequest req, CancellationToken ct)
        {
            var expense = await _db.Expenses.FirstOrDefaultAsync(e => e.ExpenseId == id, ct);
            if (expense == null) return NotFound();

            expense.AdminComment = req.Comment;
            await _db.SaveChangesAsync(ct);

            await _notify.CreateForRoleAsync("Manager", $"Admin commented on expense \"{expense.Title}\": {req.Comment}", ct);
            return Ok();
        }
    }
}
