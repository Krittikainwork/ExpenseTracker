using ExpenseTrackerAPI.Data;
using ExpenseTrackerAPI.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Logging;

namespace ExpenseTrackerAPI.Services
{
    public class NotificationService
    {
        private readonly AppDbContext _db;
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly ILogger<NotificationService> _logger;

        public NotificationService(AppDbContext db, UserManager<ApplicationUser> userManager, ILogger<NotificationService> logger)
        {
            _db = db;
            _userManager = userManager;
            _logger = logger;
        }

        public async Task CreateForUserAsync(string userId, string message, CancellationToken ct = default)
        {
            try
            {
                _db.NotificationRecords.Add(new NotificationRecord
                {
                    RecipientId = userId,
                    Message = message,
                    CreatedAt = DateTime.UtcNow
                });
                await _db.SaveChangesAsync(ct);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "NotificationService.CreateForUserAsync failed for userId={UserId}", userId);
                throw;
            }
        }

        public async Task CreateForRoleAsync(string role, string message, CancellationToken ct = default)
        {
            try
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
            catch (Exception ex)
            {
                _logger.LogError(ex, "NotificationService.CreateForRoleAsync failed for role={Role}", role);
                throw;
            }
        }
    }
}