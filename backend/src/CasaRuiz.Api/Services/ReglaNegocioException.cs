using Microsoft.AspNetCore.Http;

namespace CasaRuiz.Api.Services;

/// <summary>Error de una regla de negocio que se devuelve al cliente con el código HTTP indicado.</summary>
public class ReglaNegocioException(string mensaje, int codigo = StatusCodes.Status400BadRequest) : Exception(mensaje)
{
    public int Codigo { get; } = codigo;
}
