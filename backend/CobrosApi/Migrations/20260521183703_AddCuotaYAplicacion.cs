using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace CobrosApi.Migrations
{
    /// <inheritdoc />
    public partial class AddCuotaYAplicacion : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Cuotas",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    PrestamoId = table.Column<int>(type: "integer", nullable: false),
                    NumeroCuota = table.Column<int>(type: "integer", nullable: false),
                    FechaEsperada = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    ValorCuota = table.Column<decimal>(type: "numeric(18,2)", nullable: false),
                    SaldoPagado = table.Column<decimal>(type: "numeric(18,2)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Cuotas", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Cuotas_Prestamos_PrestamoId",
                        column: x => x.PrestamoId,
                        principalTable: "Prestamos",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "AplicacionesCuota",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    PagoId = table.Column<int>(type: "integer", nullable: false),
                    CuotaId = table.Column<int>(type: "integer", nullable: false),
                    ValorAplicado = table.Column<decimal>(type: "numeric(18,2)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AplicacionesCuota", x => x.Id);
                    table.ForeignKey(
                        name: "FK_AplicacionesCuota_Cuotas_CuotaId",
                        column: x => x.CuotaId,
                        principalTable: "Cuotas",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_AplicacionesCuota_Pagos_PagoId",
                        column: x => x.PagoId,
                        principalTable: "Pagos",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_AplicacionesCuota_CuotaId",
                table: "AplicacionesCuota",
                column: "CuotaId");

            migrationBuilder.CreateIndex(
                name: "IX_AplicacionesCuota_PagoId",
                table: "AplicacionesCuota",
                column: "PagoId");

            migrationBuilder.CreateIndex(
                name: "IX_Cuotas_PrestamoId",
                table: "Cuotas",
                column: "PrestamoId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "AplicacionesCuota");

            migrationBuilder.DropTable(
                name: "Cuotas");
        }
    }
}
