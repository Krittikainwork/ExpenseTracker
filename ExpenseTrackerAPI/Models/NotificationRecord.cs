using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ExpenseTrackerAPI.Models
{
    public class NotificationRecord
    {
        [Key]
        public int NotificationId { get; set; }  // ✅ Primary Key

        [Required]
        public string RecipientId { get; set; }

        [ForeignKey("RecipientId")]
        public ApplicationUser Recipient { get; set; }

        [Required]
        public string Message { get; set; }

        public bool IsRead { get; set; } = false;

        [Required]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
