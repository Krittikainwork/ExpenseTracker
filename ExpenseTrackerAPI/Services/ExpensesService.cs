using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using System.Collections.Generic;
using ExpenseTrackerAPI.Data;
using ExpenseTrackerAPI.Models;
using ExpenseTrackerAPI.Services.Contracts;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using System;
using Microsoft.Extensions.Logging;
using ExpenseTrackerAPI.Domain;

namespace ExpenseTrackerAPI.Services
{
    public class ExpensesService : IExpensesService
    {
        private readonly AppDbContext _db;
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly NotificationService _notify;
        private readonly ILogger<ExpensesService> _logger;

        public ExpensesService(AppDbContext db, UserManager<ApplicationUser> userManager, NotificationService notify, ILogger<ExpensesService> logger)
        {
            _db = db;
            _userManager = userManager;
            _notify = notify;
            _logger = logger;
        }

        public async Task<int> SubmitAsync(SubmitExpenseRequest req, string userId, CancellationToken ct)
        {
            try
            {
                var user = await _userManager.FindByIdAsync(userId);
                if (user is null) throw new UnauthorizedAccessException();
                var category = await _db.Categories.FindAsync(new object?[] { req.CategoryId }, ct);
                if (category == null) throw new NotFoundException("Category", req.CategoryId);

                var e = new Expense
                {
                    EmployeeId = user.EmployeeId ?? user.Id,
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
                return e.ExpenseId;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "ExpensesService.SubmitAsync failed for userId={UserId}, request={Req}", userId, req);
                throw;
            }
        }

        public async Task<IReadOnlyList<MyExpenseRow>> GetMyAsync(string employeeId, CancellationToken ct)
        {
            try
            {
                var rows = await _db.Expenses
                    .Include(x => x.Category)
                    .Where(x => x.EmployeeId == employeeId)
                    .OrderByDescending(x => x.DateSubmitted)
                    .Select(e => new MyExpenseRow(
                        e.ExpenseId, e.Title, e.Amount, e.Category.Name,
                        e.ExpenseDate, e.DateSubmitted, e.Status,
                        e.ManagerName == null ? null : $"{e.ManagerName} ({e.ManagerOfficialId})",
                        e.ManagerComment, e.AdminComment))
                    .ToListAsync(ct);
                return rows;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "ExpensesService.GetMyAsync failed for employeeId={EmployeeId}", employeeId);
                throw;
            }
        }

