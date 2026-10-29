namespace CasaRuiz.Api.Models;

/// <summary>
/// Cotización para el cliente. No aparta inventario ni tiene anticipo ni pagos.
/// </summary>
public class Cotizacion
{
    public int Id { get; set; }

    public int ClienteId { get; set; }

    public Cliente Cliente { get; set; } = null!;

    public DateTimeOffset FechaCreacion { get; set; }

    public DateTime FechaHoraEntrega { get; set; }

    public DateOnly FechaDevolucion { get; set; }

    public string DireccionEntrega { get; set; } = string.Empty;

    public bool DireccionEsDelCliente { get; set; }

    public bool RequiereFactura { get; set; }

    public List<CotizacionLinea> Lineas { get; set; } = [];
}

public class CotizacionLinea
{
    public int Id { get; set; }

    public int CotizacionId { get; set; }

    public Cotizacion Cotizacion { get; set; } = null!;

    public int? ArticuloId { get; set; }

    public int? PaqueteId { get; set; }

    public string Descripcion { get; set; } = string.Empty;

    public int Cantidad { get; set; }

    public decimal PrecioUnitario { get; set; }

    /// <summary>Artículos que incluye la línea, con la cantidad total (un paquete se desglosa).</summary>
    public List<CotizacionArticulo> Articulos { get; set; } = [];
}

public class CotizacionArticulo
{
    public int Id { get; set; }

    public int CotizacionLineaId { get; set; }

    public CotizacionLinea CotizacionLinea { get; set; } = null!;

    public int ArticuloId { get; set; }

    public string Descripcion { get; set; } = string.Empty;

    public int Cantidad { get; set; }
}
