using System.ComponentModel.DataAnnotations;

namespace CasaRuiz.Api.Dtos;

public record ArticuloRequest(
    [Required, MaxLength(200)] string Descripcion,
    [Required, MaxLength(100)] string Categoria,
    [Range(0, 999999)] decimal PrecioRenta,
    [Range(0, int.MaxValue)] int ExistenciaTotal);

public record ArticuloResponse(int Id, string Descripcion, string Categoria, decimal PrecioRenta, int ExistenciaTotal);
