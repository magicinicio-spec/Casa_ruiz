using CasaRuiz.Api.Configuracion;
using Microsoft.AspNetCore.Authorization;
using CasaRuiz.Api.Data;
using CasaRuiz.Api.Dtos;
using CasaRuiz.Api.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CasaRuiz.Api.Controllers;

[ApiController]
[Authorize(Roles = Permisos.Operacion)]
[Route("api/[controller]")]
public class ArticulosController(AppDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IEnumerable<ArticuloResponse>>> Get([FromQuery] string? categoria)
    {
        var query = db.Articulos.AsNoTracking().AsQueryable();

        if (!string.IsNullOrWhiteSpace(categoria))
        {
            query = query.Where(a => a.Categoria == categoria);
        }

        var articulos = await query
            .OrderBy(a => a.Categoria)
            .ThenBy(a => a.Descripcion)
            .Select(a => ToResponse(a))
            .ToListAsync();

        return Ok(articulos);
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<ArticuloResponse>> GetById(int id)
    {
        var articulo = await db.Articulos.AsNoTracking().FirstOrDefaultAsync(a => a.Id == id);

        return articulo is null ? NotFound() : Ok(ToResponse(articulo));
    }

    [HttpPost]
    public async Task<ActionResult<ArticuloResponse>> Create(ArticuloRequest request)
    {
        var articulo = new Articulo();
        Apply(articulo, request);

        db.Articulos.Add(articulo);
        await db.SaveChangesAsync();

        return CreatedAtAction(nameof(GetById), new { id = articulo.Id }, ToResponse(articulo));
    }

    [HttpPut("{id:int}")]
    public async Task<ActionResult<ArticuloResponse>> Update(int id, ArticuloRequest request)
    {
        var articulo = await db.Articulos.FindAsync(id);
        if (articulo is null)
        {
            return NotFound();
        }

        Apply(articulo, request);
        await db.SaveChangesAsync();

        return Ok(ToResponse(articulo));
    }

    private static void Apply(Articulo articulo, ArticuloRequest request)
    {
        articulo.Descripcion = request.Descripcion.Trim();
        articulo.Categoria = request.Categoria.Trim();
        articulo.PrecioRenta = request.PrecioRenta;
        articulo.ExistenciaTotal = request.ExistenciaTotal;
    }

    private static ArticuloResponse ToResponse(Articulo a) =>
        new(a.Id, a.Descripcion, a.Categoria, a.PrecioRenta, a.ExistenciaTotal);
}
