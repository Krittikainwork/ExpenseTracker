using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ExpenseTrackerAPI.Models
{
    public class Budget
    {
        [Key]
        public int BudgetId { get; set; }

        [Required]
        [ForeignKey("Category")]
        public int CategoryId { get; set; }

        [Required]
        public decimal InitialAmount { get; set; }

        [Required]
        public decimal RemainingAmount { get; set; }

        [Required]
        public int Month { get; set; }

        [Required]
        public int Year { get; set; }

        public DateTime CreatedDate { get; set; } = DateTime.UtcNow;

        // ✅ NEW FIELDS
        [Required]
        public string CreatedByManagerId { get; set; }

        [Required]
        public string CreatedByManagerName { get; set; }

        // Navigation
        public Category Category { get; set; }
    }
}
