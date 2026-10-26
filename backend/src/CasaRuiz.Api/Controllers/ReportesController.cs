using System.Globalization;
using CasaRuiz.Api.Configuracion;
using CasaRuiz.Api.Dtos;
using CasaRuiz.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CasaRuiz.Api.Controllers;

[ApiController]
[Authorize(Roles = Permisos.Dashboard)]
[Route("api/[controller]")]
public class ReportesController(ReportesService reportes) : ControllerBase
{
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
