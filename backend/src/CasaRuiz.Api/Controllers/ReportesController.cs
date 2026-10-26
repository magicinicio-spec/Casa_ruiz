using System.Globalization;
using CasaRuiz.Api.Configuracion;
using CasaRuiz.Api.Dtos;
using CasaRuiz.Api.Exportacion;
using CasaRuiz.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CasaRuiz.Api.Controllers;

[ApiController]
[Authorize(Roles = Permisos.Dashboard)]
[Route("api/[controller]")]
public class ReportesController(ReportesService reportes, ExportadorReportes exportador) : ControllerBase
{
    [HttpGet("pedidos-pagados/{formato}")]
    public async Task<IActionResult> PedidosPagadosArchivo(
        string formato,
        [FromQuery] string? desde,
        [FromQuery] string? hasta)
    {
        if (!TryFecha(desde, out var fechaDesde) || !TryFecha(hasta, out var fechaHasta))
        {
            return BadRequest(new { error = "Las fechas deben tener el formato dd-MM-yyyy." });
        }

        try
        {
            return Archivo(await exportador.PedidosPagadosAsync(fechaDesde, fechaHasta), formato);
        }
        catch (ReglaNegocioException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpGet("pendientes-recoger/{formato}")]
    public async Task<IActionResult> PendientesRecogerArchivo(string formato) =>
        Archivo(await exportador.PendientesRecogerAsync(), formato);

    [HttpGet("inventario/{formato}")]
    public async Task<IActionResult> InventarioArchivo(string formato) =>
        Archivo(await exportador.InventarioAsync(), formato);

    [HttpGet("pedidos-pagados")]
    public async Task<ActionResult<ReportePedidosPagadosResponse>> PedidosPagados(
        [FromQuery] string? desde,
        [FromQuery] string? hasta)
    {
        if (!TryFecha(desde, out var fechaDesde) || !TryFecha(hasta, out var fechaHasta))
        {
            return BadRequest(new { error = "Las fechas deben tener el formato dd-MM-yyyy." });
        }

        try
        {
            return Ok(await reportes.PedidosPagadosAsync(fechaDesde, fechaHasta));
        }
        catch (ReglaNegocioException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpGet("pendientes-recoger")]
    public async Task<ActionResult<IEnumerable<ReportePedidoResponse>>> PendientesRecoger() =>
        Ok(await reportes.PendientesRecogerAsync());

    [HttpGet("inventario")]
    public async Task<ActionResult<IEnumerable<ReporteInventarioArticulo>>> Inventario() =>
        Ok(await reportes.InventarioAsync());

    private IActionResult Archivo(TablaReporte tabla, string formato)
    {
        var fecha = DateTime.Now.ToString("dd-MM-yyyy");

        return formato switch
        {
            "excel" => File(
                exportador.ComoExcel(tabla),
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                $"{tabla.Nombre}-{fecha}.xlsx"),
            "pdf" => File(exportador.ComoPdf(tabla), "application/pdf", $"{tabla.Nombre}-{fecha}.pdf"),
            _ => NotFound(),
        };
    }

    /// <summary>Fecha opcional en formato dd-MM-yyyy. Sin valor significa sin límite.</summary>
    private static bool TryFecha(string? texto, out DateOnly? fecha)
    {
        fecha = null;
        if (string.IsNullOrWhiteSpace(texto))
        {
            return true;
        }

        if (DateOnly.TryParseExact(texto, FechaJsonConverter.Formato, CultureInfo.InvariantCulture, DateTimeStyles.None, out var valor))
        {
            fecha = valor;
            return true;
        }

        return false;
    }
}