        public async Task<IReadOnlyList<PendingExpenseRow>> GetPendingAsync(CancellationToken ct)
        {
            try
            {
                var rows = await _db.Expenses
                    .Include(e => e.Category)
                    .Where(e => e.Status == "Pending")
                    .OrderBy(e => e.DateSubmitted)
                    .Select(e => new PendingExpenseRow(
                        e.ExpenseId, e.EmployeeName, e.EmployeeId, e.Title,
                        e.Amount, e.Category.Name, e.ExpenseDate, e.DateSubmitted))
                    .ToListAsync(ct);
                return rows;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "ExpensesService.GetPendingAsync failed");
                throw;
            }
        }

        public async Task ApproveAsync(int id, ApproveExpenseRequest req, CancellationToken ct)
        {
            await using var tx = await _db.Database.BeginTransactionAsync(ct);
            try
            {
                var expense = await _db.Expenses.Include(e => e.Category).FirstOrDefaultAsync(e => e.ExpenseId == id, ct);
                if (expense is null) throw new NotFoundException("Expense", id);
                if (expense.Status != "Pending") throw new NotAllowedException("NOT_PENDING");

                var month = expense.ExpenseDate.Month; var year = expense.ExpenseDate.Year;
                var budget = await _db.Budgets.FirstOrDefaultAsync(b =>
                    b.CategoryId == expense.CategoryId && b.Month == month && b.Year == year, ct);
                if (budget is null) throw new NotAllowedException("BUDGET_NOT_FOUND");

                if (budget.RemainingAmount < expense.Amount)
                    throw new InsufficientBudgetException(expense.Amount, budget.RemainingAmount);

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
                await tx.CommitAsync(ct);

                var user = await _userManager.Users.FirstOrDefaultAsync(u => u.EmployeeId == expense.EmployeeId, ct);
                if (user != null)
                {
                    try
                    {
                        await _notify.CreateForUserAsync(user.Id, $"Your expense \"{expense.Title}\" has been approved.", ct);
                    }
                    catch (Exception nEx)
                    {
                        _logger.LogWarning(nEx, "Notification failed after approval for id={ExpenseId}", id);
                    }
                }
            }
            catch (DbUpdateConcurrencyException ex)
            {
                await tx.RollbackAsync(ct);
                _logger.LogError(ex, "ExpensesService.ApproveAsync concurrency conflict for id={ExpenseId}", id);
                throw new ConcurrencyConflictException("Concurrent update detected.", ex);
            }
            catch (Exception ex)
            {
                await tx.RollbackAsync(ct);
                _logger.LogError(ex, "ExpensesService.ApproveAsync failed for id={ExpenseId}, request={Req}", id, req);
                throw;
            }
        }

        public async Task RejectAsync(int id, RejectExpenseRequest req, CancellationToken ct)
        {
            try
            {
                var expense = await _db.Expenses.FirstOrDefaultAsync(e => e.ExpenseId == id, ct);
                if (expense is null) throw new NotFoundException("Expense", id);
                if (expense.Status != "Pending") throw new NotAllowedException("NOT_PENDING");

                expense.Status = "Rejected";
                expense.ManagerName = req.ManagerName;
                expense.ManagerOfficialId = req.ManagerOfficialId;
                expense.ManagerComment = req.ManagerComment;
                expense.DateReviewed = DateTime.UtcNow;

                await _db.SaveChangesAsync(ct);

                var user = await _userManager.Users.FirstOrDefaultAsync(u => u.EmployeeId == expense.EmployeeId, ct);
                if (user != null)
                    await _notify.CreateForUserAsync(user.Id, $"Your expense \"{expense.Title}\" has been rejected.", ct);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "ExpensesService.RejectAsync failed for id={ExpenseId}, request={Req}", id, req);
                throw;
            }
        }

        public async Task<IReadOnlyList<ProcessedExpenseRow>> GetProcessedAsync(CancellationToken ct)
        {
            try
            {
                var rows = await _db.Expenses
                    .Include(e => e.Category)
                    .Where(e => e.Status != "Pending")
                    .OrderByDescending(e => e.DateReviewed)
                    .Select(e => new ProcessedExpenseRow(
                        e.ExpenseId, e.EmployeeName, e.EmployeeId, e.Title,
                        e.Amount, e.Category.Name, e.DateSubmitted, e.Status,
                        e.ManagerName, e.ManagerComment, e.AdminComment))
                    .ToListAsync(ct);
                return rows;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "ExpensesService.GetProcessedAsync failed");
                throw;
            }
        }

        public async Task<IReadOnlyList<AdminAllExpenseRow>> GetAllAsync(int? month, int? year, CancellationToken ct)
        {
            try
            {
                var q = _db.Expenses.Include(e => e.Category).AsQueryable();
                if (month.HasValue) q = q.Where(e => e.ExpenseDate.Month == month.Value);
                if (year.HasValue) q = q.Where(e => e.ExpenseDate.Year == year.Value);

                var rows = await q
                    .OrderByDescending(e => e.DateSubmitted)
                    .Select(e => new AdminAllExpenseRow(
                        e.ExpenseId, e.EmployeeName, e.Title, e.Amount,
                        e.Category.Name, e.DateSubmitted, e.Status,
                        e.ManagerName, e.ManagerComment, e.AdminComment))
                    .ToListAsync(ct);
                return rows;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "ExpensesService.GetAllAsync failed for month={Month}, year={Year}", month, year);
                throw;
            }
        }

        public async Task AdminCommentAsync(int id, AdminCommentRequest req, CancellationToken ct)
        {
            try
            {
                var expense = await _db.Expenses.FirstOrDefaultAsync(e => e.ExpenseId == id, ct);
                if (expense is null) throw new NotFoundException("Expense", id);

                expense.AdminComment = req.Comment;
                await _db.SaveChangesAsync(ct);
                await _notify.CreateForRoleAsync("Manager", $"Admin commented on expense \"{expense.Title}\": {req.Comment}", ct);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "ExpensesService.AdminCommentAsync failed for id={ExpenseId}, request={Req}", id, req);
                throw;
            }
        }
    }
}
