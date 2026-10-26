using System.ComponentModel.DataAnnotations;
using CasaRuiz.Api.Models;

namespace CasaRuiz.Api.Dtos;

public record UsuarioResponse(
    int Id,
    string NombreCompleto,
    string Telefono,
    string NombreUsuario,
    RolUsuario Rol,
    bool Activo);

public record UsuarioCrearRequest(
    [Required, MaxLength(200)] string NombreCompleto,
    [Required, MaxLength(30)] string Telefono,
    [Required, MaxLength(50)] string NombreUsuario,
    [Required, MinLength(8), MaxLength(100)] string Password,
    RolUsuario Rol);

public record UsuarioActualizarRequest(
    [Required, MaxLength(200)] string NombreCompleto,
    [Required, MaxLength(30)] string Telefono,
    [Required, MaxLength(50)] string NombreUsuario,
    RolUsuario Rol);

public record RestablecerPasswordRequest([Required, MinLength(8), MaxLength(100)] string NuevaPassword);
