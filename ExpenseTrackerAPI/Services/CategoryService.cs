using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using System.Collections.Generic;
using ExpenseTrackerAPI.Data;
using ExpenseTrackerAPI.Services.Contracts;
using Microsoft.EntityFrameworkCore;

namespace ExpenseTrackerAPI.Services
{
    public class CategoryService : ICategoryService
    {
        private readonly AppDbContext _db;
        public CategoryService(AppDbContext db) => _db = db;

        public async Task<IReadOnlyList<CategoryItemDto>> GetAllAsync(CancellationToken ct)
        {
            var items = await _db.Categories
                .OrderBy(c => c.Name)
                .Select(c => new CategoryItemDto(c.Id, c.Name))
                .ToListAsync(ct);

            return items;
        }
    }
}