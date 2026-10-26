using System.Security.Claims;
using CasaRuiz.Api.Dtos;
using CasaRuiz.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CasaRuiz.Api.Controllers;

/// <summary>Gestión de usuarios. Solo el administrador.</summary>
[ApiController]
[Authorize(Roles = "Administrador")]
[Route("api/[controller]")]
public class UsuariosController(UsuarioService usuarios) : ControllerBase
{
    private int UsuarioActualId => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    [HttpGet]
    public async Task<ActionResult<IEnumerable<UsuarioResponse>>> Get() =>
        Ok(await usuarios.ListarAsync());

    [HttpGet("{id:int}")]
    public async Task<ActionResult<UsuarioResponse>> GetById(int id)
    {
        var usuario = await usuarios.ObtenerAsync(id);

        return usuario is null ? NotFound() : Ok(usuario);
    }

    [HttpPost]
    public async Task<ActionResult<UsuarioResponse>> Create(UsuarioCrearRequest request)
    {
        try
        {
            var usuario = await usuarios.CrearAsync(request);

            return CreatedAtAction(nameof(GetById), new { id = usuario.Id }, usuario);
        }
        catch (ReglaNegocioException ex)
        {
            return StatusCode(ex.Codigo, new { error = ex.Message });
        }
    }

    [HttpPut("{id:int}")]
    public async Task<ActionResult<UsuarioResponse>> Update(int id, UsuarioActualizarRequest request)
    {
        try
        {
            var usuario = await usuarios.ActualizarAsync(id, request);

            return usuario is null ? NotFound() : Ok(usuario);
        }
        catch (ReglaNegocioException ex)
        {
            return StatusCode(ex.Codigo, new { error = ex.Message });
        }
    }

    [HttpPost("{id:int}/restablecer-password")]
    public async Task<ActionResult<UsuarioResponse>> RestablecerPassword(int id, RestablecerPasswordRequest request)
    {
        var usuario = await usuarios.RestablecerPasswordAsync(id, request.NuevaPassword);

        return usuario is null ? NotFound() : Ok(usuario);
    }

    [HttpPost("{id:int}/desactivar")]
    public async Task<ActionResult<UsuarioResponse>> Desactivar(int id)
    {
        try
        {
            var usuario = await usuarios.CambiarActivoAsync(id, false, UsuarioActualId);

            return usuario is null ? NotFound() : Ok(usuario);
        }
        catch (ReglaNegocioException ex)
        {
            return StatusCode(ex.Codigo, new { error = ex.Message });
        }
    }

    [HttpPost("{id:int}/activar")]
    public async Task<ActionResult<UsuarioResponse>> Activar(int id)
    {
        var usuario = await usuarios.CambiarActivoAsync(id, true, UsuarioActualId);

        return usuario is null ? NotFound() : Ok(usuario);
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        try
        {
            var eliminado = await usuarios.EliminarAsync(id, UsuarioActualId);

            return eliminado ? NoContent() : NotFound();
        }
        catch (ReglaNegocioException ex)
        {
            return StatusCode(ex.Codigo, new { error = ex.Message });
        }
    }
}
