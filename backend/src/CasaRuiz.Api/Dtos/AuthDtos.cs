using System.ComponentModel.DataAnnotations;

namespace CasaRuiz.Api.Dtos;

public record LoginRequest([Required, MaxLength(50)] string NombreUsuario, [Required, MaxLength(100)] string Password);

public record LoginResponse(string Token, DateTimeOffset ExpiraEn, UsuarioResponse Usuario);
