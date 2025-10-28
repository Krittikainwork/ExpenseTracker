// Controllers/NotificationsController.cs
using ExpenseTrackerAPI.Data;
using ExpenseTrackerAPI.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace ExpenseTrackerAPI.Controllers
{
    [ApiController]
    [Route("api/notifications")]
    public class NotificationsController : ControllerBase
    {
        private readonly AppDbContext _db;
        private readonly UserManager<ApplicationUser> _userManager;

        public NotificationsController(AppDbContext db, UserManager<ApplicationUser> userManager)
        {
            _db = db; _userManager = userManager;
        }

        [HttpGet]
        [Authorize] // same as your GET
        public async Task<IActionResult> Get(CancellationToken ct)
        {
            var userId = _userManager.GetUserId(User);
            var items = await _db.NotificationRecords
                .Where(n => n.RecipientId == userId)
                .OrderByDescending(n => n.CreatedAt)
                .Select(n => new { n.NotificationId, n.Message, n.IsRead, n.CreatedAt })
                .ToListAsync(ct);
            return Ok(items);
        }

        [HttpPut("read/{id:int}")]
        [Authorize]
        public async Task<IActionResult> MarkRead(int id, CancellationToken ct)
        {
            var userId = _userManager.GetUserId(User);
            var n = await _db.NotificationRecords
                .FirstOrDefaultAsync(x => x.NotificationId == id && x.RecipientId == userId, ct);
            if (n == null) return NotFound();

            n.IsRead = true;
            await _db.SaveChangesAsync(ct);
            return Ok();
        }

        // ✅ NEW: Clear all notifications for the current user (hard delete)
        [HttpPost("clear")]
        [Authorize] // keep same policy so it works with your token
        public async Task<IActionResult> ClearAll(CancellationToken ct)
        {
            var userId = _userManager.GetUserId(User);
            var toDelete = await _db.NotificationRecords
                .Where(n => n.RecipientId == userId)
                .ToListAsync(ct);

            if (toDelete.Count == 0) return Ok(new { cleared = 0 });

            _db.NotificationRecords.RemoveRange(toDelete);
            var cleared = await _db.SaveChangesAsync(ct);
            return Ok(new { cleared });
        }
    }
}