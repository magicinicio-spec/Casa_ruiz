using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace CasaRuiz.Api.Migrations
{
    /// <inheritdoc />
    public partial class PaquetesYPedidos : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "paquetes",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Nombre = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    PrecioRenta = table.Column<decimal>(type: "numeric(12,2)", precision: 12, scale: 2, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_paquetes", x => x.Id);
                    table.CheckConstraint("ck_paquetes_precio_no_negativo", "\"PrecioRenta\" >= 0");
                });

            migrationBuilder.CreateTable(
                name: "pedidos",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    ClienteId = table.Column<int>(type: "integer", nullable: false),
                    FechaCreacion = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    FechaHoraEntrega = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    FechaDevolucion = table.Column<DateOnly>(type: "date", nullable: false),
                    DireccionEntrega = table.Column<string>(type: "character varying(400)", maxLength: 400, nullable: false),
                    DireccionEsDelCliente = table.Column<bool>(type: "boolean", nullable: false),
                    RequiereFactura = table.Column<bool>(type: "boolean", nullable: false),
                    Anticipo = table.Column<decimal>(type: "numeric(12,2)", precision: 12, scale: 2, nullable: false),
                    Pagado = table.Column<bool>(type: "boolean", nullable: false),
                    Estado = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_pedidos", x => x.Id);
                    table.CheckConstraint("ck_pedidos_anticipo_no_negativo", "\"Anticipo\" >= 0");
                    table.ForeignKey(
                        name: "FK_pedidos_clientes_ClienteId",
                        column: x => x.ClienteId,
                        principalTable: "clientes",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "paquete_articulos",
                columns: table => new
                {
                    PaqueteId = table.Column<int>(type: "integer", nullable: false),
                    ArticuloId = table.Column<int>(type: "integer", nullable: false),
                    Cantidad = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_paquete_articulos", x => new { x.PaqueteId, x.ArticuloId });
                    table.CheckConstraint("ck_paquete_articulos_cantidad_positiva", "\"Cantidad\" > 0");
                    table.ForeignKey(
                        name: "FK_paquete_articulos_articulos_ArticuloId",
                        column: x => x.ArticuloId,
                        principalTable: "articulos",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_paquete_articulos_paquetes_PaqueteId",
                        column: x => x.PaqueteId,
                        principalTable: "paquetes",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "pedido_lineas",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    PedidoId = table.Column<int>(type: "integer", nullable: false),
                    ArticuloId = table.Column<int>(type: "integer", nullable: true),
                    PaqueteId = table.Column<int>(type: "integer", nullable: true),
                    Descripcion = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Cantidad = table.Column<int>(type: "integer", nullable: false),
                    PrecioUnitario = table.Column<decimal>(type: "numeric(12,2)", precision: 12, scale: 2, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_pedido_lineas", x => x.Id);
                    table.CheckConstraint("ck_pedido_lineas_cantidad_positiva", "\"Cantidad\" > 0");
                    table.CheckConstraint("ck_pedido_lineas_un_tipo", "(\"ArticuloId\" IS NULL) <> (\"PaqueteId\" IS NULL)");
                    table.ForeignKey(
                        name: "FK_pedido_lineas_articulos_ArticuloId",
                        column: x => x.ArticuloId,
                        principalTable: "articulos",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_pedido_lineas_paquetes_PaqueteId",
                        column: x => x.PaqueteId,
                        principalTable: "paquetes",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_pedido_lineas_pedidos_PedidoId",
                        column: x => x.PedidoId,
                        principalTable: "pedidos",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_paquete_articulos_ArticuloId",
                table: "paquete_articulos",
                column: "ArticuloId");

            migrationBuilder.CreateIndex(
                name: "IX_pedido_lineas_ArticuloId",
                table: "pedido_lineas",
                column: "ArticuloId");

            migrationBuilder.CreateIndex(
                name: "IX_pedido_lineas_PaqueteId",
                table: "pedido_lineas",
                column: "PaqueteId");

            migrationBuilder.CreateIndex(
                name: "IX_pedido_lineas_PedidoId",
                table: "pedido_lineas",
                column: "PedidoId");

            migrationBuilder.CreateIndex(
                name: "IX_pedidos_ClienteId",
                table: "pedidos",
                column: "ClienteId");

            migrationBuilder.CreateIndex(
                name: "IX_pedidos_Estado",
                table: "pedidos",
                column: "Estado");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "paquete_articulos");

            migrationBuilder.DropTable(
                name: "pedido_lineas");

            migrationBuilder.DropTable(
                name: "paquetes");

            migrationBuilder.DropTable(
                name: "pedidos");
        }
    }
}
