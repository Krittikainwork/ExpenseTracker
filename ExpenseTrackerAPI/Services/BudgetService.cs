using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using System.Collections.Generic;
using ExpenseTrackerAPI.Data;
using ExpenseTrackerAPI.Models;
using ExpenseTrackerAPI.Services.Contracts;
using Microsoft.EntityFrameworkCore;
using System;

namespace ExpenseTrackerAPI.Services
{
    public class BudgetService : IBudgetService
    {
        private readonly AppDbContext _db;
        private static readonly TimeZoneInfo IST = TimeZoneInfo.FindSystemTimeZoneById(
#if WINDOWS
            "India Standard Time"
#else
            "Asia/Kolkata"
#endif
        );

        public BudgetService(AppDbContext db) => _db = db;

        private static string NormalizeRole(string r) => string.Equals(r, "Admin", StringComparison.OrdinalIgnoreCase) ? "Admin" : "Manager";

        public async Task SetBudgetAsync(int categoryId, decimal initialAmount, int month, int year, string setByRole, string callerUserId, bool callerIsAdmin, CancellationToken ct)
        {
            if (!string.Equals(setByRole, "Admin", StringComparison.OrdinalIgnoreCase) &&
                !string.Equals(setByRole, "Manager", StringComparison.OrdinalIgnoreCase))
                throw new ArgumentException("ROLE_REQUIRED");

            var actorRole = NormalizeRole(setByRole);

            var category = await _db.Categories.FindAsync(new object?[] { categoryId }, ct);
            if (category == null) throw new KeyNotFoundException("CATEGORY_NOT_FOUND");

            var existingForMonth = await _db.Budgets.Where(b => b.Month == month && b.Year == year).ToListAsync(ct);
            if (existingForMonth.Any() && !callerIsAdmin && existingForMonth.First().CreatedByManagerId != callerUserId)
                throw new InvalidOperationException("BUDGET_CREATOR_CONFLICT");

            var existing = await _db.Budgets.FirstOrDefaultAsync(b =>
                b.CategoryId == categoryId && b.Month == month && b.Year == year, ct);

            var nowUtc = DateTime.UtcNow;

            if (existing == null)
            {
                var budget = new Budget
                {
                    CategoryId = categoryId,
                    InitialAmount = initialAmount,
                    RemainingAmount = initialAmount,
                    Month = month,
                    Year = year,
                    CreatedDate = nowUtc,
                    CreatedByManagerId = callerUserId,
                    CreatedByManagerName = actorRole
                };
                _db.Budgets.Add(budget);
                await _db.SaveChangesAsync(ct);

                _db.BudgetAdjustments.Add(new BudgetAdjustment
                {
                    BudgetId = budget.BudgetId,
                    CategoryId = budget.CategoryId,
                    Month = budget.Month,
                    Year = budget.Year,
                    AmountSet = initialAmount,
                    CumulativeInitialAfter = budget.InitialAmount,
                    CumulativeRemainingAfter = budget.RemainingAmount,
                    Operation = "InitialSet",
                    ManagerId = callerUserId,
                    ManagerName = actorRole,
                    CreatedAtUtc = nowUtc
                });
            }
            else
            {
                if (!callerIsAdmin && existing.CreatedByManagerId != callerUserId)
                    throw new InvalidOperationException("BUDGET_CREATOR_CONFLICT");

                existing.InitialAmount += initialAmount;
                existing.RemainingAmount += initialAmount;
                existing.CreatedByManagerName = actorRole;

                _db.BudgetAdjustments.Add(new BudgetAdjustment
                {
                    BudgetId = existing.BudgetId,
                    CategoryId = existing.CategoryId,
                    Month = existing.Month,
                    Year = existing.Year,
                    AmountSet = initialAmount,
                    CumulativeInitialAfter = existing.InitialAmount,
                    CumulativeRemainingAfter = existing.RemainingAmount,
                    Operation = "TopUp",
                    ManagerId = callerUserId,
                    ManagerName = actorRole,
                    CreatedAtUtc = nowUtc
                });
            }

            await _db.SaveChangesAsync(ct);
        }

        public async Task<IEnumerable<object>> HistoryAsync(int year, CancellationToken ct)
        {
            var budgets = await _db.Budgets
                .Include(b => b.Category)
                .Where(b => b.Year == year)
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

            return grouped;
        }

