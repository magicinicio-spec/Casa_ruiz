using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CasaRuiz.Api.Migrations
{
    /// <inheritdoc />
    public partial class AgregarRevisionDevoluciones : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
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

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
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
        }
    }
}
