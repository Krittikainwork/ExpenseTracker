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

    [HttpGet("history-detail")] 
    [Authorize(Policy = "RequireManager")]
    public async Task<IActionResult> HistoryDetail([FromQuery] int month, [FromQuery] int year, CancellationToken ct)
    {
      var result = await _svc.HistoryDetailAsync(month, year, ct);
      return Ok(result);
    }

    [HttpGet("overview")]
    [Authorize(Policy = "RequireManager")]
    public async Task<IActionResult> ManagerOverview([FromQuery] int month, [FromQuery] int year, CancellationToken ct)
    {
      var rows = await _svc.ManagerOverviewAsync(month, year, ct);
      return Ok(rows);
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