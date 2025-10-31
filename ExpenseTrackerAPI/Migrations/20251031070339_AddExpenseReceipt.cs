using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ExpenseTrackerAPI.Migrations
{
    /// <inheritdoc />
    public partial class AddExpenseReceipt : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "ReceiptContentType",
                table: "Expenses",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ReceiptFileName",
                table: "Expenses",
                type: "text",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ReceiptContentType",
                table: "Expenses");

            migrationBuilder.DropColumn(
                name: "ReceiptFileName",
                table: "Expenses");
        }
    }
}
