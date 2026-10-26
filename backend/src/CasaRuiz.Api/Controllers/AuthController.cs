using System.Security.Claims;
using CasaRuiz.Api.Dtos;
using CasaRuiz.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CasaRuiz.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController(AuthService auth, UsuarioService usuarios) : ControllerBase
{
    [AllowAnonymous]
    [HttpPost("login")]
    public async Task<ActionResult<LoginResponse>> Login(LoginRequest request)
    {
        try
        {
            return Ok(await auth.IniciarSesionAsync(request));
        }
        catch (ReglaNegocioException ex)
        {
            return StatusCode(ex.Codigo, new { error = ex.Message });
        }
    }

    /// <summary>Datos del usuario de la sesión actual.</summary>
    [HttpGet("yo")]
    public async Task<ActionResult<UsuarioResponse>> Yo()
    {
        var id = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var usuario = await usuarios.ObtenerAsync(id);

        return usuario is null ? Unauthorized() : Ok(usuario);
    }
}
