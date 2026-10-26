namespace CasaRuiz.Api.Exportacion;

/// <summary>
/// Tabla común para exportar un reporte. Los valores son string, int, decimal o null:
/// los decimales son montos en pesos y los enteros son cantidades.
/// </summary>
public record TablaReporte(string Titulo, string Nombre, string[] Columnas, List<object?[]> Filas, string? Resumen);
