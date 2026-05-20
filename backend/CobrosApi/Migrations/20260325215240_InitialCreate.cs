using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace CobrosApi.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Usuarios",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Email = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Nombre = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    FotoUrl = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    CreadoEn = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UltimoAcceso = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Usuarios", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Zonas",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Nombre = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Estado = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Zonas", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Clientes",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Nombre = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Alias = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    Identificacion = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    Direccion = table.Column<string>(type: "character varying(300)", maxLength: 300, nullable: true),
                    ZonaId = table.Column<int>(type: "integer", nullable: false),
                    Telefono = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: true),
                    CuentaBancaria = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    Llave = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    Estado = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Clientes", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Clientes_Zonas_ZonaId",
                        column: x => x.ZonaId,
                        principalTable: "Zonas",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Prestamos",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    ClienteId = table.Column<int>(type: "integer", nullable: false),
                    FechaPrestamo = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    FechaFinal = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    ValorPrestado = table.Column<decimal>(type: "numeric(18,2)", nullable: false),
                    ValorTotal = table.Column<decimal>(type: "numeric(18,2)", nullable: false),
                    InteresProyectado = table.Column<decimal>(type: "numeric(18,2)", nullable: false),
                    FrecuenciaPago = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    CantidadCuotas = table.Column<int>(type: "integer", nullable: false),
                    ValorCuota = table.Column<decimal>(type: "numeric(18,2)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Prestamos", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Prestamos_Clientes_ClienteId",
                        column: x => x.ClienteId,
                        principalTable: "Clientes",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Pagos",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    PrestamoId = table.Column<int>(type: "integer", nullable: false),
                    Valor = table.Column<decimal>(type: "numeric(18,2)", nullable: false),
                    FechaPago = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Pagos", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Pagos_Prestamos_PrestamoId",
                        column: x => x.PrestamoId,
                        principalTable: "Prestamos",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.InsertData(
                table: "Zonas",
                columns: new[] { "Id", "Estado", "Nombre" },
                values: new object[,]
                {
                    { 1, "activo", "Centro" },
                    { 2, "activo", "Norte" },
                    { 3, "inactivo", "Sur" }
                });

            migrationBuilder.InsertData(
                table: "Clientes",
                columns: new[] { "Id", "Alias", "CuentaBancaria", "Direccion", "Estado", "Identificacion", "Llave", "Nombre", "Telefono", "ZonaId" },
                values: new object[,]
                {
                    { 1, "Juanito", null, "Calle Principal #123, Centro", "activo", "12345678", null, "Juan Pérez García", "555-0101", 1 },
                    { 2, "Mary", null, "Av. Norte #456", "activo", "87654321", null, "María López Ruiz", "555-0202", 2 },
                    { 3, null, null, "Barrio Sur #789", "activo", "11223344", null, "Carlos Martínez", "555-0303", 3 },
                    { 4, null, null, "Calle 5 #12", "activo", "44332211", null, "Ana González Torres", "555-0404", 1 },
                    { 5, "Pedrito", null, "Av. Central #321", "inactivo", "55667788", null, "Pedro Rodríguez", "555-0505", 2 },
                    { 6, null, null, "Plaza Mayor #7", "activo", "99887766", null, "Sofía Ramírez", "555-0606", 1 }
                });

            migrationBuilder.InsertData(
                table: "Prestamos",
                columns: new[] { "Id", "CantidadCuotas", "ClienteId", "FechaFinal", "FechaPrestamo", "FrecuenciaPago", "InteresProyectado", "ValorCuota", "ValorPrestado", "ValorTotal" },
                values: new object[,]
                {
                    { 1, 26, 1, new DateTime(2025, 5, 15, 0, 0, 0, 0, DateTimeKind.Utc), new DateTime(2024, 11, 15, 0, 0, 0, 0, DateTimeKind.Utc), "semanal", 200000m, 46154m, 1000000m, 1200000m },
                    { 2, 12, 2, new DateTime(2025, 4, 1, 0, 0, 0, 0, DateTimeKind.Utc), new DateTime(2024, 10, 1, 0, 0, 0, 0, DateTimeKind.Utc), "quincenal", 100000m, 50000m, 500000m, 600000m },
                    { 3, 6, 3, new DateTime(2025, 6, 1, 0, 0, 0, 0, DateTimeKind.Utc), new DateTime(2024, 12, 1, 0, 0, 0, 0, DateTimeKind.Utc), "mensual", 150000m, 150000m, 750000m, 900000m },
                    { 4, 26, 4, new DateTime(2025, 7, 10, 0, 0, 0, 0, DateTimeKind.Utc), new DateTime(2025, 1, 10, 0, 0, 0, 0, DateTimeKind.Utc), "semanal", 400000m, 92308m, 2000000m, 2400000m },
                    { 5, 180, 1, new DateTime(2025, 8, 1, 0, 0, 0, 0, DateTimeKind.Utc), new DateTime(2025, 2, 1, 0, 0, 0, 0, DateTimeKind.Utc), "diario", 60000m, 2000m, 300000m, 360000m },
                    { 6, 12, 6, new DateTime(2025, 9, 1, 0, 0, 0, 0, DateTimeKind.Utc), new DateTime(2025, 3, 1, 0, 0, 0, 0, DateTimeKind.Utc), "quincenal", 300000m, 150000m, 1500000m, 1800000m }
                });

            migrationBuilder.InsertData(
                table: "Pagos",
                columns: new[] { "Id", "FechaPago", "PrestamoId", "Valor" },
                values: new object[,]
                {
                    { 1, new DateTime(2024, 11, 22, 0, 0, 0, 0, DateTimeKind.Utc), 1, 46154m },
                    { 2, new DateTime(2024, 11, 29, 0, 0, 0, 0, DateTimeKind.Utc), 1, 46154m },
                    { 3, new DateTime(2024, 12, 6, 0, 0, 0, 0, DateTimeKind.Utc), 1, 46154m },
                    { 4, new DateTime(2024, 10, 15, 0, 0, 0, 0, DateTimeKind.Utc), 2, 50000m },
                    { 5, new DateTime(2024, 11, 1, 0, 0, 0, 0, DateTimeKind.Utc), 2, 50000m },
                    { 6, new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), 3, 150000m },
                    { 7, new DateTime(2025, 1, 17, 0, 0, 0, 0, DateTimeKind.Utc), 4, 92308m },
                    { 8, new DateTime(2025, 1, 24, 0, 0, 0, 0, DateTimeKind.Utc), 4, 92308m }
                });

            migrationBuilder.CreateIndex(
                name: "IX_Clientes_ZonaId",
                table: "Clientes",
                column: "ZonaId");

            migrationBuilder.CreateIndex(
                name: "IX_Pagos_PrestamoId",
                table: "Pagos",
                column: "PrestamoId");

            migrationBuilder.CreateIndex(
                name: "IX_Prestamos_ClienteId",
                table: "Prestamos",
                column: "ClienteId");

            migrationBuilder.CreateIndex(
                name: "IX_Usuarios_Email",
                table: "Usuarios",
                column: "Email",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Pagos");

            migrationBuilder.DropTable(
                name: "Usuarios");

            migrationBuilder.DropTable(
                name: "Prestamos");

            migrationBuilder.DropTable(
                name: "Clientes");

            migrationBuilder.DropTable(
                name: "Zonas");
        }
    }
}
