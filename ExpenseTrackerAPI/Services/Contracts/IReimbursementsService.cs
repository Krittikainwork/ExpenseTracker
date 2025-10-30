using System.Threading;
using System.Threading.Tasks;
using System.Collections.Generic;
using System;

namespace ExpenseTrackerAPI.Services.Contracts
{
    public record ReimbursementMapItem(int ExpenseId, bool IsReimbursed, DateTime? PaidDateUtc, string? Reference);

    public interface IReimbursementsService
    {
        Task<IReadOnlyList<ReimbursementMapItem>> MapAsync(int month, int year, CancellationToken ct);
        Task<IReadOnlyList<ReimbursementMapItem>> MapAllAsync(CancellationToken ct);
        Task MarkPaidAsync(int expenseId, string reference, decimal amount, string adminUserId, CancellationToken ct);
        Task<IReadOnlyList<ReimbursementMapItem>> MyStatusAsync(string employeeId, CancellationToken ct);
    }
}