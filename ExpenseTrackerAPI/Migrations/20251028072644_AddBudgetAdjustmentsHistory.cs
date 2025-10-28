using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace ExpenseTrackerAPI.Migrations
{
    /// <inheritdoc />
    public partial class AddBudgetAdjustmentsHistory : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "BudgetAdjustments",
                columns: table => new
                {
                    AdjustmentId = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    BudgetId = table.Column<int>(type: "integer", nullable: false),
                    CategoryId = table.Column<int>(type: "integer", nullable: false),
                    Month = table.Column<int>(type: "integer", nullable: false),
                    Year = table.Column<int>(type: "integer", nullable: false),
                    AmountSet = table.Column<decimal>(type: "numeric(18,2)", nullable: false),
                    CumulativeInitialAfter = table.Column<decimal>(type: "numeric(18,2)", nullable: false),
                    CumulativeRemainingAfter = table.Column<decimal>(type: "numeric(18,2)", nullable: false),
                    Operation = table.Column<string>(type: "character varying(16)", maxLength: 16, nullable: false),
                    ManagerId = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    ManagerName = table.Column<string>(type: "character varying(120)", maxLength: 120, nullable: false),
                    CreatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_BudgetAdjustments", x => x.AdjustmentId);
                    table.ForeignKey(
                        name: "FK_BudgetAdjustments_Budgets_BudgetId",
                        column: x => x.BudgetId,
                        principalTable: "Budgets",
                        principalColumn: "BudgetId",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_BudgetAdjustments_Categories_CategoryId",
                        column: x => x.CategoryId,
                        principalTable: "Categories",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_BudgetAdjustments_BudgetId",
                table: "BudgetAdjustments",
                column: "BudgetId");

            migrationBuilder.CreateIndex(
                name: "IX_BudgetAdjustments_CategoryId_Month_Year",
                table: "BudgetAdjustments",
                columns: new[] { "CategoryId", "Month", "Year" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "BudgetAdjustments");
        }
    }
}
