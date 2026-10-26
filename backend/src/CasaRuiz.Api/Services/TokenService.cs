using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using CasaRuiz.Api.Configuracion;
using CasaRuiz.Api.Models;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;

namespace CasaRuiz.Api.Services;

public class TokenService(IOptions<JwtOpciones> opciones)
{
    private readonly JwtOpciones _opciones = opciones.Value;

    public (string Token, DateTimeOffset ExpiraEn) Crear(Usuario usuario)
    {
        var expiraEn = DateTimeOffset.UtcNow.AddHours(_opciones.HorasSesion);

        var claims = new[]
        {
            new Claim(JwtRegisteredClaimNames.Sub, usuario.Id.ToString()),
            new Claim(ClaimTypes.NameIdentifier, usuario.Id.ToString()),
            new Claim(ClaimTypes.Name, usuario.NombreCompleto),
            new Claim(ClaimTypes.Role, usuario.Rol.ToString()),
        };

        var credenciales = new SigningCredentials(
            new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_opciones.Key)),
            SecurityAlgorithms.HmacSha256);

        var token = new JwtSecurityToken(
            issuer: _opciones.Issuer,
            audience: _opciones.Audience,
            claims: claims,
            expires: expiraEn.UtcDateTime,
            signingCredentials: credenciales);

        return (new JwtSecurityTokenHandler().WriteToken(token), expiraEn);
    }
}
