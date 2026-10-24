using CasaRuiz.Api.Dtos;
using CasaRuiz.Api.Services;
using Microsoft.AspNetCore.Mvc;

namespace CasaRuiz.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class EntregasController(PedidoService pedidos) : ControllerBase
{
    /// <summary>Pedidos pendientes de entregar.</summary>
    [HttpGet("cola")]
    public async Task<ActionResult<IEnumerable<PedidoResponse>>> Cola() =>
        Ok(await pedidos.ListarColaEntregaAsync());

    /// <summary>Pedidos entregados cuyas piezas aún faltan por recoger.</summary>
    [HttpGet("por-recoger")]
    public async Task<ActionResult<IEnumerable<PedidoResponse>>> PorRecoger() =>
        Ok(await pedidos.ListarPendientesRecogerAsync());

    [HttpPost("{id:int}/entregar")]
    public async Task<ActionResult<PedidoResponse>> Entregar(int id)
    {
        try
        {
            var pedido = await pedidos.MarcarEntregadoAsync(id);

            return pedido is null ? NotFound() : Ok(pedido);
        }
        catch (ReglaNegocioException ex)
        {
            return StatusCode(ex.Codigo, new { error = ex.Message });
        }
    }

    [HttpPost("{id:int}/recoger")]
    public async Task<ActionResult<PedidoResponse>> Recoger(int id)
    {
        try
        {
            var pedido = await pedidos.MarcarRecogidoAsync(id);

            return pedido is null ? NotFound() : Ok(pedido);
        }
        catch (ReglaNegocioException ex)
        {
            return StatusCode(ex.Codigo, new { error = ex.Message });
        }
    }
}
