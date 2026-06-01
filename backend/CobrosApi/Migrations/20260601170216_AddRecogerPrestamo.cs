using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CobrosApi.Migrations
{
    /// <inheritdoc />
    public partial class AddRecogerPrestamo : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "PrestamoOrigenId",
                table: "Prestamos",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "DineroAdicional",
                table: "NovedadesPrestamo",
                type: "numeric(18,2)",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "PrestamoDestinoId",
                table: "NovedadesPrestamo",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "SaldoTrasladado",
                table: "NovedadesPrestamo",
                type: "numeric(18,2)",
                nullable: true);

            migrationBuilder.UpdateData(
                table: "Prestamos",
                keyColumn: "Id",
                keyValue: 1,
                column: "PrestamoOrigenId",
                value: null);

            migrationBuilder.UpdateData(
                table: "Prestamos",
                keyColumn: "Id",
                keyValue: 2,
                column: "PrestamoOrigenId",
                value: null);

            migrationBuilder.UpdateData(
                table: "Prestamos",
                keyColumn: "Id",
                keyValue: 3,
                column: "PrestamoOrigenId",
                value: null);

            migrationBuilder.UpdateData(
                table: "Prestamos",
                keyColumn: "Id",
                keyValue: 4,
                column: "PrestamoOrigenId",
                value: null);

            migrationBuilder.UpdateData(
                table: "Prestamos",
                keyColumn: "Id",
                keyValue: 5,
                column: "PrestamoOrigenId",
                value: null);

            migrationBuilder.UpdateData(
                table: "Prestamos",
                keyColumn: "Id",
                keyValue: 6,
                column: "PrestamoOrigenId",
                value: null);

            migrationBuilder.CreateIndex(
                name: "IX_Prestamos_PrestamoOrigenId",
                table: "Prestamos",
                column: "PrestamoOrigenId");

            migrationBuilder.CreateIndex(
                name: "IX_NovedadesPrestamo_PrestamoDestinoId",
                table: "NovedadesPrestamo",
                column: "PrestamoDestinoId");

            migrationBuilder.AddForeignKey(
                name: "FK_NovedadesPrestamo_Prestamos_PrestamoDestinoId",
                table: "NovedadesPrestamo",
                column: "PrestamoDestinoId",
                principalTable: "Prestamos",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_Prestamos_Prestamos_PrestamoOrigenId",
                table: "Prestamos",
                column: "PrestamoOrigenId",
                principalTable: "Prestamos",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_NovedadesPrestamo_Prestamos_PrestamoDestinoId",
                table: "NovedadesPrestamo");

            migrationBuilder.DropForeignKey(
                name: "FK_Prestamos_Prestamos_PrestamoOrigenId",
                table: "Prestamos");

            migrationBuilder.DropIndex(
                name: "IX_Prestamos_PrestamoOrigenId",
                table: "Prestamos");

            migrationBuilder.DropIndex(
                name: "IX_NovedadesPrestamo_PrestamoDestinoId",
                table: "NovedadesPrestamo");

            migrationBuilder.DropColumn(
                name: "PrestamoOrigenId",
                table: "Prestamos");

            migrationBuilder.DropColumn(
                name: "DineroAdicional",
                table: "NovedadesPrestamo");

            migrationBuilder.DropColumn(
                name: "PrestamoDestinoId",
                table: "NovedadesPrestamo");

            migrationBuilder.DropColumn(
                name: "SaldoTrasladado",
                table: "NovedadesPrestamo");
        }
    }
}
