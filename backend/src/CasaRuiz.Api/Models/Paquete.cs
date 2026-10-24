namespace CasaRuiz.Api.Models;

/// <summary>Combinación de artículos (por ejemplo, sillas y mesas) con precio propio.</summary>
public class Paquete
{
    public int Id { get; set; }

    public string Nombre { get; set; } = string.Empty;

    public decimal PrecioRenta { get; set; }

    public List<PaqueteArticulo> Componentes { get; set; } = [];
}
