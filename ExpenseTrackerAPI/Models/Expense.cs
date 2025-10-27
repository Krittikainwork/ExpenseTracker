using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ExpenseTrackerAPI.Models
{
    public class Expense
    {
        [Key]
        public int ExpenseId { get; set; }

        // Employee identity
        [Required, MaxLength(64)]
        public string EmployeeId { get; set; } = default!;
        [Required, MaxLength(120)]
        public string EmployeeName { get; set; } = default!;

        // Expense details
        [Required, MaxLength(160)]
        public string Title { get; set; } = default!;
        [Range(0, 9999999999999999.99)]
        public decimal Amount { get; set; }

        [Required]
        public int CategoryId { get; set; }

        // 👇👇  THIS IS THE NAVIGATION PROPERTY YOUR CONTROLLER USES
        [ForeignKey(nameof(CategoryId))]
        public Category Category { get; set; } = default!;

        public DateTime ExpenseDate { get; set; }

        // Workflow
        [Required, MaxLength(16)]
        public string Status { get; set; } = "Pending";

        [MaxLength(120)] public string? ManagerName { get; set; }
        [MaxLength(64)]  public string? ManagerOfficialId { get; set; }
        [MaxLength(1000)] public string? ManagerComment { get; set; }
        [MaxLength(1000)] public string? AdminComment { get; set; }

        public DateTime DateSubmitted { get; set; } = DateTime.UtcNow;
        public DateTime? DateReviewed { get; set; }
    }
}