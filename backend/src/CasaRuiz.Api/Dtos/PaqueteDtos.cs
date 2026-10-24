using System.ComponentModel.DataAnnotations;

namespace CasaRuiz.Api.Dtos;

public record PaqueteRequest(
    [Required, MaxLength(200)] string Nombre,
    [Range(0, 999999)] decimal PrecioRenta,
    [MinLength(1)] List<ComponenteRequest> Componentes);

public record ComponenteRequest(int ArticuloId, [Range(1, int.MaxValue)] int Cantidad);

public record PaqueteResponse(int Id, string Nombre, decimal PrecioRenta, List<ComponenteResponse> Componentes);

public record ComponenteResponse(int ArticuloId, string Descripcion, int Cantidad);
