namespace CasaRuiz.Api.Models;

/// <summary>Cómo se resolvió una o más piezas dañadas de un artículo del pedido.</summary>
public class ResolucionDano
{
    public int Id { get; set; }

    public int PedidoArticuloId { get; set; }

    public PedidoArticulo PedidoArticulo { get; set; } = null!;

    public TipoResolucionDano Tipo { get; set; }

    public int Cantidad { get; set; }

    /// <summary>Obligatorio al dar de baja. Opcional en los demás casos.</summary>
    public string? Motivo { get; set; }

    /// <summary>Monto cobrado al cliente. Solo aplica al tipo Cobrado.</summary>
    public decimal? Monto { get; set; }

    public DateTimeOffset RegistradoEn { get; set; }
}

public enum TipoResolucionDano
{
    /// <summary>La pieza se reparó y regresa a la existencia general.</summary>
    Reparado,

    /// <summary>La pieza no se puede reparar y sale del inventario.</summary>
    DadoDeBaja,

    /// <summary>El cliente pagó por la pieza. El monto se suma al total del pedido.</summary>
    Cobrado
}
