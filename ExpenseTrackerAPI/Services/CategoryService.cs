using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using System.Collections.Generic;
using ExpenseTrackerAPI.Data;
using ExpenseTrackerAPI.Services.Contracts;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace ExpenseTrackerAPI.Services
{
    public class CategoryService : ICategoryService
    {
        private readonly AppDbContext _db;
        private readonly ILogger<CategoryService> _logger;

        public CategoryService(AppDbContext db, ILogger<CategoryService> logger)
        {
            _db = db;
            _logger = logger;
        }

        public async Task<IReadOnlyList<CategoryItemDto>> GetAllAsync(CancellationToken ct)
        {
            try
            {
                var items = await _db.Categories
                    .OrderBy(c => c.Name)
                    .Select(c => new CategoryItemDto(c.Id, c.Name))
                    .ToListAsync(ct);
                return items;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "CategoryService.GetAllAsync failed");
                throw;
            }
        }
    }
}
