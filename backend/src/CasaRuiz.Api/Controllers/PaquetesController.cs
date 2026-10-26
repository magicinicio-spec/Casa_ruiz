using CasaRuiz.Api.Configuracion;
using Microsoft.AspNetCore.Authorization;
using CasaRuiz.Api.Data;
using CasaRuiz.Api.Dtos;
using CasaRuiz.Api.Models;
using CasaRuiz.Api.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CasaRuiz.Api.Controllers;

[ApiController]
[Authorize(Roles = Permisos.Operacion)]
[Route("api/[controller]")]
public class PaquetesController(AppDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IEnumerable<PaqueteResponse>>> Get()
    {
        var paquetes = await db.Paquetes
            .AsNoTracking()
            .Include(p => p.Componentes)
                .ThenInclude(c => c.Articulo)
            .OrderBy(p => p.Nombre)
            .ToListAsync();

        return Ok(paquetes.Select(ToResponse));
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<PaqueteResponse>> GetById(int id)
    {
        var paquete = await db.Paquetes
            .AsNoTracking()
            .Include(p => p.Componentes)
                .ThenInclude(c => c.Articulo)
            .FirstOrDefaultAsync(p => p.Id == id);

        return paquete is null ? NotFound() : Ok(ToResponse(paquete));
    }

    [HttpPost]
    public async Task<ActionResult<PaqueteResponse>> Create(PaqueteRequest request)
    {
        var paquete = new Paquete();

        try
        {
            await AplicarAsync(paquete, request);
        }
        catch (ReglaNegocioException ex)
        {
            return BadRequest(new { error = ex.Message });
        }

        db.Paquetes.Add(paquete);
        await db.SaveChangesAsync();

        return CreatedAtAction(nameof(GetById), new { id = paquete.Id }, await ObtenerAsync(paquete.Id));
    }

    [HttpPut("{id:int}")]
    public async Task<ActionResult<PaqueteResponse>> Update(int id, PaqueteRequest request)
    {
        var paquete = await db.Paquetes
            .Include(p => p.Componentes)
            .FirstOrDefaultAsync(p => p.Id == id);

        if (paquete is null)
        {
            return NotFound();
        }

        try
        {
            await AplicarAsync(paquete, request);
        }
        catch (ReglaNegocioException ex)
        {
            return BadRequest(new { error = ex.Message });
        }

        await db.SaveChangesAsync();

        return Ok(await ObtenerAsync(id));
    }

    private async Task AplicarAsync(Paquete paquete, PaqueteRequest request)
    {
        var articuloIds = request.Componentes.Select(c => c.ArticuloId).ToList();

        if (articuloIds.Distinct().Count() != articuloIds.Count)
        {
            throw new ReglaNegocioException("Un artículo no puede repetirse dentro del paquete.");
        }

        var existentes = await db.Articulos
            .Where(a => articuloIds.Contains(a.Id))
            .CountAsync();

        if (existentes != articuloIds.Count)
        {
            throw new ReglaNegocioException("Uno o más artículos del paquete no existen.");
        }

        paquete.Nombre = request.Nombre.Trim();
        paquete.PrecioRenta = request.PrecioRenta;

        // Actualiza las filas existentes en lugar de reemplazarlas, para no chocar con la clave compuesta.
        var porArticulo = paquete.Componentes.ToDictionary(c => c.ArticuloId);
        paquete.Componentes.RemoveAll(c => !articuloIds.Contains(c.ArticuloId));

        foreach (var componente in request.Componentes)
        {
            if (porArticulo.TryGetValue(componente.ArticuloId, out var existente))
            {
                existente.Cantidad = componente.Cantidad;
            }
            else
            {
                paquete.Componentes.Add(new PaqueteArticulo
                {
                    ArticuloId = componente.ArticuloId,
                    Cantidad = componente.Cantidad,
                });
            }
        }
    }

    private async Task<PaqueteResponse?> ObtenerAsync(int id)
    {
        var paquete = await db.Paquetes
            .AsNoTracking()
            .Include(p => p.Componentes)
                .ThenInclude(c => c.Articulo)
            .FirstOrDefaultAsync(p => p.Id == id);

        return paquete is null ? null : ToResponse(paquete);
    }

    private static PaqueteResponse ToResponse(Paquete p) =>
        new(
            p.Id,
            p.Nombre,
            p.PrecioRenta,
            p.Componentes
                .Select(c => new ComponenteResponse(c.ArticuloId, c.Articulo.Descripcion, c.Cantidad))
                .ToList());
}
