using System.ComponentModel.DataAnnotations;

namespace CasaRuiz.Api.Dtos;

public record ClienteRequest(
    [Required, MaxLength(200)] string NombreCompleto,
    [Required, MaxLength(30)] string Telefono,
    [Required, MaxLength(400)] string Direccion);

public record ClienteResponse(int Id, string NombreCompleto, string Telefono, string Direccion);
