using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CobrosApi.Migrations
{
    /// <inheritdoc />
    public partial class RemoveLlaveYCuentaBancaria : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "CuentaBancaria",
                table: "Clientes");

            migrationBuilder.DropColumn(
                name: "Llave",
                table: "Clientes");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "CuentaBancaria",
                table: "Clientes",
                type: "character varying(50)",
                maxLength: 50,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Llave",
                table: "Clientes",
                type: "character varying(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.UpdateData(
                table: "Clientes",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "CuentaBancaria", "Llave" },
                values: new object[] { null, null });

            migrationBuilder.UpdateData(
                table: "Clientes",
                keyColumn: "Id",
                keyValue: 2,
                columns: new[] { "CuentaBancaria", "Llave" },
                values: new object[] { null, null });

            migrationBuilder.UpdateData(
                table: "Clientes",
                keyColumn: "Id",
                keyValue: 3,
                columns: new[] { "CuentaBancaria", "Llave" },
                values: new object[] { null, null });

            migrationBuilder.UpdateData(
                table: "Clientes",
                keyColumn: "Id",
                keyValue: 4,
                columns: new[] { "CuentaBancaria", "Llave" },
                values: new object[] { null, null });

            migrationBuilder.UpdateData(
                table: "Clientes",
                keyColumn: "Id",
                keyValue: 5,
                columns: new[] { "CuentaBancaria", "Llave" },
                values: new object[] { null, null });

            migrationBuilder.UpdateData(
                table: "Clientes",
                keyColumn: "Id",
                keyValue: 6,
                columns: new[] { "CuentaBancaria", "Llave" },
                values: new object[] { null, null });
        }
    }
}
