using CasaRuiz.Api.Data;
using CasaRuiz.Api.Dtos;
using CasaRuiz.Api.Models;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace CasaRuiz.Api.Services;

public class AuthService(AppDbContext db, IPasswordHasher<Usuario> hasher, TokenService tokens)
{
    public async Task<LoginResponse> IniciarSesionAsync(LoginRequest request, CancellationToken ct = default)
    {
        var nombreUsuario = UsuarioService.NormalizarNombre(request.NombreUsuario);
        var usuario = await db.Usuarios.FirstOrDefaultAsync(u => u.NombreUsuario == nombreUsuario, ct);

        // El mismo mensaje para usuario inexistente, contraseña incorrecta o cuenta inactiva.
        const string mensaje = "Usuario o contraseña incorrectos.";

        if (usuario is null || !usuario.Activo)
        {
            throw new ReglaNegocioException(mensaje, StatusCodes.Status401Unauthorized);
        }

        var resultado = hasher.VerifyHashedPassword(usuario, usuario.PasswordHash, request.Password);
        if (resultado == PasswordVerificationResult.Failed)
        {
            throw new ReglaNegocioException(mensaje, StatusCodes.Status401Unauthorized);
        }

        var (token, expiraEn) = tokens.Crear(usuario);

        return new LoginResponse(token, expiraEn, new UsuarioResponse(
            usuario.Id, usuario.NombreCompleto, usuario.Telefono, usuario.NombreUsuario, usuario.Rol, usuario.Activo));
    }
}
