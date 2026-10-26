using System.Text.Json.Serialization;

namespace CasaRuiz.Api.Dtos;

public record DashboardResponse(
    [property: JsonConverter(typeof(FechaJsonConverter))] DateOnly Fecha,
    [property: JsonConverter(typeof(FechaJsonConverter))] DateOnly InicioSemana,
    [property: JsonConverter(typeof(FechaJsonConverter))] DateOnly FinSemana,
    ResumenDia Dia,
    ResumenSemana Semana,
    SituacionActual Situacion,
    List<ArticuloMasRentado> ArticulosMasRentados);

/// <summary>Pedidos con entrega hoy. No incluye cancelados.</summary>
public record ResumenDia(int PedidosParaHoy, int PendientesDeEntregarHoy);

/// <summary>Pedidos con entrega de lunes a domingo de esta semana. No incluye cancelados en el total.</summary>
public record ResumenSemana(
    int Total,
    int PendientesDeEntregar,
    int PorRecoger,
    int PorRevisar,
    int Cerrados,
    int Cancelados,
    decimal Ingresos);

/// <summary>Estado actual de los pedidos, sin importar la fecha de entrega.</summary>
public record SituacionActual(
    int ColaEntrega,
    int PorRecoger,
    int ProximosSieteDias,
    int ConDanosSinResolver,
    decimal SaldoPorCobrar);

public record ArticuloMasRentado(int ArticuloId, string Descripcion, int Unidades);
