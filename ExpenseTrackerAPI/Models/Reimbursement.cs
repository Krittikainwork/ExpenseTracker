using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ExpenseTrackerAPI.Models
{
    public class Reimbursement
    {
        [Key]
        public int ReimbursementId { get; set; }

        [Required]
        public int ExpenseId { get; set; }

        [ForeignKey(nameof(ExpenseId))]
        public Expense Expense { get; set; } = default!;

        [Column(TypeName = "numeric(18,2)")]
        public decimal Amount { get; set; }

        // Keep it simple: one shot, status defaults to "Paid" when created
        [Required, MaxLength(16)]
        public string Status { get; set; } = "Paid";

        [Required]
        public DateTime PaidDateUtc { get; set; } = DateTime.UtcNow;

        [MaxLength(120)]
        public string? Reference { get; set; }  // Transaction ID or bank ref

        [MaxLength(64)]
        public string? ReimbursedByUserId { get; set; }

        [MaxLength(120)]
        public string? ReimbursedByName { get; set; }

        [Required]
        public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
    }
}