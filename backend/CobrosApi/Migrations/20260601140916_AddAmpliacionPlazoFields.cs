using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CobrosApi.Migrations
{
    /// <inheritdoc />
    public partial class AddAmpliacionPlazoFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "CantidadCuotasNuevas",
                table: "NovedadesPrestamo",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "FechaFinalAnterior",
                table: "NovedadesPrestamo",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "InteresAdicional",
                table: "NovedadesPrestamo",
                type: "numeric(18,2)",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "NuevaFechaFinal",
                table: "NovedadesPrestamo",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "NuevoSaldo",
                table: "NovedadesPrestamo",
                type: "numeric(18,2)",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "CantidadCuotasNuevas",
                table: "NovedadesPrestamo");

            migrationBuilder.DropColumn(
                name: "FechaFinalAnterior",
                table: "NovedadesPrestamo");

            migrationBuilder.DropColumn(
                name: "InteresAdicional",
                table: "NovedadesPrestamo");

            migrationBuilder.DropColumn(
                name: "NuevaFechaFinal",
                table: "NovedadesPrestamo");

            migrationBuilder.DropColumn(
                name: "NuevoSaldo",
                table: "NovedadesPrestamo");
        }
    }
}
