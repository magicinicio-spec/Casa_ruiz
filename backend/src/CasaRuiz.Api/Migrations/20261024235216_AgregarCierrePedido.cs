using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CasaRuiz.Api.Migrations
{
    /// <inheritdoc />
    public partial class AgregarCierrePedido : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTimeOffset>(
                name: "CerradoEn",
                table: "pedidos",
                type: "timestamp with time zone",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "CerradoEn",
                table: "pedidos");
        }
    }
}
