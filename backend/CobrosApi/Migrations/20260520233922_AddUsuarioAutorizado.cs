using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CobrosApi.Migrations
{
    /// <inheritdoc />
    public partial class AddUsuarioAutorizado : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "Autorizado",
                table: "Usuarios",
                type: "boolean",
                nullable: false,
                defaultValue: false);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Autorizado",
                table: "Usuarios");
        }
    }
}
