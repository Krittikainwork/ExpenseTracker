using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using ExpenseTrackerAPI.Models;

// using statements remain unchanged

namespace ExpenseTrackerAPI.Data
{
    public class AppDbContext : IdentityDbContext<ApplicationUser>
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

        public DbSet<Expense> Expenses { get; set; }
        public DbSet<Category> Categories { get; set; }
        public DbSet<Budget> Budgets { get; set; }
        public DbSet<BudgetTransaction> BudgetTransactions { get; set; }
        public DbSet<BudgetAdjustment> BudgetAdjustments { get; set; }
        public DbSet<NotificationRecord> NotificationRecords { get; set; }

        // ✅ NEW
        public DbSet<Reimbursement> Reimbursements { get; set; }

        protected override void OnModelCreating(ModelBuilder b)
        {
            base.OnModelCreating(b);

            // existing precision configs...
            b.Entity<Budget>().Property(x => x.InitialAmount).HasColumnType("numeric(18,2)");
            b.Entity<Budget>().Property(x => x.RemainingAmount).HasColumnType("numeric(18,2)");
            b.Entity<BudgetTransaction>().Property(x => x.AmountDeducted).HasColumnType("numeric(18,2)");
            b.Entity<BudgetTransaction>().Property(x => x.RemainingAfterDeduction).HasColumnType("numeric(18,2)");
            b.Entity<Expense>().Property(x => x.Amount).HasColumnType("numeric(18,2)");

            b.Entity<Budget>()
             .HasIndex(x => new { x.CategoryId, x.Month, x.Year })
             .IsUnique();

            b.Entity<BudgetAdjustment>().Property(x => x.AmountSet).HasColumnType("numeric(18,2)");
            b.Entity<BudgetAdjustment>().Property(x => x.CumulativeInitialAfter).HasColumnType("numeric(18,2)");
            b.Entity<BudgetAdjustment>().Property(x => x.CumulativeRemainingAfter).HasColumnType("numeric(18,2)");
            b.Entity<BudgetAdjustment>().HasIndex(t => new { t.CategoryId, t.Month, t.Year });
            b.Entity<BudgetAdjustment>()
             .HasOne(t => t.Budget).WithMany().HasForeignKey(t => t.BudgetId).OnDelete(DeleteBehavior.Cascade);

            // ✅ NEW: Reimbursements precision and 1:1 per expense
            b.Entity<Reimbursement>().Property(r => r.Amount).HasColumnType("numeric(18,2)");
            b.Entity<Reimbursement>()
             .HasIndex(r => r.ExpenseId)
             .IsUnique(); // one reimbursement per expense
        }
    }
}
