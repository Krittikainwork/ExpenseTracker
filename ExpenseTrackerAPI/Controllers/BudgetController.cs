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

        // ---------- SET (Top-up) ----------
        [HttpPost("set")]
        [Authorize(Policy = "RequireManager")]
        public async Task<IActionResult> SetBudget([FromBody] SetBudgetRequest req, CancellationToken ct)
        {
            // Window rule currently disabled (kept as-is):
            // if (!IsSetWindowOpen(DateTime.UtcNow, req.Month, req.Year))
            //     return Forbid("Budget can only be set from the 1st to the 10th of the month.");

            var user = await _userManager.GetUserAsync(User);
            if (user == null) return Unauthorized();

            var category = await _db.Categories.FindAsync(new object?[] { req.CategoryId }, ct);
            if (category == null) return NotFound(new { code = "CATEGORY_NOT_FOUND" });

            // Enforce single manager per month (existing rule)
            var existingForMonth = await _db.Budgets
                .Where(b => b.Month == req.Month && b.Year == req.Year)
                .ToListAsync(ct);

            if (existingForMonth.Any() && existingForMonth.First().CreatedByManagerId != user.Id)
                return Conflict(new { code = "BUDGET_CREATOR_CONFLICT", message = "Another manager already set budgets for this month." });

            var existing = await _db.Budgets.FirstOrDefaultAsync(b =>
                b.CategoryId == req.CategoryId && b.Month == req.Month && b.Year == req.Year, ct);

            var nowUtc = DateTime.UtcNow;
            if (existing == null)
            {
                // New bucket for month/category
                var budget = new Budget
                {
                    CategoryId = req.CategoryId,
                    InitialAmount = req.InitialAmount,
                    RemainingAmount = req.InitialAmount,
                    Month = req.Month,
                    Year = req.Year,
                    CreatedDate = nowUtc,
                    CreatedByManagerId = user.Id,
                    CreatedByManagerName = user.FullName ?? user.Email ?? "Manager"
                };
                _db.Budgets.Add(budget);
                await _db.SaveChangesAsync(ct); // need BudgetId to log adjustment

                // History: InitialSet
                _db.BudgetAdjustments.Add(new BudgetAdjustment
                {
                    BudgetId = budget.BudgetId,
                    CategoryId = budget.CategoryId,
                    Month = budget.Month,
                    Year = budget.Year,
                    AmountSet = req.InitialAmount,
                    CumulativeInitialAfter = budget.InitialAmount,
                    CumulativeRemainingAfter = budget.RemainingAmount,
                    Operation = "InitialSet",
                    ManagerId = user.Id,
                    ManagerName = budget.CreatedByManagerName,
                    CreatedAtUtc = nowUtc
                });
            }
            else
            {
                // Same manager only
                if (existing.CreatedByManagerId != user.Id)
                    return Conflict(new { code = "BUDGET_CREATOR_CONFLICT", message = "Another manager created this budget." });

                // ✅ TOP-UP RULE: add funds; do not recompute deductions
                existing.InitialAmount += req.InitialAmount;
                existing.RemainingAmount += req.InitialAmount;

                // History: TopUp
                _db.BudgetAdjustments.Add(new BudgetAdjustment
                {
                    BudgetId = existing.BudgetId,
                    CategoryId = existing.CategoryId,
                    Month = existing.Month,
                    Year = existing.Year,
                    AmountSet = req.InitialAmount,
                    CumulativeInitialAfter = existing.InitialAmount,
                    CumulativeRemainingAfter = existing.RemainingAmount,
                    Operation = "TopUp",
                    ManagerId = user.Id,
                    ManagerName = existing.CreatedByManagerName,
                    CreatedAtUtc = nowUtc
                });
            }

            await _db.SaveChangesAsync(ct);
            return Ok();
        }

        // ---------- HISTORY (existing summary list by month) ----------
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

        // ---------- NEW: Detailed Budget History (month-wise) ----------
        [HttpGet("history-detail")]
        [Authorize(Policy = "RequireManager")]
        public async Task<IActionResult> HistoryDetail([FromQuery] int month, [FromQuery] int year, CancellationToken ct)
        {
            var budgets = await _db.Budgets
                .Include(b => b.Category)
                .Where(b => b.Month == month && b.Year == year)
                .OrderBy(b => b.Category.Name)
                .ToListAsync(ct);

            var budgetIds = budgets.Select(b => b.BudgetId).ToList();

            var adjustments = await _db.BudgetAdjustments
                .Where(t => t.Month == month && t.Year == year && budgetIds.Contains(t.BudgetId))
                .OrderBy(t => t.CategoryId)
                .ThenBy(t => t.CreatedAtUtc)
                .ToListAsync(ct);

            var result = budgets.Select(b => new
            {
                b.CategoryId,
                CategoryName = b.Category.Name,
                Month = b.Month,
                Year = b.Year,
                InitialMonthlyBudget = b.InitialAmount,
                RemainingBudget = b.RemainingAmount,
                ExpensesDeducted = b.InitialAmount - b.RemainingAmount, // derived
                History = adjustments
                    .Where(t => t.BudgetId == b.BudgetId)
                    .Select(t => new
                    {
                        BudgetSet = t.AmountSet,
                        BudgetAmountBecomes = t.CumulativeInitialAfter,
                        Date = TimeZoneInfo.ConvertTimeFromUtc(t.CreatedAtUtc, IST).ToString("dd/MM/yyyy"),
                        Operation = t.Operation // InitialSet | TopUp | Reset
                    })
            });

            return Ok(result);
        }

        // ---------- Window ----------
        [HttpGet("window")]
        [Authorize(Policy = "RequireManager")]
        public IActionResult Window([FromQuery] int month, [FromQuery] int year)
        {
            var open = IsSetWindowOpen(DateTime.UtcNow, month, year);
            return Ok(new { month, year, isSetWindowOpen = open });
        }

        // ---------- Admin overview ----------
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

        // ---------- Manager overview ----------
        [HttpGet("overview")]
        [Authorize(Policy = "RequireManager")]
        public async Task<IActionResult> ManagerOverview([FromQuery] int month, [FromQuery] int year, CancellationToken ct)
        {
            var budgets = await _db.Budgets
                .Include(b => b.Category)
                .Where(b => b.Month == month && b.Year == year)
                .ToListAsync(ct);

            var overview = budgets.Select(b =>
            {
                var initial = b.InitialAmount;
                var remaining = b.RemainingAmount;
                var deducted = initial - remaining;
                var usage = initial == 0 ? 0 : Math.Round((double)(deducted / initial) * 100, 2);
                return new
                {
                    b.CategoryId,
                    CategoryName = b.Category.Name,
                    InitialMonthlyBudget = initial,
                    RemainingBudget = remaining,
                    ExpensesDeducted = deducted,
                    BudgetUsagePercent = usage,
                    BudgetSetBy = b.CreatedByManagerName
                };
            }).OrderBy(x => x.CategoryName).ToList();
            return Ok(overview);
        }

        // ---------- NEW: Clear ONE category budget (reset to 0) ----------
        public record ClearOneRequest(int CategoryId, int Month, int Year);

        [HttpPost("clear-one")]
        [Authorize(Policy = "RequireManager")]
        public async Task<IActionResult> ClearOne([FromBody] ClearOneRequest req, CancellationToken ct)
        {
            var user = await _userManager.GetUserAsync(User);
            if (user == null) return Unauthorized();

            var budget = await _db.Budgets
                .Include(b => b.Category)
                .FirstOrDefaultAsync(b => b.CategoryId == req.CategoryId && b.Month == req.Month && b.Year == req.Year, ct);

            if (budget == null)
                return NotFound(new { code = "BUDGET_NOT_FOUND", message = "No budget found for this category and month." });

            if (budget.CreatedByManagerId != user.Id)
                return Conflict(new { code = "BUDGET_CREATOR_CONFLICT", message = "Another manager created this budget." });

            budget.InitialAmount = 0m;
            budget.RemainingAmount = 0m;

            // History: Reset
            _db.BudgetAdjustments.Add(new BudgetAdjustment
            {
                BudgetId = budget.BudgetId,
                CategoryId = budget.CategoryId,
                Month = budget.Month,
                Year = budget.Year,
                AmountSet = 0m,
                CumulativeInitialAfter = 0m,
                CumulativeRemainingAfter = 0m,
                Operation = "Reset",
                ManagerId = user.Id,
                ManagerName = budget.CreatedByManagerName,
                CreatedAtUtc = DateTime.UtcNow
            });

            await _db.SaveChangesAsync(ct);
            return Ok(new
            {
                message = $"Cleared budget for {budget.Category?.Name ?? "Category"} (Month {req.Month}, {req.Year}).",
                budgetId = budget.BudgetId
            });
        }

        // ---------- NEW: Clear ALL budgets for the month (reset to 0) ----------
        public record ClearMonthRequest(int Month, int Year);

        [HttpPost("clear-month")]
        [Authorize(Policy = "RequireManager")]
        public async Task<IActionResult> ClearMonth([FromBody] ClearMonthRequest req, CancellationToken ct)
        {
            var user = await _userManager.GetUserAsync(User);
            if (user == null) return Unauthorized();

            var budgets = await _db.Budgets
                .Include(b => b.Category)
                .Where(b => b.Month == req.Month && b.Year == req.Year)
                .ToListAsync(ct);

            if (!budgets.Any())
                return Ok(new { message = "No budgets to clear for this month." });

            // Enforce your "same manager" rule for the month
            var creatorId = budgets.First().CreatedByManagerId;
            if (creatorId != user.Id)
                return Conflict(new { code = "BUDGET_CREATOR_CONFLICT", message = "Another manager created budgets for this month." });

            foreach (var b in budgets)
            {
                b.InitialAmount = 0m;
                b.RemainingAmount = 0m;

                _db.BudgetAdjustments.Add(new BudgetAdjustment
                {
                    BudgetId = b.BudgetId,
                    CategoryId = b.CategoryId,
                    Month = b.Month,
                    Year = b.Year,
                    AmountSet = 0m,
                    CumulativeInitialAfter = 0m,
                    CumulativeRemainingAfter = 0m,
                    Operation = "Reset",
                    ManagerId = user.Id,
                    ManagerName = b.CreatedByManagerName,
                    CreatedAtUtc = DateTime.UtcNow
                });
            }

            await _db.SaveChangesAsync(ct);
            return Ok(new
            {
                message = $"Cleared budgets for Month {req.Month}, {req.Year}.",
                count = budgets.Count
            });
        }
    }
}