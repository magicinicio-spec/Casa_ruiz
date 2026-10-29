using CasaRuiz.Api.Configuracion;
using CasaRuiz.Api.Dtos;
using CasaRuiz.Api.Exportacion;
using CasaRuiz.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CasaRuiz.Api.Controllers;

[ApiController]
[Authorize(Roles = Permisos.Operacion)]
[Route("api/[controller]")]
public class CotizacionesController(CotizacionService cotizaciones) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IEnumerable<CotizacionResponse>>> Get() => Ok(await cotizaciones.ListarAsync());

    [HttpGet("{id:int}")]
    public async Task<ActionResult<CotizacionResponse>> GetById(int id)
    {
        var cotizacion = await cotizaciones.ObtenerAsync(id);

        return cotizacion is null ? NotFound() : Ok(cotizacion);
    }

    [HttpPost]
    public async Task<ActionResult<CotizacionResponse>> Create(CotizacionRequest request)
    {
        try
        {
            var id = await cotizaciones.CrearAsync(request);

            return CreatedAtAction(nameof(GetById), new { id }, await cotizaciones.ObtenerAsync(id));
        }
        catch (ReglaNegocioException ex)
        {
            return StatusCode(ex.Codigo, new { error = ex.Message });
        }
    }

    [HttpPut("{id:int}")]
    public async Task<ActionResult<CotizacionResponse>> Update(int id, CotizacionRequest request)
    {
        try
        {
            if (!await cotizaciones.ActualizarAsync(id, request))
            {
                return NotFound();
            }

            return Ok(await cotizaciones.ObtenerAsync(id));
        }
        catch (ReglaNegocioException ex)
        {
            return StatusCode(ex.Codigo, new { error = ex.Message });
        }
    }

    /// <summary>Crea un pedido a partir de la cotización, con los datos que confirme el usuario.</summary>
    [HttpPost("{id:int}/convertir")]
    public async Task<ActionResult<PedidoGuardadoResponse>> Convertir(int id, PedidoRequest request, [FromServices] PedidoService pedidos)
    {
        try
        {
            return Ok(await cotizaciones.ConvertirAsync(id, request, pedidos));
        }
        catch (ReglaNegocioException ex)
        {
            return StatusCode(ex.Codigo, new { error = ex.Message });
        }
    }

    /// <summary>Hoja de la cotización en PDF tamaño carta A4.</summary>
    [HttpGet("{id:int}/imprimir")]
    public async Task<IActionResult> Imprimir(int id)
    {
        var cotizacion = await cotizaciones.ObtenerAsync(id);
        if (cotizacion is null)
        {
            return NotFound();
        }

        return File(ExportadorCotizaciones.ComoPdf(cotizacion), "application/pdf", $"cotizacion-{id}.pdf");
    }
}
