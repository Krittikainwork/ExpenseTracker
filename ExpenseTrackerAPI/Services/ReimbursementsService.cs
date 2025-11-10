
using ExpenseTrackerAPI.Data;
using ExpenseTrackerAPI.Models;
using ExpenseTrackerAPI.Services.Contracts;
using Microsoft.EntityFrameworkCore;
using ExpenseTrackerAPI.Domain;

namespace ExpenseTrackerAPI.Services
{
    public class ReimbursementsService : IReimbursementsService
    {
        private readonly AppDbContext _db;
        private readonly NotificationService _notify;
        private readonly ILogger<ReimbursementsService> _logger;

        public ReimbursementsService(AppDbContext db, NotificationService notify, ILogger<ReimbursementsService> logger)
        {
            _db = db;
            _notify = notify;
            _logger = logger;
        }

        public async Task<IReadOnlyList<ReimbursementMapItem>> MapAsync(int month, int year, CancellationToken ct)
        {
            try
            {
                var reimbursements = await _db.Reimbursements
                    .Include(r => r.Expense)
                    .Where(r => r.Expense.DateSubmitted.Month == month && r.Expense.DateSubmitted.Year == year)
                    .Select(r => new ReimbursementMapItem(r.ExpenseId, true, r.PaidDateUtc, r.Reference))
                    .ToListAsync(ct);
                return reimbursements;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "ReimbursementsService.MapAsync failed for month={Month}, year={Year}", month, year);
                throw;
            }
        }

        public async Task<IReadOnlyList<ReimbursementMapItem>> MapAllAsync(CancellationToken ct)
        {
            try
            {
                var reimbursements = await _db.Reimbursements
                    .Select(r => new ReimbursementMapItem(r.ExpenseId, true, r.PaidDateUtc, r.Reference))
                    .ToListAsync(ct);
                return reimbursements;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "ReimbursementsService.MapAllAsync failed");
                throw;
            }
        }

        public async Task MarkPaidAsync(int expenseId, string reference, decimal amount, string adminUserId, CancellationToken ct)
        {
            await using var tx = await _db.Database.BeginTransactionAsync(ct);
            try
            {
                if (string.IsNullOrWhiteSpace(reference))
                    throw new ValidationException("REFERENCE_REQUIRED");
                if (amount <= 0)
                    throw new ValidationException("AMOUNT_REQUIRED");

                var admin = await _db.Users.FirstOrDefaultAsync(u => u.Id == adminUserId, ct);
                if (admin is null) throw new UnauthorizedAccessException();

                var expense = await _db.Expenses
                    .Include(e => e.Category)
                    .FirstOrDefaultAsync(e => e.ExpenseId == expenseId, ct);
                if (expense is null) throw new NotFoundException("Expense", expenseId);

                var status = (expense.Status ?? "").Trim();
                if (!string.Equals(status, "Approved", StringComparison.OrdinalIgnoreCase))
                    throw new NotAllowedException("NOT_APPROVED");

                var exists = await _db.Reimbursements.AnyAsync(r => r.ExpenseId == expenseId, ct);
                if (exists) throw new NotAllowedException("ALREADY_REIMBURSED");

                var reimb = new Reimbursement
                {
                    ExpenseId = expenseId,
                    Amount = amount,
                    Status = "Paid",
                    PaidDateUtc = DateTime.UtcNow,
                    Reference = reference.Trim(),
                    ReimbursedByUserId = admin.Id,
                    ReimbursedByName = admin.FullName ?? admin.Email ?? "Admin",
                    CreatedAtUtc = DateTime.UtcNow
                };
                _db.Reimbursements.Add(reimb);

                //  Preserve original behavior: notification before SaveChanges
                var employeeUser = await _db.Users.FirstOrDefaultAsync(u => u.EmployeeId == expense.EmployeeId, ct);
                if (employeeUser != null)
                {
                    var message = $"Your expense '{expense.Title}' has been reimbursed having transaction ID {reimb.Reference}.";
                    try
                    {
                        await _notify.CreateForUserAsync(employeeUser.Id, message, ct);
                    }
                    catch (Exception nEx)
                    {
                        _logger.LogWarning(nEx, "ReimbursementsService.MarkPaidAsync notification failed for expenseId={ExpenseId}", expenseId);
                    }
                }

                await _db.SaveChangesAsync(ct);
                await tx.CommitAsync(ct);
            }
            catch (DbUpdateConcurrencyException ex)
            {
                await tx.RollbackAsync(ct);
                _logger.LogError(ex, "ReimbursementsService.MarkPaidAsync concurrency conflict for expenseId={ExpenseId}", expenseId);
                throw new ConcurrencyConflictException("Concurrent update detected.", ex);
            }
            catch (Exception ex)
            {
                await tx.RollbackAsync(ct);
                _logger.LogError(ex, "ReimbursementsService.MarkPaidAsync failed for expenseId={ExpenseId}", expenseId);
                throw;
            }
        }

        public async Task<IReadOnlyList<ReimbursementMapItem>> MyStatusAsync(string employeeId, CancellationToken ct)
        {
            try
            {
                var data = await _db.Reimbursements
                    .Include(r => r.Expense)
                    .Where(r => r.Expense.EmployeeId == employeeId)
                    .Select(r => new ReimbursementMapItem(r.ExpenseId, true, r.PaidDateUtc, r.Reference))
                    .ToListAsync(ct);
                return data;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "ReimbursementsService.MyStatusAsync failed for employeeId={EmployeeId}", employeeId);
                throw;
            }
        }
    }
}
