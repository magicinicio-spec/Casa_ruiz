namespace CasaRuiz.Api.Models;

/// <summary>Cliente registrado para no capturar sus datos en cada pedido.</summary>
public class Cliente
{
    public int Id { get; set; }

    public string NombreCompleto { get; set; } = string.Empty;

    public string Telefono { get; set; } = string.Empty;

    public string Direccion { get; set; } = string.Empty;
}
