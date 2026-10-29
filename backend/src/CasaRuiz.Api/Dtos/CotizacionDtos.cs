using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace CasaRuiz.Api.Dtos;

public record CotizacionRequest(
    [Range(1, int.MaxValue)] int ClienteId,
    [property: JsonConverter(typeof(FechaHoraJsonConverter))] DateTime FechaHoraEntrega,
    [property: JsonConverter(typeof(FechaJsonConverter))] DateOnly FechaDevolucion,
    bool DireccionEsDelCliente,
    [MaxLength(400)] string? DireccionOtra,
    bool RequiereFactura,
    [MinLength(1)] List<LineaRequest> Lineas);

public record CotizacionResponse(
    int Id,
    DateTimeOffset FechaCreacion,
    int ClienteId,
    string ClienteNombre,
    string ClienteTelefono,
    [property: JsonConverter(typeof(FechaHoraJsonConverter))] DateTime FechaHoraEntrega,
    [property: JsonConverter(typeof(FechaJsonConverter))] DateOnly FechaDevolucion,
    string DireccionEntrega,
    bool DireccionEsDelCliente,
    bool RequiereFactura,
    decimal Subtotal,
    decimal Iva,
    decimal Total,
    int? PedidoId,
    DateTimeOffset? ConvertidaEn,
    List<CotizacionLineaResponse> Lineas);

public record CotizacionLineaResponse(
    int Id,
    int? ArticuloId,
    int? PaqueteId,
    string Descripcion,
    int Cantidad,
    decimal PrecioUnitario,
    decimal Importe,
    List<ComponenteResponse> Articulos);
