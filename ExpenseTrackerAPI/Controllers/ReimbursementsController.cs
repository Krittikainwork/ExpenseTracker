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
    [Route("api/reimbursements")]
    public class ReimbursementsController : ControllerBase
    {
        private readonly IReimbursementsService _svc;
        private readonly UserManager<ApplicationUser> _userManager;

        public ReimbursementsController(IReimbursementsService svc, UserManager<ApplicationUser> userManager)
        {
            _svc = svc;
            _userManager = userManager;
        }

        public record MarkPaidRequest(string Reference, decimal Amount);

        [HttpGet("map")]
        [Authorize(Policy = "RequireAdmin")]
        public async Task<IActionResult> Map([FromQuery] int month, [FromQuery] int year, CancellationToken ct)
        {
            var items = await _svc.MapAsync(month, year, ct);
            return Ok(items);
        }

        [HttpGet("map-all")]
        [Authorize(Policy = "RequireAdmin")]
        public async Task<IActionResult> MapAll(CancellationToken ct)
        {
            var items = await _svc.MapAllAsync(ct);
            return Ok(items);
        }

        [HttpPut("mark-paid/{expenseId:int}")]
        [Authorize(Policy = "RequireAdmin")]
        public async Task<IActionResult> MarkPaid([FromRoute] int expenseId, [FromBody] MarkPaidRequest req, CancellationToken ct)
        {
            var admin = await _userManager.GetUserAsync(User);
            if (admin is null) return Unauthorized();

            await _svc.MarkPaidAsync(expenseId, req.Reference, req.Amount, admin.Id, ct);
            return Ok(new { message = "Expense reimbursed successfully." });
        }

        [HttpGet("status/my")]
        [Authorize]
        public async Task<IActionResult> MyStatus(CancellationToken ct)
        {
            var user = await _userManager.GetUserAsync(User);
            if (user is null) return Unauthorized();

            var items = await _svc.MyStatusAsync(user.EmployeeId, ct);
            return Ok(items);
        }
    }
}