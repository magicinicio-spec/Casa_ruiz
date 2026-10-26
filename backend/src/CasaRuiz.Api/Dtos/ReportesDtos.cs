using System.Text.Json.Serialization;

namespace CasaRuiz.Api.Dtos;

public record ReportePedidosPagadosResponse(
    int Cantidad,
    decimal TotalPagado,
    List<ReportePedidoResponse> Pedidos);

public record ReportePedidoResponse(
    int Id,
    string ClienteNombre,
    string ClienteTelefono,
    [property: JsonConverter(typeof(FechaHoraJsonConverter))] DateTime FechaHoraEntrega,
    [property: JsonConverter(typeof(FechaJsonConverter))] DateOnly FechaDevolucion,
    string DireccionEntrega,
    string Estado,
    decimal Total,
    decimal Anticipo,
    decimal Saldo,
    bool Pagado,
    DateTimeOffset? EntregadoEn,
    DateTimeOffset? RecogidoEn);

public record ReporteInventarioArticulo(
    int ArticuloId,
    string Descripcion,
    string Categoria,
    int ExistenciaTotal,
    int EnRenta,
    int Disponible,
    int DadosDeBaja);
