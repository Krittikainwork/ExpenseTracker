using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using System.Collections.Generic;
using ExpenseTrackerAPI.Data;
using ExpenseTrackerAPI.Services.Contracts;
using Microsoft.EntityFrameworkCore;

namespace ExpenseTrackerAPI.Services
{
    public class NotificationQueryService : INotificationQueryService
    {
        private readonly AppDbContext _db;
        public NotificationQueryService(AppDbContext db) => _db = db;

        public async Task<IReadOnlyList<NotificationDto>> GetForUserAsync(string userId, CancellationToken ct)
        {
            var items = await _db.NotificationRecords
                .Where(n => n.RecipientId == userId)
                .OrderByDescending(n => n.CreatedAt)
                .Select(n => new NotificationDto(n.NotificationId, n.Message, n.IsRead, n.CreatedAt))
                .ToListAsync(ct);

            return items;
        }

        public async Task<bool> MarkReadAsync(string userId, int notificationId, CancellationToken ct)
        {
            var n = await _db.NotificationRecords
                .FirstOrDefaultAsync(x => x.NotificationId == notificationId && x.RecipientId == userId, ct);
            if (n == null) return false;
            n.IsRead = true;
            await _db.SaveChangesAsync(ct);
            return true;
        }

        public async Task<int> ClearAllAsync(string userId, CancellationToken ct)
        {
            var toDelete = await _db.NotificationRecords
                .Where(n => n.RecipientId == userId)
                .ToListAsync(ct);

            if (toDelete.Count == 0) return 0;

            _db.NotificationRecords.RemoveRange(toDelete);
            return await _db.SaveChangesAsync(ct);
        }
    }
}