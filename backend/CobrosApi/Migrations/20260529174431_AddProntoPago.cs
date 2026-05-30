using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace CobrosApi.Migrations
{
    /// <inheritdoc />
    public partial class AddProntoPago : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Estado",
                table: "Prestamos",
                type: "character varying(30)",
                maxLength: 30,
                nullable: false,
                defaultValue: "activo");

            migrationBuilder.AddColumn<DateTime>(
                name: "FechaCierre",
                table: "Prestamos",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "TipoPago",
                table: "Pagos",
                type: "character varying(20)",
                maxLength: 20,
                nullable: false,
                defaultValue: "regular");

            migrationBuilder.AddColumn<string>(
                name: "Estado",
                table: "Cuotas",
                type: "character varying(30)",
                maxLength: 30,
                nullable: false,
                defaultValue: "pendiente");

            // Compute initial Estado for existing cuota rows from SaldoPagado
            migrationBuilder.Sql("""
                UPDATE "Cuotas"
                SET "Estado" = CASE
                    WHEN "SaldoPagado" >= "ValorCuota" THEN 'pagada'
                    WHEN "SaldoPagado" > 0             THEN 'parcial'
                    ELSE                                    'pendiente'
                END
                WHERE "Estado" = 'pendiente';
                """);

            migrationBuilder.CreateTable(
                name: "NovedadesPrestamo",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    PrestamoId = table.Column<int>(type: "integer", nullable: false),
                    Tipo = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    FechaNovedad = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UsuarioId = table.Column<int>(type: "integer", nullable: false),
                    SaldoPendienteOriginal = table.Column<decimal>(type: "numeric(18,2)", nullable: false),
                    InteresesFuturosEstimados = table.Column<decimal>(type: "numeric(18,2)", nullable: false),
                    ValorNegociado = table.Column<decimal>(type: "numeric(18,2)", nullable: false),
                    DescuentoAplicado = table.Column<decimal>(type: "numeric(18,2)", nullable: false),
                    PagoId = table.Column<int>(type: "integer", nullable: true),
                    Notas = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_NovedadesPrestamo", x => x.Id);
                    table.ForeignKey(
                        name: "FK_NovedadesPrestamo_Pagos_PagoId",
                        column: x => x.PagoId,
                        principalTable: "Pagos",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_NovedadesPrestamo_Prestamos_PrestamoId",
                        column: x => x.PrestamoId,
                        principalTable: "Prestamos",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_NovedadesPrestamo_Usuarios_UsuarioId",
                        column: x => x.UsuarioId,
                        principalTable: "Usuarios",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.UpdateData(
                table: "Pagos",
                keyColumn: "Id",
                keyValue: 1,
                column: "TipoPago",
                value: "regular");

            migrationBuilder.UpdateData(
                table: "Pagos",
                keyColumn: "Id",
                keyValue: 2,
                column: "TipoPago",
                value: "regular");

            migrationBuilder.UpdateData(
                table: "Pagos",
                keyColumn: "Id",
                keyValue: 3,
                column: "TipoPago",
                value: "regular");

            migrationBuilder.UpdateData(
                table: "Pagos",
                keyColumn: "Id",
                keyValue: 4,
                column: "TipoPago",
                value: "regular");

            migrationBuilder.UpdateData(
                table: "Pagos",
                keyColumn: "Id",
                keyValue: 5,
                column: "TipoPago",
                value: "regular");

            migrationBuilder.UpdateData(
                table: "Pagos",
                keyColumn: "Id",
                keyValue: 6,
                column: "TipoPago",
                value: "regular");

            migrationBuilder.UpdateData(
                table: "Pagos",
                keyColumn: "Id",
                keyValue: 7,
                column: "TipoPago",
                value: "regular");

            migrationBuilder.UpdateData(
                table: "Pagos",
                keyColumn: "Id",
                keyValue: 8,
                column: "TipoPago",
                value: "regular");

            migrationBuilder.UpdateData(
                table: "Prestamos",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "Estado", "FechaCierre" },
                values: new object[] { "activo", null });

            migrationBuilder.UpdateData(
                table: "Prestamos",
                keyColumn: "Id",
                keyValue: 2,
                columns: new[] { "Estado", "FechaCierre" },
                values: new object[] { "activo", null });

            migrationBuilder.UpdateData(
                table: "Prestamos",
                keyColumn: "Id",
                keyValue: 3,
                columns: new[] { "Estado", "FechaCierre" },
                values: new object[] { "activo", null });

            migrationBuilder.UpdateData(
                table: "Prestamos",
                keyColumn: "Id",
                keyValue: 4,
                columns: new[] { "Estado", "FechaCierre" },
                values: new object[] { "activo", null });

            migrationBuilder.UpdateData(
                table: "Prestamos",
                keyColumn: "Id",
                keyValue: 5,
                columns: new[] { "Estado", "FechaCierre" },
                values: new object[] { "activo", null });

            migrationBuilder.UpdateData(
                table: "Prestamos",
                keyColumn: "Id",
                keyValue: 6,
                columns: new[] { "Estado", "FechaCierre" },
                values: new object[] { "activo", null });

            migrationBuilder.CreateIndex(
                name: "IX_NovedadesPrestamo_PagoId",
                table: "NovedadesPrestamo",
                column: "PagoId");

            migrationBuilder.CreateIndex(
                name: "IX_NovedadesPrestamo_PrestamoId",
                table: "NovedadesPrestamo",
                column: "PrestamoId");

            migrationBuilder.CreateIndex(
                name: "IX_NovedadesPrestamo_UsuarioId",
                table: "NovedadesPrestamo",
                column: "UsuarioId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "NovedadesPrestamo");

            migrationBuilder.DropColumn(
                name: "Estado",
                table: "Prestamos");

            migrationBuilder.DropColumn(
                name: "FechaCierre",
                table: "Prestamos");

            migrationBuilder.DropColumn(
                name: "TipoPago",
                table: "Pagos");

            migrationBuilder.DropColumn(
                name: "Estado",
                table: "Cuotas");
        }
    }
}
