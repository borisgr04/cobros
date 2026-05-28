using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CobrosApi.Migrations
{
    /// <inheritdoc />
    public partial class AddPagoAnulacion : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "Anulado",
                table: "Pagos",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<DateTime>(
                name: "FechaAnulacion",
                table: "Pagos",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "MotivoAnulacion",
                table: "Pagos",
                type: "character varying(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.UpdateData(
                table: "Pagos",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "Anulado", "FechaAnulacion", "MotivoAnulacion" },
                values: new object[] { false, null, null });

            migrationBuilder.UpdateData(
                table: "Pagos",
                keyColumn: "Id",
                keyValue: 2,
                columns: new[] { "Anulado", "FechaAnulacion", "MotivoAnulacion" },
                values: new object[] { false, null, null });

            migrationBuilder.UpdateData(
                table: "Pagos",
                keyColumn: "Id",
                keyValue: 3,
                columns: new[] { "Anulado", "FechaAnulacion", "MotivoAnulacion" },
                values: new object[] { false, null, null });

            migrationBuilder.UpdateData(
                table: "Pagos",
                keyColumn: "Id",
                keyValue: 4,
                columns: new[] { "Anulado", "FechaAnulacion", "MotivoAnulacion" },
                values: new object[] { false, null, null });

            migrationBuilder.UpdateData(
                table: "Pagos",
                keyColumn: "Id",
                keyValue: 5,
                columns: new[] { "Anulado", "FechaAnulacion", "MotivoAnulacion" },
                values: new object[] { false, null, null });

            migrationBuilder.UpdateData(
                table: "Pagos",
                keyColumn: "Id",
                keyValue: 6,
                columns: new[] { "Anulado", "FechaAnulacion", "MotivoAnulacion" },
                values: new object[] { false, null, null });

            migrationBuilder.UpdateData(
                table: "Pagos",
                keyColumn: "Id",
                keyValue: 7,
                columns: new[] { "Anulado", "FechaAnulacion", "MotivoAnulacion" },
                values: new object[] { false, null, null });

            migrationBuilder.UpdateData(
                table: "Pagos",
                keyColumn: "Id",
                keyValue: 8,
                columns: new[] { "Anulado", "FechaAnulacion", "MotivoAnulacion" },
                values: new object[] { false, null, null });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Anulado",
                table: "Pagos");

            migrationBuilder.DropColumn(
                name: "FechaAnulacion",
                table: "Pagos");

            migrationBuilder.DropColumn(
                name: "MotivoAnulacion",
                table: "Pagos");
        }
    }
}
