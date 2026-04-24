using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Titan.Server.Migrations.TenantStoreDb
{
    /// <inheritdoc />
    public partial class AddTenantConnectionString : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "ConnectionString",
                table: "TenantInfo",
                type: "text",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ConnectionString",
                table: "TenantInfo");
        }
    }
}
