using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace CasaRuiz.Api.Dtos;

public record PedidoRequest(
    [Range(1, int.MaxValue)] int ClienteId,
    [property: JsonConverter(typeof(FechaHoraJsonConverter))] DateTime FechaHoraEntrega,
    [property: JsonConverter(typeof(FechaJsonConverter))] DateOnly FechaDevolucion,
    bool DireccionEsDelCliente,
    [MaxLength(400)] string? DireccionOtra,
    bool RequiereFactura,
    [Range(0, 999999999)] decimal Anticipo,
    bool Pagado,
    [MinLength(1)] List<LineaRequest> Lineas);

/// <summary>Una línea del pedido: debe traer un artículo o un paquete, pero no ambos.</summary>
public record LineaRequest(int? ArticuloId, int? PaqueteId, [Range(1, int.MaxValue)] int Cantidad);

public record LineaResponse(
    int? ArticuloId,
    int? PaqueteId,
    string Descripcion,
    int Cantidad,
    decimal PrecioUnitario,
    decimal Importe);

public record PedidoResponse(
    int Id,
    DateTimeOffset FechaCreacion,
    int ClienteId,
    string ClienteNombre,
    [property: JsonConverter(typeof(FechaHoraJsonConverter))] DateTime FechaHoraEntrega,
    [property: JsonConverter(typeof(FechaJsonConverter))] DateOnly FechaDevolucion,
    string DireccionEntrega,
    bool DireccionEsDelCliente,
    bool RequiereFactura,
    decimal Subtotal,
    decimal Iva,
    decimal Total,
    decimal Anticipo,
    decimal Saldo,
    bool Pagado,
    string Estado,
    DateTimeOffset? EntregadoEn,
    DateTimeOffset? RecogidoEn,
    DateTimeOffset? CerradoEn,
    List<LineaResponse> Lineas);

/// <summary>Artículo cuya existencia general no alcanza para el pedido. Solo es un aviso, no bloquea el pedido.</summary>
public record AdvertenciaInventario(
    int ArticuloId,
    string Descripcion,
    int ExistenciaTotal,
    int ComprometidaEnOtrosPedidos,
    int Solicitadas,
    int Restantes);

public record PedidoGuardadoResponse(PedidoResponse Pedido, IReadOnlyList<AdvertenciaInventario> Advertencias);
