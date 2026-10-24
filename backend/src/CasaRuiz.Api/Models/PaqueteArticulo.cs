namespace CasaRuiz.Api.Models;

/// <summary>Artículo dentro de un paquete y cuántas unidades incluye.</summary>
public class PaqueteArticulo
{
    public int PaqueteId { get; set; }

    public Paquete Paquete { get; set; } = null!;

    public int ArticuloId { get; set; }

    public Articulo Articulo { get; set; } = null!;

    public int Cantidad { get; set; }
}
