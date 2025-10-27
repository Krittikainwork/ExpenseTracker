using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using ExpenseTrackerAPI.Models;

namespace ExpenseTrackerAPI.Data
{
    public class AppDbContext : IdentityDbContext<ApplicationUser>
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

        public DbSet<Expense> Expenses { get; set; }
        public DbSet<Category> Categories { get; set; }
        public DbSet<Budget> Budgets { get; set; }
        public DbSet<BudgetTransaction> BudgetTransactions { get; set; }
        public DbSet<NotificationRecord> NotificationRecords { get; set; }

        protected override void OnModelCreating(ModelBuilder b)
        {
            base.OnModelCreating(b);

            // Money precision
            b.Entity<Budget>().Property(x => x.InitialAmount).HasColumnType("numeric(18,2)");
            b.Entity<Budget>().Property(x => x.RemainingAmount).HasColumnType("numeric(18,2)");
            b.Entity<BudgetTransaction>().Property(x => x.AmountDeducted).HasColumnType("numeric(18,2)");
            b.Entity<BudgetTransaction>().Property(x => x.RemainingAfterDeduction).HasColumnType("numeric(18,2)");
            b.Entity<Expense>().Property(x => x.Amount).HasColumnType("numeric(18,2)");
            

            // One budget per Category/Month/Year
            b.Entity<Budget>()
             .HasIndex(x => new { x.CategoryId, x.Month, x.Year })
             .IsUnique();

           
        }
    }
}