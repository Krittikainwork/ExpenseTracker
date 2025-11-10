

namespace ExpenseTrackerAPI.Services.Contracts
{
    public record NotificationDto(int NotificationId, string Message, bool IsRead, DateTime CreatedAt);

    public interface INotificationQueryService
    {
        Task<IReadOnlyList<NotificationDto>> GetForUserAsync(string userId, CancellationToken ct);
        Task<int> ClearAllAsync(string userId, CancellationToken ct);
    }
}