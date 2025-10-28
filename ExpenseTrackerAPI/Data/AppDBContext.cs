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

        // Existing expense-deduction log
        public DbSet<BudgetTransaction> BudgetTransactions { get; set; }

        // NEW: Budget adjustments (history of InitialSet/TopUp/Reset)
        public DbSet<BudgetAdjustment> BudgetAdjustments { get; set; }

        public DbSet<NotificationRecord> NotificationRecords { get; set; }

        protected override void OnModelCreating(ModelBuilder b)
        {
            base.OnModelCreating(b);

            // Money precision (existing)
            b.Entity<Budget>().Property(x => x.InitialAmount).HasColumnType("numeric(18,2)");
            b.Entity<Budget>().Property(x => x.RemainingAmount).HasColumnType("numeric(18,2)");
            b.Entity<BudgetTransaction>().Property(x => x.AmountDeducted).HasColumnType("numeric(18,2)");
            b.Entity<BudgetTransaction>().Property(x => x.RemainingAfterDeduction).HasColumnType("numeric(18,2)");
            b.Entity<Expense>().Property(x => x.Amount).HasColumnType("numeric(18,2)");

            // One budget per Category/Month/Year (existing)
            b.Entity<Budget>()
             .HasIndex(x => new { x.CategoryId, x.Month, x.Year })
             .IsUnique();

            // NEW: numeric precisions for adjustments
            b.Entity<BudgetAdjustment>().Property(x => x.AmountSet).HasColumnType("numeric(18,2)");
            b.Entity<BudgetAdjustment>().Property(x => x.CumulativeInitialAfter).HasColumnType("numeric(18,2)");
            b.Entity<BudgetAdjustment>().Property(x => x.CumulativeRemainingAfter).HasColumnType("numeric(18,2)");

            // Fast lookup (month/category)
            b.Entity<BudgetAdjustment>()
             .HasIndex(t => new { t.CategoryId, t.Month, t.Year });

            // Relationship to Budget
            b.Entity<BudgetAdjustment>()
             .HasOne(t => t.Budget)
             .WithMany() // not adding collection on Budget to avoid changing your model
             .HasForeignKey(t => t.BudgetId)
             .OnDelete(DeleteBehavior.Cascade);
        }
    }
}