using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CasaRuiz.Api.Migrations
{
    /// <inheritdoc />
    public partial class AgregarConversionCotizacion : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTimeOffset>(
                name: "ConvertidaEn",
                table: "cotizaciones",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "PedidoId",
                table: "cotizaciones",
                type: "integer",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ConvertidaEn",
                table: "cotizaciones");

            migrationBuilder.DropColumn(
                name: "PedidoId",
                table: "cotizaciones");
        }
    }
}
