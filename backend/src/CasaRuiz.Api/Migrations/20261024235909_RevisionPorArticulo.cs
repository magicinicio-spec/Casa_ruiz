using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace CasaRuiz.Api.Migrations
{
    /// <inheritdoc />
    public partial class RevisionPorArticulo : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropCheckConstraint(
                name: "ck_pedido_lineas_daniada_no_negativa",
                table: "pedido_lineas");

            migrationBuilder.DropCheckConstraint(
                name: "ck_pedido_lineas_devuelta_no_negativa",
                table: "pedido_lineas");

            migrationBuilder.DropColumn(
                name: "CantidadDaniada",
                table: "pedido_lineas");

            migrationBuilder.DropColumn(
                name: "CantidadDevuelta",
                table: "pedido_lineas");

            migrationBuilder.CreateTable(
                name: "pedido_articulos",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    PedidoLineaId = table.Column<int>(type: "integer", nullable: false),
                    ArticuloId = table.Column<int>(type: "integer", nullable: false),
                    Descripcion = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Cantidad = table.Column<int>(type: "integer", nullable: false),
                    CantidadDevuelta = table.Column<int>(type: "integer", nullable: true),
                    CantidadDaniada = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_pedido_articulos", x => x.Id);
                    table.CheckConstraint("ck_pedido_articulos_cantidad_positiva", "\"Cantidad\" > 0");
                    table.CheckConstraint("ck_pedido_articulos_daniada_no_negativa", "\"CantidadDaniada\" >= 0");
                    table.CheckConstraint("ck_pedido_articulos_devuelta_no_negativa", "\"CantidadDevuelta\" IS NULL OR \"CantidadDevuelta\" >= 0");
                    table.ForeignKey(
                        name: "FK_pedido_articulos_pedido_lineas_PedidoLineaId",
                        column: x => x.PedidoLineaId,
                        principalTable: "pedido_lineas",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_pedido_articulos_PedidoLineaId",
                table: "pedido_articulos",
                column: "PedidoLineaId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "pedido_articulos");

            migrationBuilder.AddColumn<int>(
                name: "CantidadDaniada",
                table: "pedido_lineas",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "CantidadDevuelta",
                table: "pedido_lineas",
                type: "integer",
                nullable: true);

            migrationBuilder.AddCheckConstraint(
                name: "ck_pedido_lineas_daniada_no_negativa",
                table: "pedido_lineas",
                sql: "\"CantidadDaniada\" >= 0");

            migrationBuilder.AddCheckConstraint(
                name: "ck_pedido_lineas_devuelta_no_negativa",
                table: "pedido_lineas",
                sql: "\"CantidadDevuelta\" IS NULL OR \"CantidadDevuelta\" >= 0");
        }
    }
}
