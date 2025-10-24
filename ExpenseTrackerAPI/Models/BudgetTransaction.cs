using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ExpenseTrackerAPI.Models
{
    public class BudgetTransaction
    {
        [Key]
        public int TransactionId { get; set; }  // ✅ Primary Key

        [Required]
        public int BudgetId { get; set; }

        [ForeignKey("BudgetId")]
        public Budget Budget { get; set; }

        [Required]
        public int ExpenseId { get; set; }

        [ForeignKey("ExpenseId")]
        public Expense Expense { get; set; }

        [Required]
        public string EmployeeName { get; set; }

        [Required]
        public string EmployeeId { get; set; }

        [Required]
        public string ManagerName { get; set; }

        [Required]
        public string ManagerOfficialId { get; set; }

        [Required]
        public decimal AmountDeducted { get; set; }

        [Required]
        public decimal RemainingAfterDeduction { get; set; }

        [Required]
        public DateTime TransactionDate { get; set; } = DateTime.UtcNow;
    }
}
