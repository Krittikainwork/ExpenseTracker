using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using System.Collections.Generic;
using ExpenseTrackerAPI.Data;
using ExpenseTrackerAPI.Models;
using ExpenseTrackerAPI.Services.Contracts;
using Microsoft.EntityFrameworkCore;
using ExpenseTrackerAPI.Services;
using System;

namespace ExpenseTrackerAPI.Services
{
    public class ReimbursementsService : IReimbursementsService
    {
        private readonly AppDbContext _db;
        private readonly NotificationService _notify;

        public ReimbursementsService(AppDbContext db, NotificationService notify)
        {
            _db = db;
            _notify = notify;
        }

        public async Task<IReadOnlyList<ReimbursementMapItem>> MapAsync(int month, int year, CancellationToken ct)
        {
            var reimbursements = await _db.Reimbursements
                .Include(r => r.Expense)
                .Where(r => r.Expense.DateSubmitted.Month == month && r.Expense.DateSubmitted.Year == year)
                .Select(r => new ReimbursementMapItem(r.ExpenseId, true, r.PaidDateUtc, r.Reference))
                .ToListAsync(ct);

            return reimbursements;
        }

        public async Task<IReadOnlyList<ReimbursementMapItem>> MapAllAsync(CancellationToken ct)
        {
            var reimbursements = await _db.Reimbursements
                .Select(r => new ReimbursementMapItem(r.ExpenseId, true, r.PaidDateUtc, r.Reference))
                .ToListAsync(ct);

            return reimbursements;
        }

        public async Task MarkPaidAsync(int expenseId, string reference, decimal amount, string adminUserId, CancellationToken ct)
        {
            if (string.IsNullOrWhiteSpace(reference))
                throw new ArgumentException("REFERENCE_REQUIRED");
            if (amount <= 0)
                throw new ArgumentException("AMOUNT_REQUIRED");

            var admin = await _db.Users.FirstOrDefaultAsync(u => u.Id == adminUserId, ct);
            if (admin is null) throw new UnauthorizedAccessException();

            var expense = await _db.Expenses
                .Include(e => e.Category)
                .FirstOrDefaultAsync(e => e.ExpenseId == expenseId, ct);
            if (expense is null) throw new KeyNotFoundException("EXPENSE_NOT_FOUND");

            var status = (expense.Status ?? "").Trim();
            if (!string.Equals(status, "Approved", StringComparison.OrdinalIgnoreCase))
                throw new InvalidOperationException("NOT_APPROVED");

            var exists = await _db.Reimbursements.AnyAsync(r => r.ExpenseId == expenseId, ct);
            if (exists) throw new InvalidOperationException("ALREADY_REIMBURSED");

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

            // Employee notification with UTR via producer
            var employeeUser = await _db.Users.FirstOrDefaultAsync(u => u.EmployeeId == expense.EmployeeId, ct);
            if (employeeUser != null)
            {
                var message = $"Your {expense.Category?.Name ?? "expense"} expense has been reimbursed having transaction ID {reimb.Reference}.";
                await _notify.CreateForUserAsync(employeeUser.Id, message, ct);
            }

            await _db.SaveChangesAsync(ct);
        }

        public async Task<IReadOnlyList<ReimbursementMapItem>> MyStatusAsync(string employeeId, CancellationToken ct)
        {
            var data = await _db.Reimbursements
                .Include(r => r.Expense)
                .Where(r => r.Expense.EmployeeId == employeeId)
                .Select(r => new ReimbursementMapItem(r.ExpenseId, true, r.PaidDateUtc, r.Reference))
                .ToListAsync(ct);

            return data;
        }
    }
}