namespace ExpenseTrackerAPI.Models
{
    public class Category
    {
        public int Id { get; set; }
        public string Name { get; set; }
        public decimal MonthlyBudget { get; set; }
        public decimal RemainingBudget { get; set; }
        public DateTime MonthYear { get; set; }
    }
}
