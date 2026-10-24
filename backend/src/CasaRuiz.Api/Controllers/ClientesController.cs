using CasaRuiz.Api.Data;
using CasaRuiz.Api.Dtos;
using CasaRuiz.Api.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CasaRuiz.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ClientesController(AppDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IEnumerable<ClienteResponse>>> Get([FromQuery] string? buscar)
    {
        var query = db.Clientes.AsNoTracking().AsQueryable();

        if (!string.IsNullOrWhiteSpace(buscar))
        {
            var termino = buscar.Trim();
            query = query.Where(c => c.NombreCompleto.Contains(termino) || c.Telefono.Contains(termino));
        }

        var clientes = await query
            .OrderBy(c => c.NombreCompleto)
            .Select(c => ToResponse(c))
            .ToListAsync();

        return Ok(clientes);
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<ClienteResponse>> GetById(int id)
    {
        var cliente = await db.Clientes.AsNoTracking().FirstOrDefaultAsync(c => c.Id == id);

        return cliente is null ? NotFound() : Ok(ToResponse(cliente));
    }

    [HttpPost]
    public async Task<ActionResult<ClienteResponse>> Create(ClienteRequest request)
    {
        var cliente = new Cliente();
        Apply(cliente, request);

        db.Clientes.Add(cliente);
        await db.SaveChangesAsync();

        return CreatedAtAction(nameof(GetById), new { id = cliente.Id }, ToResponse(cliente));
    }

    [HttpPut("{id:int}")]
    public async Task<ActionResult<ClienteResponse>> Update(int id, ClienteRequest request)
    {
        var cliente = await db.Clientes.FindAsync(id);
        if (cliente is null)
        {
            return NotFound();
        }

        Apply(cliente, request);
        await db.SaveChangesAsync();

        return Ok(ToResponse(cliente));
    }

    private static void Apply(Cliente cliente, ClienteRequest request)
    {
        cliente.NombreCompleto = request.NombreCompleto.Trim();
        cliente.Telefono = request.Telefono.Trim();
        cliente.Direccion = request.Direccion.Trim();
    }

    private static ClienteResponse ToResponse(Cliente c) =>
        new(c.Id, c.NombreCompleto, c.Telefono, c.Direccion);
}
