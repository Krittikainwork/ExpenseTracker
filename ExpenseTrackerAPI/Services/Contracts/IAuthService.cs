using Microsoft.AspNetCore.Identity;


namespace ExpenseTrackerAPI.Services.Contracts
{
    public interface IAuthService
    {
        Task<IdentityResult> RegisterAsync(string fullName, string email, string password, string? employeeId, CancellationToken ct);
        Task<(string token, string username, string role)?> LoginAsync(string email, string password, CancellationToken ct);
        Task LogoutAsync();
    }
}