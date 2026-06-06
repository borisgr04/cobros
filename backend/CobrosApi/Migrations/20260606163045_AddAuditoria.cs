using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace CobrosApi.Migrations
{
    /// <inheritdoc />
    public partial class AddAuditoria : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "CreadoEn",
                table: "Zonas",
                type: "timestamp with time zone",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.AddColumn<int>(
                name: "CreadoPorId",
                table: "Zonas",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "ModificadoEn",
                table: "Zonas",
                type: "timestamp with time zone",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.AddColumn<int>(
                name: "ModificadoPorId",
                table: "Zonas",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "CreadoEn",
                table: "Prestamos",
                type: "timestamp with time zone",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.AddColumn<int>(
                name: "CreadoPorId",
                table: "Prestamos",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "ModificadoEn",
                table: "Prestamos",
                type: "timestamp with time zone",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.AddColumn<int>(
                name: "ModificadoPorId",
                table: "Prestamos",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "CreadoEn",
                table: "Pagos",
                type: "timestamp with time zone",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.AddColumn<int>(
                name: "CreadoPorId",
                table: "Pagos",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "ModificadoEn",
                table: "Pagos",
                type: "timestamp with time zone",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.AddColumn<int>(
                name: "ModificadoPorId",
                table: "Pagos",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "CreadoEn",
                table: "NovedadesPrestamo",
                type: "timestamp with time zone",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.AddColumn<int>(
                name: "CreadoPorId",
                table: "NovedadesPrestamo",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "ModificadoEn",
                table: "NovedadesPrestamo",
                type: "timestamp with time zone",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.AddColumn<int>(
                name: "ModificadoPorId",
                table: "NovedadesPrestamo",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "CreadoEn",
                table: "Clientes",
                type: "timestamp with time zone",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.AddColumn<int>(
                name: "CreadoPorId",
                table: "Clientes",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "ModificadoEn",
                table: "Clientes",
                type: "timestamp with time zone",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.AddColumn<int>(
                name: "ModificadoPorId",
                table: "Clientes",
                type: "integer",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "AuditLogs",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Entidad = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    EntidadId = table.Column<int>(type: "integer", nullable: false),
                    Operacion = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    UsuarioId = table.Column<int>(type: "integer", nullable: true),
                    FechaUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    AnteriorJson = table.Column<string>(type: "text", nullable: true),
                    NuevoJson = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AuditLogs", x => x.Id);
                });

            migrationBuilder.UpdateData(
                table: "Clientes",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "CreadoEn", "CreadoPorId", "ModificadoEn", "ModificadoPorId" },
                values: new object[] { new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), null, new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), null });

            migrationBuilder.UpdateData(
                table: "Clientes",
                keyColumn: "Id",
                keyValue: 2,
                columns: new[] { "CreadoEn", "CreadoPorId", "ModificadoEn", "ModificadoPorId" },
                values: new object[] { new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), null, new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), null });

            migrationBuilder.UpdateData(
                table: "Clientes",
                keyColumn: "Id",
                keyValue: 3,
                columns: new[] { "CreadoEn", "CreadoPorId", "ModificadoEn", "ModificadoPorId" },
                values: new object[] { new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), null, new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), null });

            migrationBuilder.UpdateData(
                table: "Clientes",
                keyColumn: "Id",
                keyValue: 4,
                columns: new[] { "CreadoEn", "CreadoPorId", "ModificadoEn", "ModificadoPorId" },
                values: new object[] { new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), null, new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), null });

            migrationBuilder.UpdateData(
                table: "Clientes",
                keyColumn: "Id",
                keyValue: 5,
                columns: new[] { "CreadoEn", "CreadoPorId", "ModificadoEn", "ModificadoPorId" },
                values: new object[] { new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), null, new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), null });

            migrationBuilder.UpdateData(
                table: "Clientes",
                keyColumn: "Id",
                keyValue: 6,
                columns: new[] { "CreadoEn", "CreadoPorId", "ModificadoEn", "ModificadoPorId" },
                values: new object[] { new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), null, new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), null });

            migrationBuilder.UpdateData(
                table: "Pagos",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "CreadoEn", "CreadoPorId", "ModificadoEn", "ModificadoPorId" },
                values: new object[] { new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), null, new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), null });

            migrationBuilder.UpdateData(
                table: "Pagos",
                keyColumn: "Id",
                keyValue: 2,
                columns: new[] { "CreadoEn", "CreadoPorId", "ModificadoEn", "ModificadoPorId" },
                values: new object[] { new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), null, new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), null });

            migrationBuilder.UpdateData(
                table: "Pagos",
                keyColumn: "Id",
                keyValue: 3,
                columns: new[] { "CreadoEn", "CreadoPorId", "ModificadoEn", "ModificadoPorId" },
                values: new object[] { new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), null, new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), null });

            migrationBuilder.UpdateData(
                table: "Pagos",
                keyColumn: "Id",
                keyValue: 4,
                columns: new[] { "CreadoEn", "CreadoPorId", "ModificadoEn", "ModificadoPorId" },
                values: new object[] { new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), null, new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), null });

            migrationBuilder.UpdateData(
                table: "Pagos",
                keyColumn: "Id",
                keyValue: 5,
                columns: new[] { "CreadoEn", "CreadoPorId", "ModificadoEn", "ModificadoPorId" },
                values: new object[] { new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), null, new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), null });

            migrationBuilder.UpdateData(
                table: "Pagos",
                keyColumn: "Id",
                keyValue: 6,
                columns: new[] { "CreadoEn", "CreadoPorId", "ModificadoEn", "ModificadoPorId" },
                values: new object[] { new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), null, new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), null });

            migrationBuilder.UpdateData(
                table: "Pagos",
                keyColumn: "Id",
                keyValue: 7,
                columns: new[] { "CreadoEn", "CreadoPorId", "ModificadoEn", "ModificadoPorId" },
                values: new object[] { new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), null, new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), null });

            migrationBuilder.UpdateData(
                table: "Pagos",
                keyColumn: "Id",
                keyValue: 8,
                columns: new[] { "CreadoEn", "CreadoPorId", "ModificadoEn", "ModificadoPorId" },
                values: new object[] { new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), null, new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), null });

            migrationBuilder.UpdateData(
                table: "Prestamos",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "CreadoEn", "CreadoPorId", "ModificadoEn", "ModificadoPorId" },
                values: new object[] { new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), null, new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), null });

            migrationBuilder.UpdateData(
                table: "Prestamos",
                keyColumn: "Id",
                keyValue: 2,
                columns: new[] { "CreadoEn", "CreadoPorId", "ModificadoEn", "ModificadoPorId" },
                values: new object[] { new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), null, new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), null });

            migrationBuilder.UpdateData(
                table: "Prestamos",
                keyColumn: "Id",
                keyValue: 3,
                columns: new[] { "CreadoEn", "CreadoPorId", "ModificadoEn", "ModificadoPorId" },
                values: new object[] { new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), null, new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), null });

            migrationBuilder.UpdateData(
                table: "Prestamos",
                keyColumn: "Id",
                keyValue: 4,
                columns: new[] { "CreadoEn", "CreadoPorId", "ModificadoEn", "ModificadoPorId" },
                values: new object[] { new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), null, new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), null });

            migrationBuilder.UpdateData(
                table: "Prestamos",
                keyColumn: "Id",
                keyValue: 5,
                columns: new[] { "CreadoEn", "CreadoPorId", "ModificadoEn", "ModificadoPorId" },
                values: new object[] { new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), null, new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), null });

            migrationBuilder.UpdateData(
                table: "Prestamos",
                keyColumn: "Id",
                keyValue: 6,
                columns: new[] { "CreadoEn", "CreadoPorId", "ModificadoEn", "ModificadoPorId" },
                values: new object[] { new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), null, new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), null });

            migrationBuilder.UpdateData(
                table: "Zonas",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "CreadoEn", "CreadoPorId", "ModificadoEn", "ModificadoPorId" },
                values: new object[] { new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), null, new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), null });

            migrationBuilder.UpdateData(
                table: "Zonas",
                keyColumn: "Id",
                keyValue: 2,
                columns: new[] { "CreadoEn", "CreadoPorId", "ModificadoEn", "ModificadoPorId" },
                values: new object[] { new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), null, new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), null });

            migrationBuilder.UpdateData(
                table: "Zonas",
                keyColumn: "Id",
                keyValue: 3,
                columns: new[] { "CreadoEn", "CreadoPorId", "ModificadoEn", "ModificadoPorId" },
                values: new object[] { new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), null, new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), null });

            migrationBuilder.CreateIndex(
                name: "IX_AuditLogs_Entidad_EntidadId",
                table: "AuditLogs",
                columns: new[] { "Entidad", "EntidadId" });

            migrationBuilder.CreateIndex(
                name: "IX_AuditLogs_FechaUtc",
                table: "AuditLogs",
                column: "FechaUtc");

            migrationBuilder.CreateIndex(
                name: "IX_AuditLogs_UsuarioId",
                table: "AuditLogs",
                column: "UsuarioId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "AuditLogs");

            migrationBuilder.DropColumn(
                name: "CreadoEn",
                table: "Zonas");

            migrationBuilder.DropColumn(
                name: "CreadoPorId",
                table: "Zonas");

            migrationBuilder.DropColumn(
                name: "ModificadoEn",
                table: "Zonas");

            migrationBuilder.DropColumn(
                name: "ModificadoPorId",
                table: "Zonas");

            migrationBuilder.DropColumn(
                name: "CreadoEn",
                table: "Prestamos");

            migrationBuilder.DropColumn(
                name: "CreadoPorId",
                table: "Prestamos");

            migrationBuilder.DropColumn(
                name: "ModificadoEn",
                table: "Prestamos");

            migrationBuilder.DropColumn(
                name: "ModificadoPorId",
                table: "Prestamos");

            migrationBuilder.DropColumn(
                name: "CreadoEn",
                table: "Pagos");

            migrationBuilder.DropColumn(
                name: "CreadoPorId",
                table: "Pagos");

            migrationBuilder.DropColumn(
                name: "ModificadoEn",
                table: "Pagos");

            migrationBuilder.DropColumn(
                name: "ModificadoPorId",
                table: "Pagos");

            migrationBuilder.DropColumn(
                name: "CreadoEn",
                table: "NovedadesPrestamo");

            migrationBuilder.DropColumn(
                name: "CreadoPorId",
                table: "NovedadesPrestamo");

            migrationBuilder.DropColumn(
                name: "ModificadoEn",
                table: "NovedadesPrestamo");

            migrationBuilder.DropColumn(
                name: "ModificadoPorId",
                table: "NovedadesPrestamo");

            migrationBuilder.DropColumn(
                name: "CreadoEn",
                table: "Clientes");

            migrationBuilder.DropColumn(
                name: "CreadoPorId",
                table: "Clientes");

            migrationBuilder.DropColumn(
                name: "ModificadoEn",
                table: "Clientes");

            migrationBuilder.DropColumn(
                name: "ModificadoPorId",
                table: "Clientes");
        }
    }
}
