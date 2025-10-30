using System.Threading;
using System.Threading.Tasks;
using System.Collections.Generic;
using System;

namespace ExpenseTrackerAPI.Services.Contracts
{
    // Controller DTOs mirrored (keeps API contract intact)
    public record SubmitExpenseRequest(string Title, decimal Amount, int CategoryId, DateTime ExpenseDate);
    public record ApproveExpenseRequest(string ManagerName, string ManagerOfficialId, string? ManagerComment);
    public record RejectExpenseRequest(string ManagerName, string ManagerOfficialId, string? ManagerComment);
    public record AdminCommentRequest(string Comment);

    public record MyExpenseRow(
        int ExpenseId, string Title, decimal Amount, string CategoryName,
        DateTime ExpenseDate, DateTime DateSubmitted, string Status,
        string? Manager, string? ManagerComment, string? AdminComment
    );

    public record PendingExpenseRow(
        int ExpenseId, string EmployeeName, string EmployeeID,
        string Title, decimal Amount, string Category, DateTime DateSubmitted
    );

    public record ProcessedExpenseRow(
        int ExpenseId, string EmployeeName, string EmployeeID, string Title,
        decimal Amount, string Category, DateTime DateSubmitted, string Status,
        string? Manager, string? ManagerComment, string? AdminComment
    );

    public record AdminAllExpenseRow(
        int ExpenseId, string Employee, string Title, decimal Amount, string Category,
        DateTime Date, string Status, string? Manager, string? ManagerComment, string? AdminComment
    );

    public interface IExpensesService
    {
        Task<int> SubmitAsync(SubmitExpenseRequest req, string userId, CancellationToken ct);
        Task<IReadOnlyList<MyExpenseRow>> GetMyAsync(string employeeId, CancellationToken ct);

        Task<IReadOnlyList<PendingExpenseRow>> GetPendingAsync(CancellationToken ct);
        Task ApproveAsync(int expenseId, ApproveExpenseRequest req, CancellationToken ct);
        Task RejectAsync(int expenseId, RejectExpenseRequest req, CancellationToken ct);

        Task<IReadOnlyList<ProcessedExpenseRow>> GetProcessedAsync(CancellationToken ct);
        Task<IReadOnlyList<AdminAllExpenseRow>> GetAllAsync(int? month, int? year, CancellationToken ct);

        Task AdminCommentAsync(int expenseId, AdminCommentRequest req, CancellationToken ct);
    }
}