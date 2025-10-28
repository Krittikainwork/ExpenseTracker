using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ExpenseTrackerAPI.Models
{
    public class BudgetAdjustment
    {
        [Key]
        public int AdjustmentId { get; set; }

        // Links
        [Required] public int BudgetId { get; set; }
        [ForeignKey(nameof(BudgetId))] public Budget Budget { get; set; } = default!;

        [Required] public int CategoryId { get; set; }
        [ForeignKey(nameof(CategoryId))] public Category Category { get; set; } = default!;

        [Required] public int Month { get; set; }
        [Required] public int Year { get; set; }

        // Business data (for the history rows)
        [Required] public decimal AmountSet { get; set; }                // the inputted amount for this action (TopUp value, or 0 for Reset)
        [Required] public decimal CumulativeInitialAfter { get; set; }   // InitialAmount AFTER applying this action
        [Required] public decimal CumulativeRemainingAfter { get; set; } // RemainingAmount AFTER applying this action

        // Operation: "InitialSet" | "TopUp" | "Reset"
        [Required, MaxLength(16)] public string Operation { get; set; } = "TopUp";

        // Audit
        [Required, MaxLength(64)]  public string ManagerId { get; set; } = default!;
        [Required, MaxLength(120)] public string ManagerName { get; set; } = default!;
        [Required] public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
    }
}