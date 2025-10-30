using System.Threading;
using System.Threading.Tasks;
using System.Collections.Generic;

namespace ExpenseTrackerAPI.Services.Contracts
{
    public interface IBudgetService
    {
        Task SetBudgetAsync(int categoryId, decimal initialAmount, int month, int year, string setByRole, string callerUserId, bool callerIsAdmin, CancellationToken ct);
        Task<IEnumerable<object>> HistoryAsync(int year, CancellationToken ct);
        Task<IEnumerable<object>> HistoryDetailAsync(int month, int year, CancellationToken ct);
        bool IsSetWindowOpen(int month, int year); // your controller exposes this
        Task<IEnumerable<object>> ManagerOverviewAsync(int month, int year, CancellationToken ct);
        Task<object> AdminOverviewAsync(int month, int year, CancellationToken ct);
        Task ClearOneAsync(int categoryId, int month, int year, string setByRole, string callerUserId, bool callerIsAdmin, CancellationToken ct);
        Task<int> ClearMonthAsync(int month, int year, string setByRole, string callerUserId, bool callerIsAdmin, CancellationToken ct);
    }
}