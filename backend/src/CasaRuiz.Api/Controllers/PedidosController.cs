using CasaRuiz.Api.Dtos;
using CasaRuiz.Api.Models;
using CasaRuiz.Api.Services;
using Microsoft.AspNetCore.Mvc;

namespace CasaRuiz.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class PedidosController(PedidoService pedidos) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IEnumerable<PedidoResponse>>> Get([FromQuery] string? estado)
    {
        EstadoPedido? filtro = null;

        if (!string.IsNullOrWhiteSpace(estado))
        {
            if (!Enum.TryParse<EstadoPedido>(estado, ignoreCase: true, out var parsed))
            {
                return BadRequest(new { error = "El estado debe ser Activo o Cancelado." });
            }

            filtro = parsed;
        }

        return Ok(await pedidos.ListarAsync(filtro));
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<PedidoResponse>> GetById(int id)
    {
        var pedido = await pedidos.ObtenerAsync(id);

        return pedido is null ? NotFound() : Ok(pedido);
    }

    [HttpPost]
    public async Task<ActionResult<PedidoGuardadoResponse>> Create(PedidoRequest request)
    {
        try
        {
            var resultado = await pedidos.CrearAsync(request);

            return CreatedAtAction(nameof(GetById), new { id = resultado.Pedido.Id }, resultado);
        }
        catch (ReglaNegocioException ex)
        {
            return StatusCode(ex.Codigo, new { error = ex.Message });
        }
    }

    [HttpPut("{id:int}")]
    public async Task<ActionResult<PedidoGuardadoResponse>> Update(int id, PedidoRequest request)
    {
        try
        {
            var resultado = await pedidos.ActualizarAsync(id, request);

            return resultado is null ? NotFound() : Ok(resultado);
        }
        catch (ReglaNegocioException ex)
        {
            return StatusCode(ex.Codigo, new { error = ex.Message });
        }
    }

    [HttpPost("{id:int}/cancelar")]
    public async Task<ActionResult<PedidoResponse>> Cancel(int id)
    {
        try
        {
            var pedido = await pedidos.CancelarAsync(id);

            return pedido is null ? NotFound() : Ok(pedido);
        }
        catch (ReglaNegocioException ex)
        {
            return StatusCode(ex.Codigo, new { error = ex.Message });
        }
    }
}