        public async Task<IEnumerable<object>> HistoryDetailAsync(int month, int year, CancellationToken ct)
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
                .ThenByDescending(t => t.CreatedAtUtc) // newest-first
                .ToListAsync(ct);

            var result = budgets.Select(b => new
            {
                b.CategoryId,
                CategoryName = b.Category.Name,
                Month = b.Month,
                Year = b.Year,
                InitialMonthlyBudget = b.InitialAmount,
                RemainingBudget = b.RemainingAmount,
                ExpensesDeducted = b.InitialAmount - b.RemainingAmount,
                History = adjustments
                    .Where(t => t.BudgetId == b.BudgetId)
                    .Select(t => new
                    {
                        BudgetSet = t.AmountSet,
                        BudgetAmountBecomes = t.CumulativeInitialAfter,
                        Date = TimeZoneInfo.ConvertTimeFromUtc(t.CreatedAtUtc, IST).ToString("dd/MM/yyyy"),
                        Operation = t.Operation,
                        SetBy = t.ManagerName
                    })
            });

            return result;
        }

        public bool IsSetWindowOpen(int month, int year)
        {
            var nowIst = TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, IST);
            if (nowIst.Year != year || nowIst.Month != month) return false;
            return nowIst.Day >= 1 && nowIst.Day <= 10;
        }

        public async Task<IEnumerable<object>> ManagerOverviewAsync(int month, int year, CancellationToken ct)
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
            }).OrderBy(x => x.CategoryName);

            return overview;
        }

        public async Task<object> AdminOverviewAsync(int month, int year, CancellationToken ct)
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

            return new { totals, categories };
        }

        public async Task ClearOneAsync(int categoryId, int month, int year, string setByRole, string callerUserId, bool callerIsAdmin, CancellationToken ct)
        {
            if (!string.Equals(setByRole, "Admin", StringComparison.OrdinalIgnoreCase) &&
                !string.Equals(setByRole, "Manager", StringComparison.OrdinalIgnoreCase))
                throw new ArgumentException("ROLE_REQUIRED");

            var actorRole = NormalizeRole(setByRole);

            var budget = await _db.Budgets
                .Include(b => b.Category)
                .FirstOrDefaultAsync(b => b.CategoryId == categoryId && b.Month == month && b.Year == year, ct);

            if (budget == null) throw new KeyNotFoundException("BUDGET_NOT_FOUND");
            if (!callerIsAdmin && budget.CreatedByManagerId != callerUserId)
                throw new InvalidOperationException("BUDGET_CREATOR_CONFLICT");

            budget.InitialAmount = 0m;
            budget.RemainingAmount = 0m;
            budget.CreatedByManagerName = actorRole;

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
                ManagerId = callerUserId,
                ManagerName = actorRole,
                CreatedAtUtc = DateTime.UtcNow
            });

            await _db.SaveChangesAsync(ct);
        }

        public async Task<int> ClearMonthAsync(int month, int year, string setByRole, string callerUserId, bool callerIsAdmin, CancellationToken ct)
        {
            if (!string.Equals(setByRole, "Admin", StringComparison.OrdinalIgnoreCase) &&
                !string.Equals(setByRole, "Manager", StringComparison.OrdinalIgnoreCase))
                throw new ArgumentException("ROLE_REQUIRED");

            var actorRole = NormalizeRole(setByRole);

            var budgets = await _db.Budgets
                .Include(b => b.Category)
                .Where(b => b.Month == month && b.Year == year)
                .ToListAsync(ct);

            if (!budgets.Any()) return 0;

            var creatorId = budgets.First().CreatedByManagerId;
            if (!callerIsAdmin && creatorId != callerUserId)
                throw new InvalidOperationException("BUDGET_CREATOR_CONFLICT");

            foreach (var b in budgets)
            {
                b.InitialAmount = 0m;
                b.RemainingAmount = 0m;
                b.CreatedByManagerName = actorRole;

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
                    ManagerId = callerUserId,
                    ManagerName = actorRole,
                    CreatedAtUtc = DateTime.UtcNow
                });
            }

            await _db.SaveChangesAsync(ct);
            return budgets.Count;
        }
    }
}