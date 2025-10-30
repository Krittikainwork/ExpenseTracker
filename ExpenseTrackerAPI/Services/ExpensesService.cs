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

namespace ExpenseTrackerAPI.Services
{
    public class ExpensesService : IExpensesService
    {
        private readonly AppDbContext _db;
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly NotificationService _notify;

        public ExpensesService(AppDbContext db, UserManager<ApplicationUser> userManager, NotificationService notify)
        {
            _db = db;
            _userManager = userManager;
            _notify = notify;
        }

        public async Task<int> SubmitAsync(SubmitExpenseRequest req, string userId, CancellationToken ct)
        {
            var user = await _userManager.FindByIdAsync(userId);
            if (user is null) throw new UnauthorizedAccessException();

            var category = await _db.Categories.FindAsync(new object?[] { req.CategoryId }, ct);
            if (category == null) throw new KeyNotFoundException("CATEGORY_NOT_FOUND");

            var e = new Expense
            {
                EmployeeId    = user.EmployeeId ?? user.Id,
                EmployeeName  = user.FullName ?? user.Email ?? "Employee",
                Title         = req.Title,
                Amount        = req.Amount,
                CategoryId    = req.CategoryId,
                Status        = "Pending",
                DateSubmitted = DateTime.UtcNow,
                ExpenseDate   = req.ExpenseDate.Date
            };

            _db.Expenses.Add(e);
            await _db.SaveChangesAsync(ct);

            await _notify.CreateForRoleAsync("Manager", $"New expense request: {e.Title} by {e.EmployeeName}", ct);

            return e.ExpenseId;
        }

        public async Task<IReadOnlyList<MyExpenseRow>> GetMyAsync(string employeeId, CancellationToken ct)
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

        public async Task<IReadOnlyList<PendingExpenseRow>> GetPendingAsync(CancellationToken ct)
        {
            var rows = await _db.Expenses
                .Include(e => e.Category)
                .Where(e => e.Status == "Pending")
                .OrderBy(e => e.DateSubmitted)
                .Select(e => new PendingExpenseRow(
                    e.ExpenseId, e.EmployeeName, e.EmployeeId, e.Title,
                    e.Amount, e.Category.Name, e.DateSubmitted))
                .ToListAsync(ct);

            return rows;
        }

        public async Task ApproveAsync(int id, ApproveExpenseRequest req, CancellationToken ct)
        {
            var expense = await _db.Expenses.Include(e => e.Category).FirstOrDefaultAsync(e => e.ExpenseId == id, ct);
            if (expense is null) throw new KeyNotFoundException("EXPENSE_NOT_FOUND");
            if (expense.Status != "Pending") throw new InvalidOperationException("NOT_PENDING");

            var month = expense.ExpenseDate.Month; var year = expense.ExpenseDate.Year;
            var budget = await _db.Budgets.FirstOrDefaultAsync(b =>
                b.CategoryId == expense.CategoryId && b.Month == month && b.Year == year, ct);
            if (budget is null) throw new InvalidOperationException("BUDGET_NOT_FOUND");
            if (budget.RemainingAmount < expense.Amount)
                throw new InvalidOperationException("INSUFFICIENT_BUDGET");

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

            var user = await _userManager.Users.FirstOrDefaultAsync(u => u.EmployeeId == expense.EmployeeId, ct);
            if (user != null)
                await _notify.CreateForUserAsync(user.Id, $"Your expense \"{expense.Title}\" has been approved.", ct);
        }

        public async Task RejectAsync(int id, RejectExpenseRequest req, CancellationToken ct)
        {
            var expense = await _db.Expenses.FirstOrDefaultAsync(e => e.ExpenseId == id, ct);
            if (expense is null) throw new KeyNotFoundException("EXPENSE_NOT_FOUND");
            if (expense.Status != "Pending") throw new InvalidOperationException("NOT_PENDING");

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

        public async Task<IReadOnlyList<ProcessedExpenseRow>> GetProcessedAsync(CancellationToken ct)
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

        public async Task<IReadOnlyList<AdminAllExpenseRow>> GetAllAsync(int? month, int? year, CancellationToken ct)
        {
            var q = _db.Expenses.Include(e => e.Category).AsQueryable();
            if (month.HasValue) q = q.Where(e => e.ExpenseDate.Month == month.Value);
            if (year.HasValue)  q = q.Where(e => e.ExpenseDate.Year  == year.Value);

            var rows = await q
                .OrderByDescending(e => e.DateSubmitted)
                .Select(e => new AdminAllExpenseRow(
                    e.ExpenseId, e.EmployeeName, e.Title, e.Amount,
                    e.Category.Name, e.DateSubmitted, e.Status,
                    e.ManagerName, e.ManagerComment, e.AdminComment))
                .ToListAsync(ct);

            return rows;
        }

        public async Task AdminCommentAsync(int id, AdminCommentRequest req, CancellationToken ct)
        {
            var expense = await _db.Expenses.FirstOrDefaultAsync(e => e.ExpenseId == id, ct);
            if (expense is null) throw new KeyNotFoundException("EXPENSE_NOT_FOUND");

            expense.AdminComment = req.Comment;
            await _db.SaveChangesAsync(ct);

            await _notify.CreateForRoleAsync("Manager", $"Admin commented on expense \"{expense.Title}\": {req.Comment}", ct);
        }
    }
}