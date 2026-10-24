namespace CasaRuiz.Api.Models;

/// <summary>Artículo del inventario. Se maneja por unidad; la existencia es una cantidad general.</summary>
public class Articulo
{
    public int Id { get; set; }

    public string Descripcion { get; set; } = string.Empty;

    public string Categoria { get; set; } = string.Empty;

    public decimal PrecioRenta { get; set; }

    public int ExistenciaTotal { get; set; }
}
