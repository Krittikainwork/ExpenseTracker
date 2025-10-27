using ExpenseTrackerAPI.Data;
using ExpenseTrackerAPI.Models;
using Microsoft.AspNetCore.Identity;

namespace ExpenseTrackerAPI.Services
{
    public class NotificationService
    {
        private readonly AppDbContext _db;
        private readonly UserManager<ApplicationUser> _userManager;

        public NotificationService(AppDbContext db, UserManager<ApplicationUser> userManager)
        {
            _db = db; _userManager = userManager;
        }

        public async Task CreateForUserAsync(string userId, string message, CancellationToken ct = default)
        {
            _db.NotificationRecords.Add(new NotificationRecord
            {
                RecipientId = userId,
                Message = message,
                CreatedAt = DateTime.UtcNow
            });
            await _db.SaveChangesAsync(ct);
        }

        public async Task CreateForRoleAsync(string role, string message, CancellationToken ct = default)
        {
            var users = await _userManager.GetUsersInRoleAsync(role);
            foreach (var u in users)
            {
                _db.NotificationRecords.Add(new NotificationRecord
                {
                    RecipientId = u.Id,
                    Message = message,
                    CreatedAt = DateTime.UtcNow
                });
            }
            await _db.SaveChangesAsync(ct);
        }
    }
}
