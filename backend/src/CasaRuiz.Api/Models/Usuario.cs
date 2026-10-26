namespace CasaRuiz.Api.Models;

public class Usuario
{
    public int Id { get; set; }

    public string NombreCompleto { get; set; } = string.Empty;

    public string Telefono { get; set; } = string.Empty;

    /// <summary>Nombre para iniciar sesión. Se guarda en minúsculas y es único.</summary>
    public string NombreUsuario { get; set; } = string.Empty;

    public string PasswordHash { get; set; } = string.Empty;

    public RolUsuario Rol { get; set; }

    /// <summary>Un usuario inactivo no puede iniciar sesión ni usar tokens vigentes.</summary>
    public bool Activo { get; set; } = true;
}

public enum RolUsuario
{
    Administrador,
    Vendedor,
    Repartidor,
    VendedorRepartidor
}
