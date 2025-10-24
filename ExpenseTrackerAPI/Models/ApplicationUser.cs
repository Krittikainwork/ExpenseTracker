using Microsoft.AspNetCore.Identity;

namespace ExpenseTrackerAPI.Models
{
    public class ApplicationUser : IdentityUser
    {
        public string FullName { get; set; }
        public string EmployeeId { get; set; }
        public string Role { get; set; }
    }
}
