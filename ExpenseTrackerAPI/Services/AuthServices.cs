using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Microsoft.IdentityModel.Tokens;
using ExpenseTrackerAPI.Models;
using ExpenseTrackerAPI.Services.Contracts;
using System.Threading;
using System.Threading.Tasks;

namespace ExpenseTrackerAPI.Services
{
    public class AuthService : IAuthService
    {
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly SignInManager<ApplicationUser> _signInManager;
        private readonly IConfiguration _config;
        private readonly ILogger<AuthService> _logger;

        public AuthService(
            UserManager<ApplicationUser> userManager,
            SignInManager<ApplicationUser> signInManager,
            IConfiguration config,
            ILogger<AuthService> logger)
        {
            _userManager = userManager;
            _signInManager = signInManager;
            _config = config;
            _logger = logger;
        }

        public async Task<IdentityResult> RegisterAsync(string fullName, string email, string password, string? employeeId, CancellationToken ct)
        {
            try
            {
                var user = new ApplicationUser
                {
                    UserName = email,
                    Email = email,
                    FullName = fullName,
                    EmployeeId = employeeId ?? string.Empty,
                    Role = "Employee"
                };

                var result = await _userManager.CreateAsync(user, password);
                if (!result.Succeeded) return result;

                await _userManager.AddToRoleAsync(user, "Employee");
                return result;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "AuthService.RegisterAsync failed for email={Email}", email);
                throw;
            }
        }

        public async Task<(string token, string username, string role)?> LoginAsync(string email, string password, CancellationToken ct)
        {
            try
            {
                var user = await _userManager.FindByEmailAsync(email);
                if (user == null) return null;

                var ok = await _signInManager.CheckPasswordSignInAsync(user, password, false);
                if (!ok.Succeeded) return null;

                var roles = await _userManager.GetRolesAsync(user);
                var role = roles.FirstOrDefault() ?? "Employee";

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

                var jwt = new JwtSecurityTokenHandler().WriteToken(token);
                var username = user.FullName ?? user.Email ?? "";
                return (jwt, username, role);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "AuthService.LoginAsync failed for email={Email}", email);
                throw;
            }
        }

        public async Task LogoutAsync()
        {
            try
            {
                await _signInManager.SignOutAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "AuthService.LogoutAsync failed");
                throw;
            }
        }
    }
}
