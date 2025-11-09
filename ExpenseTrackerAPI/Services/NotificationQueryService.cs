using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using System.Collections.Generic;
using ExpenseTrackerAPI.Data;
using ExpenseTrackerAPI.Services.Contracts;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace ExpenseTrackerAPI.Services
{
    public class NotificationQueryService : INotificationQueryService
    {
        private readonly AppDbContext _db;
        private readonly ILogger<NotificationQueryService> _logger;

        public NotificationQueryService(AppDbContext db, ILogger<NotificationQueryService> logger)
        {
            _db = db;
            _logger = logger;
        }

        public async Task<IReadOnlyList<NotificationDto>> GetForUserAsync(string userId, CancellationToken ct)
        {
            try
            {
                var items = await _db.NotificationRecords
                    .Where(n => n.RecipientId == userId)
                    .OrderByDescending(n => n.CreatedAt)
                    .Select(n => new NotificationDto(n.NotificationId, n.Message, n.IsRead, n.CreatedAt))
                    .ToListAsync(ct);

                return items;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "NotificationQueryService.GetForUserAsync failed for userId={UserId}", userId);
                throw;
            }
        }

        public async Task<int> ClearAllAsync(string userId, CancellationToken ct)
        {
            try
            {
                var toDelete = await _db.NotificationRecords
                    .Where(n => n.RecipientId == userId)
                    .ToListAsync(ct);

                if (toDelete.Count == 0) return 0;

                _db.NotificationRecords.RemoveRange(toDelete);
                return await _db.SaveChangesAsync(ct);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "NotificationQueryService.ClearAllAsync failed for userId={UserId}", userId);
                throw;
            }
        }
    }
}
