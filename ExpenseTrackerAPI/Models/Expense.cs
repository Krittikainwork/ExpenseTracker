namespace ExpenseTrackerAPI.Models
{
    public class Expense
    {
        public int ExpenseId { get; set; }
        public string EmployeeId { get; set; }
        public string EmployeeName { get; set; }
        public string Title { get; set; }
        public decimal Amount { get; set; }
        public int CategoryId { get; set; }
        public string Status { get; set; }
        public string ManagerName { get; set; }
        public string ManagerOfficialId { get; set; }
        public string ManagerComment { get; set; }
        public string AdminComment { get; set; }
        public DateTime DateSubmitted { get; set; }
        public DateTime? DateReviewed { get; set; }
    }
}
