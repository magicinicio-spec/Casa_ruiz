using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CasaRuiz.Api.Migrations
{
    /// <inheritdoc />
    public partial class AgregarEntregas : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTimeOffset>(
                name: "EntregadoEn",
                table: "pedidos",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<DateTimeOffset>(
                name: "RecogidoEn",
                table: "pedidos",
                type: "timestamp with time zone",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "EntregadoEn",
                table: "pedidos");

            migrationBuilder.DropColumn(
                name: "RecogidoEn",
                table: "pedidos");
        }
    }
}
