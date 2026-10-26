using CasaRuiz.Api.Data;
using CasaRuiz.Api.Dtos;
using CasaRuiz.Api.Models;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace CasaRuiz.Api.Services;

/// <summary>Gestión de usuarios. Solo la usa el administrador.</summary>
public class UsuarioService(AppDbContext db, IPasswordHasher<Usuario> hasher)
{
    public async Task<List<UsuarioResponse>> ListarAsync(CancellationToken ct = default) =>
        (await db.Usuarios.AsNoTracking().OrderBy(u => u.NombreCompleto).ToListAsync(ct))
            .Select(ToResponse)
            .ToList();

    public async Task<UsuarioResponse?> ObtenerAsync(int id, CancellationToken ct = default)
    {
        var usuario = await db.Usuarios.AsNoTracking().FirstOrDefaultAsync(u => u.Id == id, ct);

        return usuario is null ? null : ToResponse(usuario);
    }

    public async Task<UsuarioResponse> CrearAsync(UsuarioCrearRequest request, CancellationToken ct = default)
    {
        var nombreUsuario = NormalizarNombre(request.NombreUsuario);
        await ValidarNombreDisponibleAsync(nombreUsuario, null, ct);

        var usuario = new Usuario
        {
            NombreCompleto = request.NombreCompleto.Trim(),
            Telefono = request.Telefono.Trim(),
            NombreUsuario = nombreUsuario,
            Rol = request.Rol,
            Activo = true,
        };
        usuario.PasswordHash = hasher.HashPassword(usuario, request.Password);

        db.Usuarios.Add(usuario);
        await db.SaveChangesAsync(ct);

        return ToResponse(usuario);
    }

    public async Task<UsuarioResponse?> ActualizarAsync(int id, UsuarioActualizarRequest request, CancellationToken ct = default)
    {
        var usuario = await db.Usuarios.FirstOrDefaultAsync(u => u.Id == id, ct);
        if (usuario is null)
        {
            return null;
        }

        var nombreUsuario = NormalizarNombre(request.NombreUsuario);
        await ValidarNombreDisponibleAsync(nombreUsuario, id, ct);

        var quitaAdministrador = usuario.Rol == RolUsuario.Administrador && request.Rol != RolUsuario.Administrador;
        if (quitaAdministrador)
        {
            await ValidarQueQuedeOtroAdministradorAsync(usuario, ct);
        }

        usuario.NombreCompleto = request.NombreCompleto.Trim();
        usuario.Telefono = request.Telefono.Trim();
        usuario.NombreUsuario = nombreUsuario;
        usuario.Rol = request.Rol;
        await db.SaveChangesAsync(ct);

        return ToResponse(usuario);
    }

    public async Task<UsuarioResponse?> RestablecerPasswordAsync(int id, string nuevaPassword, CancellationToken ct = default)
    {
        var usuario = await db.Usuarios.FirstOrDefaultAsync(u => u.Id == id, ct);
        if (usuario is null)
        {
            return null;
        }

        usuario.PasswordHash = hasher.HashPassword(usuario, nuevaPassword);
        await db.SaveChangesAsync(ct);

        return ToResponse(usuario);
    }

    public async Task<UsuarioResponse?> CambiarActivoAsync(int id, bool activo, int usuarioActualId, CancellationToken ct = default)
    {
        var usuario = await db.Usuarios.FirstOrDefaultAsync(u => u.Id == id, ct);
        if (usuario is null)
        {
            return null;
        }

        if (!activo)
        {
            ValidarPuedeDesactivarse(usuario, usuarioActualId);
            if (usuario.Activo && usuario.Rol == RolUsuario.Administrador)
            {
                await ValidarQueQuedeOtroAdministradorAsync(usuario, ct);
            }
        }

        usuario.Activo = activo;
        await db.SaveChangesAsync(ct);

        return ToResponse(usuario);
    }

    /// <summary>Elimina el usuario de forma definitiva.</summary>
    public async Task<bool> EliminarAsync(int id, int usuarioActualId, CancellationToken ct = default)
    {
        var usuario = await db.Usuarios.FirstOrDefaultAsync(u => u.Id == id, ct);
        if (usuario is null)
        {
            return false;
        }

        ValidarPuedeDesactivarse(usuario, usuarioActualId);
        if (usuario.Activo && usuario.Rol == RolUsuario.Administrador)
        {
            await ValidarQueQuedeOtroAdministradorAsync(usuario, ct);
        }

        db.Usuarios.Remove(usuario);
        await db.SaveChangesAsync(ct);

        return true;
    }

    private static void ValidarPuedeDesactivarse(Usuario usuario, int usuarioActualId)
    {
        if (usuario.Id == usuarioActualId)
        {
            throw new ReglaNegocioException("No puedes desactivarte ni eliminar tu propio usuario.", StatusCodes.Status409Conflict);
        }
    }

    /// <summary>Impide dejar el sistema sin ningún administrador activo.</summary>
    private async Task ValidarQueQuedeOtroAdministradorAsync(Usuario usuario, CancellationToken ct)
    {
        var otrosAdministradores = await db.Usuarios.CountAsync(
            u => u.Rol == RolUsuario.Administrador && u.Activo && u.Id != usuario.Id, ct);

        if (otrosAdministradores == 0)
        {
            throw new ReglaNegocioException(
                "Debe quedar al menos un administrador activo.", StatusCodes.Status409Conflict);
        }
    }

    private async Task ValidarNombreDisponibleAsync(string nombreUsuario, int? idActual, CancellationToken ct)
    {
        var ocupado = await db.Usuarios.AnyAsync(u => u.NombreUsuario == nombreUsuario && u.Id != idActual, ct);
        if (ocupado)
        {
            throw new ReglaNegocioException("Ese nombre de usuario ya existe.", StatusCodes.Status409Conflict);
        }
    }

    public static string NormalizarNombre(string nombreUsuario) => nombreUsuario.Trim().ToLowerInvariant();

    private static UsuarioResponse ToResponse(Usuario u) =>
        new(u.Id, u.NombreCompleto, u.Telefono, u.NombreUsuario, u.Rol, u.Activo);
}
