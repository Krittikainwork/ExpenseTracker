using ExpenseTrackerAPI.Services.Contracts;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;


namespace ExpenseTrackerAPI.Controllers
{
    [ApiController]
    [Route("api/auth")]
    public class AuthController : ControllerBase
    {
        private readonly IAuthService _auth;

        public AuthController(IAuthService auth) => _auth = auth;

        public record RegisterDto(string FullName, string Email, string Password, string? EmployeeId);
        public record LoginDto(string Email, string Password);

        [HttpPost("register")]
        [AllowAnonymous]
        public async Task<IActionResult> Register(RegisterDto dto, CancellationToken ct)
        {
            var result = await _auth.RegisterAsync(dto.FullName, dto.Email, dto.Password, dto.EmployeeId, ct);
            if (!result.Succeeded) return BadRequest(result.Errors);
            return Ok();
        }

        [HttpPost("login")]
        [AllowAnonymous]
        public async Task<IActionResult> Login(LoginDto dto, CancellationToken ct)
        {
            var payload = await _auth.LoginAsync(dto.Email, dto.Password, ct);
            if (payload is null) return Unauthorized();

            var (token, username, role) = payload.Value;
            return Ok(new { token, username, role });
        }

        [HttpPost("logout")]
        [Authorize]
        public async Task<IActionResult> Logout()
        {
            await _auth.LogoutAsync();
            return Ok();
        }
    }
}
