namespace CasaRuiz.Api.Models;

public class Pedido
{
    public int Id { get; set; }

    public int ClienteId { get; set; }

    public Cliente Cliente { get; set; } = null!;

    /// <summary>Fecha de creación del pedido, asignada por el servidor.</summary>
    public DateTimeOffset FechaCreacion { get; set; }

    public DateTime FechaHoraEntrega { get; set; }

    public DateOnly FechaDevolucion { get; set; }

    /// <summary>Dirección copiada al pedido: la del cliente o la indicada para este pedido.</summary>
    public string DireccionEntrega { get; set; } = string.Empty;

    public bool DireccionEsDelCliente { get; set; }

    /// <summary>Si es true, el IVA se suma al total.</summary>
    public bool RequiereFactura { get; set; }

    public decimal Anticipo { get; set; }

    public bool Pagado { get; set; }

    public EstadoPedido Estado { get; set; } = EstadoPedido.Activo;

    /// <summary>Momento en que se entregó el pedido. Null mientras no se entregue.</summary>
    public DateTimeOffset? EntregadoEn { get; set; }

    /// <summary>Momento en que se recogieron las piezas del cliente. Null mientras falte recogerlas.</summary>
    public DateTimeOffset? RecogidoEn { get; set; }

    /// <summary>Momento en que el encargado cerró el pedido tras confirmar que no hubo faltantes.</summary>
    public DateTimeOffset? CerradoEn { get; set; }

    public List<PedidoLinea> Lineas { get; set; } = [];
}

public enum EstadoPedido
{
    Activo,
    Cancelado,
    Cerrado
}
