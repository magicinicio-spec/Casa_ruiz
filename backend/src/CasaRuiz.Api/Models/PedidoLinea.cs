namespace CasaRuiz.Api.Models;

/// <summary>Línea de un pedido: un artículo o un paquete. El precio se guarda al momento de crear el pedido.</summary>
public class PedidoLinea
{
    public int Id { get; set; }

    public int PedidoId { get; set; }

    public Pedido Pedido { get; set; } = null!;

    public int? ArticuloId { get; set; }

    public Articulo? Articulo { get; set; }

    public int? PaqueteId { get; set; }

    public Paquete? Paquete { get; set; }

    public string Descripcion { get; set; } = string.Empty;

    public int Cantidad { get; set; }

    public decimal PrecioUnitario { get; set; }
}
