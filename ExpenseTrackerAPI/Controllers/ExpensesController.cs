using ExpenseTrackerAPI.Services.Contracts;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using ExpenseTrackerAPI.Models;
using System.Threading;
using System.Threading.Tasks;
using System;

namespace ExpenseTrackerAPI.Controllers
{
    [ApiController]
    [Route("api/expenses")]
    public class ExpensesController : ControllerBase
    {
        private readonly IExpensesService _svc;
        private readonly UserManager<ApplicationUser> _userManager;

        public ExpensesController(IExpensesService svc, UserManager<ApplicationUser> userManager)
        {
            _svc = svc;
            _userManager = userManager;
        }

        public record SubmitExpenseRequest(string Title, decimal Amount, int CategoryId, DateTime ExpenseDate);
        public record ApproveExpenseRequest(string ManagerName, string ManagerOfficialId, string? ManagerComment);
        public record RejectExpenseRequest(string ManagerName, string ManagerOfficialId, string? ManagerComment);
        public record AdminCommentRequest(string Comment);

        [HttpPost("submit")]
        [Authorize(Roles = "Employee")]
        public async Task<IActionResult> Submit([FromBody] SubmitExpenseRequest req, CancellationToken ct)
        {
            var user = await _userManager.GetUserAsync(User);
            if (user is null) return Unauthorized();

            var id = await _svc.SubmitAsync(
                new Services.Contracts.SubmitExpenseRequest(req.Title, req.Amount, req.CategoryId, req.ExpenseDate),
                user.Id, ct);

            return Ok(new { expenseId = id });
        }

        [HttpGet("my")]
        [Authorize(Roles = "Employee")]
        public async Task<IActionResult> My(CancellationToken ct)
        {
            var user = await _userManager.GetUserAsync(User);
            if (user is null) return Unauthorized();

            var rows = await _svc.GetMyAsync(user.EmployeeId, ct);
            return Ok(rows);
        }

        [HttpGet("pending")]
        [Authorize(Policy = "RequireManager")]
        public async Task<IActionResult> Pending(CancellationToken ct)
        {
            var rows = await _svc.GetPendingAsync(ct);
            return Ok(rows);
        }

        [HttpPut("approve/{id:int}")]
        [Authorize(Policy = "RequireManager")]
        public async Task<IActionResult> Approve(int id, [FromBody] ApproveExpenseRequest req, CancellationToken ct)
        {
            await _svc.ApproveAsync(id,
                new Services.Contracts.ApproveExpenseRequest(req.ManagerName, req.ManagerOfficialId, req.ManagerComment), ct);
            return Ok();
        }

        [HttpPut("reject/{id:int}")]
        [Authorize(Policy = "RequireManager")]
        public async Task<IActionResult> Reject(int id, [FromBody] RejectExpenseRequest req, CancellationToken ct)
        {
            await _svc.RejectAsync(id,
                new Services.Contracts.RejectExpenseRequest(req.ManagerName, req.ManagerOfficialId, req.ManagerComment), ct);
            return Ok();
        }

        [HttpGet("processed")]
        [Authorize(Policy = "RequireManager")]
        public async Task<IActionResult> Processed(CancellationToken ct)
        {
            var rows = await _svc.GetProcessedAsync(ct);
            return Ok(rows);
        }

        [HttpGet("all")]
        [Authorize(Policy = "RequireAdmin")]
        public async Task<IActionResult> All([FromQuery] int? month, [FromQuery] int? year, CancellationToken ct)
        {
            var rows = await _svc.GetAllAsync(month, year, ct);
            return Ok(rows);
        }

        [HttpPut("comment/{id:int}")]
        [Authorize(Policy = "RequireAdmin")]
        public async Task<IActionResult> AdminComment(int id, [FromBody] AdminCommentRequest req, CancellationToken ct)
        {
            await _svc.AdminCommentAsync(id, new Services.Contracts.AdminCommentRequest(req.Comment), ct);
            return Ok();
        }
        
    }
}
