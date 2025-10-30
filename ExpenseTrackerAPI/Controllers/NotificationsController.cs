using ExpenseTrackerAPI.Services.Contracts;
using ExpenseTrackerAPI.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using System.Threading;
using System.Threading.Tasks;

namespace ExpenseTrackerAPI.Controllers
{
    [ApiController]
    [Route("api/notifications")]
    public class NotificationsController : ControllerBase
    {
        private readonly INotificationQueryService _svc;
        private readonly UserManager<ApplicationUser> _userManager;

        public NotificationsController(INotificationQueryService svc, UserManager<ApplicationUser> userManager)
        {
            _svc = svc;
            _userManager = userManager;
        }

        [HttpGet]
        [Authorize]
        public async Task<IActionResult> Get(CancellationToken ct)
        {
            var userId = _userManager.GetUserId(User);
            var items = await _svc.GetForUserAsync(userId!, ct);
            return Ok(items);
        }

        [HttpPut("read/{id:int}")]
        [Authorize]
        public async Task<IActionResult> MarkRead(int id, CancellationToken ct)
        {
            var userId = _userManager.GetUserId(User);
            var ok = await _svc.MarkReadAsync(userId!, id, ct);
            if (!ok) return NotFound();
            return Ok();
        }

        [HttpPost("clear")]
        [Authorize]
        public async Task<IActionResult> ClearAll(CancellationToken ct)
        {
            var userId = _userManager.GetUserId(User);
            var cleared = await _svc.ClearAllAsync(userId!, ct);
            return Ok(new { cleared });
        }
    }
}