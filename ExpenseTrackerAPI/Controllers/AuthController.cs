using ExpenseTrackerAPI.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace ExpenseTrackerAPI.Controllers
{
    [ApiController]
    [Route("api/auth")]
    public class AuthController : ControllerBase
    {
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly SignInManager<ApplicationUser> _signInManager;
        private readonly IConfiguration _config;

        public AuthController(UserManager<ApplicationUser> userManager, SignInManager<ApplicationUser> signInManager, IConfiguration config)
        {
            _userManager = userManager; _signInManager = signInManager; _config = config;
        }

        public record RegisterDto(string FullName, string Email, string Password, string? EmployeeId);
        public record LoginDto(string Email, string Password);

        [HttpPost("register")]
        [AllowAnonymous]
        public async Task<IActionResult> Register(RegisterDto dto)
        {
            var user = new ApplicationUser
            {
                UserName = dto.Email,
                Email = dto.Email,
                FullName = dto.FullName,
                EmployeeId = dto.EmployeeId ?? string.Empty,
                Role = "Employee"
            };
            var result = await _userManager.CreateAsync(user, dto.Password);
            if (!result.Succeeded) return BadRequest(result.Errors);

            await _userManager.AddToRoleAsync(user, "Employee");
            return Ok();
        }

    [HttpPost("login")]
[AllowAnonymous]
public async Task<IActionResult> Login(LoginDto dto)
{
    var user = await _userManager.FindByEmailAsync(dto.Email);
    if (user == null) return Unauthorized();

    var ok = await _signInManager.CheckPasswordSignInAsync(user, dto.Password, false);
    if (!ok.Succeeded) return Unauthorized();

    var roles = await _userManager.GetRolesAsync(user);
    var role = roles.FirstOrDefault() ?? "Employee"; // Default to Employee if no role found

    var claims = new List<Claim>
    {
        new Claim(JwtRegisteredClaimNames.Sub, user.Id),
        new Claim(JwtRegisteredClaimNames.Email, user.Email ?? ""),
        new Claim(ClaimTypes.NameIdentifier, user.Id),
        new Claim(ClaimTypes.Name, user.UserName ?? ""),
        new Claim(ClaimTypes.Role, role),
        new Claim("role", role) 

    };

    var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_config["Jwt:Key"]!));
    var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
    var token = new JwtSecurityToken(
        issuer: _config["Jwt:Issuer"],
        audience: _config["Jwt:Audience"],
        claims: claims,
        expires: DateTime.UtcNow.AddHours(8),
        signingCredentials: creds);

    return Ok(new
    {
        token = new JwtSecurityTokenHandler().WriteToken(token),
        username = user.FullName ?? user.Email,
        role = role
    });
}

        [HttpPost("logout")]
        [Authorize]
        public async Task<IActionResult> Logout()
        {
            await _signInManager.SignOutAsync();
            return Ok();
        }
    }
}
