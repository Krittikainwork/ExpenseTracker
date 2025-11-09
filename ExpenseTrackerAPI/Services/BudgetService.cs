using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using System.Collections.Generic;
using ExpenseTrackerAPI.Data;
using ExpenseTrackerAPI.Models;
using ExpenseTrackerAPI.Services.Contracts;
using Microsoft.EntityFrameworkCore;
using System;
using Microsoft.Extensions.Logging;
using ExpenseTrackerAPI.Domain;

namespace ExpenseTrackerAPI.Services
{
    public class BudgetService : IBudgetService
    {
        private readonly AppDbContext _db;
        private readonly ILogger<BudgetService> _logger;

        private static readonly TimeZoneInfo IST = TimeZoneInfo.FindSystemTimeZoneById(
#if WINDOWS
            "India Standard Time"
#else
            "Asia/Kolkata"
#endif
        );

        public BudgetService(AppDbContext db, ILogger<BudgetService> logger)
        {
            _db = db;
            _logger = logger;
        }

        private static string NormalizeRole(string r) =>
            string.Equals(r, "Admin", StringComparison.OrdinalIgnoreCase) ? "Admin" : "Manager";

        public async Task SetBudgetAsync(int categoryId, decimal initialAmount, int month, int year,
            string setByRole, string callerUserId, bool callerIsAdmin, CancellationToken ct)
        {
            await using var tx = await _db.Database.BeginTransactionAsync(ct);
            try
            {
                if (!string.Equals(setByRole, "Admin", StringComparison.OrdinalIgnoreCase) &&
                    !string.Equals(setByRole, "Manager", StringComparison.OrdinalIgnoreCase))
                    throw new ValidationException("ROLE_REQUIRED");

                var actorRole = NormalizeRole(setByRole);
                var category = await _db.Categories.FindAsync(new object?[] { categoryId }, ct);
                if (category == null) throw new NotFoundException("Category", categoryId);

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
                    await _db.SaveChangesAsync(ct); // keep to preserve ID creation timing

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
                    existing.InitialAmount += initialAmount;
                    existing.RemainingAmount += initialAmount;
                    existing.CreatedByManagerId = callerUserId;
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
                await tx.CommitAsync(ct);
            }
            catch (Exception ex)
            {
                await tx.RollbackAsync(ct);
                _logger.LogError(ex, "BudgetService.SetBudgetAsync failed for category={CategoryId}, month={Month}, year={Year}", categoryId, month, year);
                throw;
            }
        }

        public async Task<IEnumerable<object>> HistoryDetailAsync(int month, int year, CancellationToken ct)
        {
            try
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
                    .ThenByDescending(t => t.CreatedAtUtc)
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
            catch (Exception ex)
            {
                _logger.LogError(ex, "BudgetService.HistoryDetailAsync failed for month={Month}, year={Year}", month, year);
                throw;
            }
        }

        public async Task<IEnumerable<object>> ManagerOverviewAsync(int month, int year, CancellationToken ct)
        {
            try
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
            catch (Exception ex)
            {
                _logger.LogError(ex, "BudgetService.ManagerOverviewAsync failed for month={Month}, year={Year}", month, year);
                throw;
            }
        }

        public async Task ClearOneAsync(int categoryId, int month, int year,
            string setByRole, string callerUserId, bool callerIsAdmin, CancellationToken ct)
        {
            await using var tx = await _db.Database.BeginTransactionAsync(ct);
            try
            {
                if (!string.Equals(setByRole, "Admin", StringComparison.OrdinalIgnoreCase) &&
                    !string.Equals(setByRole, "Manager", StringComparison.OrdinalIgnoreCase))
                    throw new ValidationException("ROLE_REQUIRED");

                var actorRole = NormalizeRole(setByRole);
                var budget = await _db.Budgets
                    .Include(b => b.Category)
                    .FirstOrDefaultAsync(b => b.CategoryId == categoryId && b.Month == month && b.Year == year, ct);
                if (budget == null) throw new NotFoundException("Budget", $"{categoryId}-{month}-{year}");

                budget.InitialAmount = 0m;
                budget.RemainingAmount = 0m;
                budget.CreatedByManagerId = callerUserId;
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
                await tx.CommitAsync(ct);
            }
            catch (Exception ex)
            {
                await tx.RollbackAsync(ct);
                _logger.LogError(ex, "BudgetService.ClearOneAsync failed for category={CategoryId}, month={Month}, year={Year}", categoryId, month, year);
                throw;
            }
        }

        public async Task<int> ClearMonthAsync(int month, int year,
            string setByRole, string callerUserId, bool callerIsAdmin, CancellationToken ct)
        {
            await using var tx = await _db.Database.BeginTransactionAsync(ct);
            try
            {
                if (!string.Equals(setByRole, "Admin", StringComparison.OrdinalIgnoreCase) &&
                    !string.Equals(setByRole, "Manager", StringComparison.OrdinalIgnoreCase))
                    throw new ValidationException("ROLE_REQUIRED");

                var actorRole = NormalizeRole(setByRole);
                var budgets = await _db.Budgets
                    .Include(b => b.Category)
                    .Where(b => b.Month == month && b.Year == year)
                    .ToListAsync(ct);
                if (!budgets.Any()) return 0;

                foreach (var b in budgets)
                {
                    b.InitialAmount = 0m;
                    b.RemainingAmount = 0m;
                    b.CreatedByManagerId = callerUserId;
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
                await tx.CommitAsync(ct);
                return budgets.Count;
            }
            catch (Exception ex)
            {
                await tx.RollbackAsync(ct);
                _logger.LogError(ex, "BudgetService.ClearMonthAsync failed for month={Month}, year={Year}", month, year);
                throw;
            }
        }
    }
}