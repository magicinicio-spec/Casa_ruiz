using CasaRuiz.Api.Data;
using CasaRuiz.Api.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace CasaRuiz.Api.Services;

/// <summary>
/// Crea el primer administrador cuando la tabla de usuarios está vacía.
/// Usa las variables Admin__NombreUsuario, Admin__Password y Admin__NombreCompleto. No hace nada después.
/// </summary>
public static class AdministradorInicial
{
    public static async Task AsegurarAsync(AppDbContext db, IPasswordHasher<Usuario> hasher, IConfiguration configuracion)
    {
        if (await db.Usuarios.AnyAsync())
        {
            return;
        }

        var nombreUsuario = configuracion["Admin:NombreUsuario"];
        var password = configuracion["Admin:Password"];
        if (string.IsNullOrWhiteSpace(nombreUsuario) || string.IsNullOrWhiteSpace(password))
        {
            return;
        }

        var administrador = new Usuario
        {
            NombreCompleto = configuracion["Admin:NombreCompleto"] ?? "Administrador",
            Telefono = configuracion["Admin:Telefono"] ?? string.Empty,
            NombreUsuario = UsuarioService.NormalizarNombre(nombreUsuario),
            Rol = RolUsuario.Administrador,
            Activo = true,
        };
        administrador.PasswordHash = hasher.HashPassword(administrador, password);

        db.Usuarios.Add(administrador);
        await db.SaveChangesAsync();
    }
}
