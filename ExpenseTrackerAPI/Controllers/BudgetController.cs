using ExpenseTrackerAPI.Data;
using ExpenseTrackerAPI.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace ExpenseTrackerAPI.Controllers
{
    [ApiController]
    [Route("api/budget")]
    public class BudgetController : ControllerBase
    {
        private readonly AppDbContext _db;
        private readonly UserManager<ApplicationUser> _userManager;

        private static readonly TimeZoneInfo IST = TimeZoneInfo.FindSystemTimeZoneById(
#if WINDOWS
            "India Standard Time"
#else
            "Asia/Kolkata"
#endif
        );

        public BudgetController(AppDbContext db, UserManager<ApplicationUser> userManager)
        {
            _db = db; _userManager = userManager;
        }

        public record SetBudgetRequest(int CategoryId, decimal InitialAmount, int Month, int Year);

        private static bool IsSetWindowOpen(DateTime utcNow, int month, int year)
        {
            var nowIst = TimeZoneInfo.ConvertTimeFromUtc(utcNow, IST);
            if (nowIst.Year != year || nowIst.Month != month) return false;
            return nowIst.Day >= 1 && nowIst.Day <= 10;
        }

        [HttpPost("set")]
        [Authorize(Policy = "RequireManager")]
        public async Task<IActionResult> SetBudget([FromBody] SetBudgetRequest req, CancellationToken ct)
        {
            if (!IsSetWindowOpen(DateTime.UtcNow, req.Month, req.Year))
                return Forbid("Budget can only be set from the 1st to the 10th of the month.");

            var user = await _userManager.GetUserAsync(User);
            if (user == null) return Unauthorized();

            var category = await _db.Categories.FindAsync(new object?[] { req.CategoryId }, ct);
            if (category == null) return NotFound(new { code = "CATEGORY_NOT_FOUND" });

            var existingForMonth = await _db.Budgets.Where(b => b.Month == req.Month && b.Year == req.Year).ToListAsync(ct);
            if (existingForMonth.Any() && existingForMonth.First().CreatedByManagerId != user.Id)
                return Conflict(new { code = "BUDGET_CREATOR_CONFLICT", message = "Another manager already set budgets for this month." });

            var existing = await _db.Budgets.FirstOrDefaultAsync(b =>
                b.CategoryId == req.CategoryId && b.Month == req.Month && b.Year == req.Year, ct);

            if (existing == null)
            {
                _db.Budgets.Add(new Budget
                {
                    CategoryId = req.CategoryId,
                    InitialAmount = req.InitialAmount,
                    RemainingAmount = req.InitialAmount,
                    Month = req.Month,
                    Year = req.Year,
                    CreatedDate = DateTime.UtcNow,
                    CreatedByManagerId = user.Id,
                    CreatedByManagerName = user.FullName ?? user.Email ?? "Manager"
                });
            }
            else
            {
                if (existing.CreatedByManagerId != user.Id)
                    return Conflict(new { code = "BUDGET_CREATOR_CONFLICT", message = "Another manager created this budget." });

                bool hasTx = await _db.BudgetTransactions.AnyAsync(t => t.BudgetId == existing.BudgetId, ct);
                existing.InitialAmount = req.InitialAmount;
                if (!hasTx)
                    existing.RemainingAmount = req.InitialAmount;
            }

            await _db.SaveChangesAsync(ct);
            return Ok();
        }

        [HttpGet("history")]
        [Authorize(Policy = "RequireManager")]
        public async Task<IActionResult> History([FromQuery] int? year, CancellationToken ct)
        {
            int y = year ?? DateTime.UtcNow.Year;
            var budgets = await _db.Budgets
                .Include(b => b.Category)
                .Where(b => b.Year == y)
                .OrderBy(b => b.Year).ThenBy(b => b.Month).ThenBy(b => b.Category.Name)
                .ToListAsync(ct);

            var nowIst = TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, IST);

            var grouped = budgets.GroupBy(b => new { b.Month, b.Year })
                .Select(g => new
                {
                    g.Key.Month,
                    g.Key.Year,
                    BudgetSetBy = $"Budgets set by - {g.First().CreatedByManagerName}",
                    IsSetWindowOpen = (nowIst.Year == g.Key.Year && nowIst.Month == g.Key.Month && nowIst.Day >= 1 && nowIst.Day <= 10),
                    Items = g.Select(b => new
                    {
                        b.BudgetId,
                        b.CategoryId,
                        CategoryName = b.Category.Name,
                        b.InitialAmount,
                        b.RemainingAmount,
                        b.CreatedDate
                    })
                });

            return Ok(grouped);
        }

        [HttpGet("window")]
        [Authorize(Policy = "RequireManager")]
        public IActionResult Window([FromQuery] int month, [FromQuery] int year)
        {
            var open = IsSetWindowOpen(DateTime.UtcNow, month, year);
            return Ok(new { month, year, isSetWindowOpen = open });
        }

        // Admin totals + usage/health
        [HttpGet("overview-admin")]
        [Authorize(Policy = "RequireAdmin")]
        public async Task<IActionResult> AdminOverview([FromQuery] int month, [FromQuery] int year, CancellationToken ct)
        {
            var budgets = await _db.Budgets
                .Include(b => b.Category)
                .Where(b => b.Month == month && b.Year == year)
                .ToListAsync(ct);

            var categories = budgets.Select(b =>
            {
                var initial = b.InitialAmount;
                var remaining = b.RemainingAmount;
                var deducted = initial - remaining;
                var usage = initial == 0 ? 0 : Math.Round((double)(deducted / initial) * 100, 2);
                var health = usage switch
                {
                    < 70 => "Healthy",
                    >= 70 and < 90 => "At Risk",
                    _ => "Critical"
                };
                return new
                {
                    b.CategoryId,
                    CategoryName = b.Category.Name,
                    InitialMonthlyBudget = initial,
                    RemainingBudget = remaining,
                    ExpensesDeducted = deducted,
                    UsageRate = usage,
                    HealthStatus = health
                };
            }).OrderBy(x => x.CategoryName).ToList();

            var totals = new
            {
                Month = month,
                Year = year,
                TotalBudget = categories.Sum(x => x.InitialMonthlyBudget),
                Remaining = categories.Sum(x => x.RemainingBudget),
                Expenses = categories.Sum(x => x.ExpensesDeducted)
            };

            return Ok(new { totals, categories });
        }
    }
}