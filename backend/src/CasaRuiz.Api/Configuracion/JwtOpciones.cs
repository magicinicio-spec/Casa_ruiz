using System.ComponentModel.DataAnnotations;

namespace CasaRuiz.Api.Configuracion;

/// <summary>Configuración de los tokens de sesión. La clave se define con la variable Jwt__Key.</summary>
public class JwtOpciones
{
    public const string Seccion = "Jwt";

    public string Issuer { get; set; } = "CasaRuiz";

    public string Audience { get; set; } = "CasaRuiz";

    [Required, MinLength(32)]
    public string Key { get; set; } = string.Empty;

    public int HorasSesion { get; set; } = 8;
}
