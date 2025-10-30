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
    [Route("api/budget")]
    public class BudgetController : ControllerBase
    {
        private readonly IBudgetService _svc;
        private readonly UserManager<ApplicationUser> _userManager;

        public BudgetController(IBudgetService svc, UserManager<ApplicationUser> userManager)
        {
            _svc = svc; _userManager = userManager;
        }

        public record SetBudgetRequest(int CategoryId, decimal InitialAmount, int Month, int Year, string SetByRole);
        public record ClearOneRequest(int CategoryId, int Month, int Year, string SetByRole);
        public record ClearMonthRequest(int Month, int Year, string SetByRole);

        [HttpPost("set")]
        [Authorize(Policy = "RequireManager")]
        public async Task<IActionResult> SetBudget([FromBody] SetBudgetRequest req, CancellationToken ct)
        {
            var user = await _userManager.GetUserAsync(User);
            if (user is null) return Unauthorized();

            await _svc.SetBudgetAsync(req.CategoryId, req.InitialAmount, req.Month, req.Year, req.SetByRole, user.Id, User.IsInRole("Admin"), ct);
            return Ok();
        }

        [HttpGet("history")]
        [Authorize(Policy = "RequireManager")]
        public async Task<IActionResult> History([FromQuery] int? year, CancellationToken ct)
        {
            var y = year ?? System.DateTime.UtcNow.Year;
            var grouped = await _svc.HistoryAsync(y, ct);
            return Ok(grouped);
        }

        [HttpGet("history-detail")]
        [Authorize(Policy = "RequireManager")]
        public async Task<IActionResult> HistoryDetail([FromQuery] int month, [FromQuery] int year, CancellationToken ct)
        {
            var result = await _svc.HistoryDetailAsync(month, year, ct);
            return Ok(result);
        }

        [HttpGet("window")]
        [Authorize(Policy = "RequireManager")]
        public IActionResult Window([FromQuery] int month, [FromQuery] int year)
        {
            var open = _svc.IsSetWindowOpen(month, year);
            return Ok(new { month, year, isSetWindowOpen = open });
        }

        [HttpGet("overview")]
        [Authorize(Policy = "RequireManager")]
        public async Task<IActionResult> ManagerOverview([FromQuery] int month, [FromQuery] int year, CancellationToken ct)
        {
            var rows = await _svc.ManagerOverviewAsync(month, year, ct);
            return Ok(rows);
        }

        [HttpGet("overview-admin")]
        [Authorize(Policy = "RequireAdmin")]
        public async Task<IActionResult> AdminOverview([FromQuery] int month, [FromQuery] int year, CancellationToken ct)
        {
            var data = await _svc.AdminOverviewAsync(month, year, ct);
            return Ok(data);
        }

        [HttpPost("clear-one")]
        [Authorize(Policy = "RequireManager")]
        public async Task<IActionResult> ClearOne([FromBody] ClearOneRequest req, CancellationToken ct)
        {
            var user = await _userManager.GetUserAsync(User);
            if (user is null) return Unauthorized();

            await _svc.ClearOneAsync(req.CategoryId, req.Month, req.Year, req.SetByRole, user.Id, User.IsInRole("Admin"), ct);
            return Ok();
        }

        [HttpPost("clear-month")]
        [Authorize(Policy = "RequireManager")]
        public async Task<IActionResult> ClearMonth([FromBody] ClearMonthRequest req, CancellationToken ct)
        {
            var user = await _userManager.GetUserAsync(User);
            if (user is null) return Unauthorized();

            var count = await _svc.ClearMonthAsync(req.Month, req.Year, req.SetByRole, user.Id, User.IsInRole("Admin"), ct);
            return Ok(new { message = $"Cleared budgets for Month {req.Month}, {req.Year}.", count });
        }
    }
}