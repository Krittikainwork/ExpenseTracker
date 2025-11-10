

namespace ExpenseTrackerAPI.Services.Contracts
{
    public record CategoryItemDto(int Id, string Name);

    public interface ICategoryService
    {
        Task<IReadOnlyList<CategoryItemDto>> GetAllAsync(CancellationToken ct);
    }
}