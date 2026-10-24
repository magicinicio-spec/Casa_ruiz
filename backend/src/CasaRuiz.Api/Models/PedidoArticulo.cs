namespace CasaRuiz.Api.Models;

/// <summary>
/// Artículo concreto de una línea del pedido, con la cantidad fijada al crear el pedido.
/// Un paquete se expande en sus artículos, para que la revisión y el inventario sean por artículo.
/// </summary>
public class PedidoArticulo
{
    public int Id { get; set; }

    public int PedidoLineaId { get; set; }

    public PedidoLinea PedidoLinea { get; set; } = null!;

    public int ArticuloId { get; set; }

    public string Descripcion { get; set; } = string.Empty;

    public int Cantidad { get; set; }

    /// <summary>Unidades que regresaron en buen estado. Null mientras no se haya revisado el artículo.</summary>
    public int? CantidadDevuelta { get; set; }

    /// <summary>Unidades que regresaron dañadas.</summary>
    public int CantidadDaniada { get; set; }
}
