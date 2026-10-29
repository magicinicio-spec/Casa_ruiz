using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace CasaRuiz.Api.Migrations
{
    /// <inheritdoc />
    public partial class AgregarCotizaciones : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "cotizaciones",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    ClienteId = table.Column<int>(type: "integer", nullable: false),
                    FechaCreacion = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    FechaHoraEntrega = table.Column<DateTime>(type: "timestamp without time zone", nullable: false),
                    FechaDevolucion = table.Column<DateOnly>(type: "date", nullable: false),
                    DireccionEntrega = table.Column<string>(type: "character varying(400)", maxLength: 400, nullable: false),
                    DireccionEsDelCliente = table.Column<bool>(type: "boolean", nullable: false),
                    RequiereFactura = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_cotizaciones", x => x.Id);
                    table.ForeignKey(
                        name: "FK_cotizaciones_clientes_ClienteId",
                        column: x => x.ClienteId,
                        principalTable: "clientes",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "cotizacion_lineas",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    CotizacionId = table.Column<int>(type: "integer", nullable: false),
                    ArticuloId = table.Column<int>(type: "integer", nullable: true),
                    PaqueteId = table.Column<int>(type: "integer", nullable: true),
                    Descripcion = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Cantidad = table.Column<int>(type: "integer", nullable: false),
                    PrecioUnitario = table.Column<decimal>(type: "numeric(12,2)", precision: 12, scale: 2, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_cotizacion_lineas", x => x.Id);
                    table.CheckConstraint("ck_cotizacion_lineas_cantidad_positiva", "\"Cantidad\" > 0");
                    table.CheckConstraint("ck_cotizacion_lineas_un_tipo", "(\"ArticuloId\" IS NULL) <> (\"PaqueteId\" IS NULL)");
                    table.ForeignKey(
                        name: "FK_cotizacion_lineas_cotizaciones_CotizacionId",
                        column: x => x.CotizacionId,
                        principalTable: "cotizaciones",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "cotizacion_articulos",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    CotizacionLineaId = table.Column<int>(type: "integer", nullable: false),
                    ArticuloId = table.Column<int>(type: "integer", nullable: false),
                    Descripcion = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Cantidad = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_cotizacion_articulos", x => x.Id);
                    table.CheckConstraint("ck_cotizacion_articulos_cantidad_positiva", "\"Cantidad\" > 0");
                    table.ForeignKey(
                        name: "FK_cotizacion_articulos_cotizacion_lineas_CotizacionLineaId",
                        column: x => x.CotizacionLineaId,
                        principalTable: "cotizacion_lineas",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_cotizacion_articulos_CotizacionLineaId",
                table: "cotizacion_articulos",
                column: "CotizacionLineaId");

            migrationBuilder.CreateIndex(
                name: "IX_cotizacion_lineas_CotizacionId",
                table: "cotizacion_lineas",
                column: "CotizacionId");

            migrationBuilder.CreateIndex(
                name: "IX_cotizaciones_ClienteId",
                table: "cotizaciones",
                column: "ClienteId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "cotizacion_articulos");

            migrationBuilder.DropTable(
                name: "cotizacion_lineas");

            migrationBuilder.DropTable(
                name: "cotizaciones");
        }
    }
}
