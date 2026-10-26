using CasaRuiz.Api.Data;
using CasaRuiz.Api.Dtos;
using CasaRuiz.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace CasaRuiz.Api.Services;

/// <summary>
/// Indicadores de pedidos. "Hoy" y la semana usan la zona horaria del servidor (variable TZ),
/// y la semana va de lunes a domingo.
/// </summary>
public class DashboardService(AppDbContext db)
{
    private const int TopArticulos = 5;

    public async Task<DashboardResponse> ObtenerAsync(CancellationToken ct = default)
    {
        var hoy = DateOnly.FromDateTime(DateTime.Now);
        var inicioSemana = hoy.AddDays(-(((int)hoy.DayOfWeek + 6) % 7));
        var finSemana = inicioSemana.AddDays(6);

        var inicioSemanaDt = inicioSemana.ToDateTime(TimeOnly.MinValue);
        var finSemanaSiguienteDt = inicioSemana.AddDays(7).ToDateTime(TimeOnly.MinValue);

        // Se cargan los pedidos de la semana y todos los activos: los indicadores de "pendiente" no dependen de la fecha.
        var pedidos = await db.Pedidos
            .AsNoTracking()
            .Include(p => p.Lineas)
                .ThenInclude(l => l.Articulos)
                .ThenInclude(a => a.Resoluciones)
            .Where(p => p.Estado == EstadoPedido.Activo
                || (p.FechaHoraEntrega >= inicioSemanaDt && p.FechaHoraEntrega < finSemanaSiguienteDt))
            .ToListAsync(ct);

        var enSemana = pedidos
            .Where(p => DateOnly.FromDateTime(p.FechaHoraEntrega) >= inicioSemana
                && DateOnly.FromDateTime(p.FechaHoraEntrega) <= finSemana)
            .ToList();

        var noCancelados = enSemana.Where(p => p.Estado != EstadoPedido.Cancelado).ToList();
        var activos = pedidos.Where(p => p.Estado == EstadoPedido.Activo).ToList();

        var deHoy = pedidos.Where(p => p.Estado != EstadoPedido.Cancelado && DateOnly.FromDateTime(p.FechaHoraEntrega) == hoy).ToList();

        var dia = new ResumenDia(
            PedidosParaHoy: deHoy.Count,
            PendientesDeEntregarHoy: deHoy.Count(p => p.Estado == EstadoPedido.Activo && p.EntregadoEn is null));

        var semana = new ResumenSemana(
            Total: noCancelados.Count,
            PendientesDeEntregar: noCancelados.Count(p => p.Estado == EstadoPedido.Activo && p.EntregadoEn is null),
            PorRecoger: noCancelados.Count(p => p.Estado == EstadoPedido.Activo && p.EntregadoEn is not null && p.RecogidoEn is null),
            PorRevisar: noCancelados.Count(p => p.Estado == EstadoPedido.Activo && p.RecogidoEn is not null),
            Cerrados: noCancelados.Count(p => p.Estado == EstadoPedido.Cerrado),
            Cancelados: enSemana.Count(p => p.Estado == EstadoPedido.Cancelado),
            Ingresos: noCancelados.Sum(p => PedidoService.CalcularTotales(p).Total));

        var situacion = new SituacionActual(
            ColaEntrega: activos.Count(p => p.EntregadoEn is null),
            PorRecoger: activos.Count(p => p.EntregadoEn is not null && p.RecogidoEn is null),
            ProximosSieteDias: activos.Count(p =>
                DateOnly.FromDateTime(p.FechaHoraEntrega) >= hoy && DateOnly.FromDateTime(p.FechaHoraEntrega) < hoy.AddDays(7)),
            ConDanosSinResolver: activos.Count(p => p.Lineas
                .SelectMany(l => l.Articulos)
                .Any(a => a.CantidadDaniada > a.Resoluciones.Sum(r => r.Cantidad))),
            SaldoPorCobrar: activos.Sum(p => p.Pagado ? 0m : Math.Max(PedidoService.CalcularTotales(p).Total - p.Anticipo, 0m)));

        var masRentados = noCancelados
            .SelectMany(p => p.Lineas)
            .SelectMany(l => l.Articulos)
            .GroupBy(a => a.ArticuloId)
            .Select(g => new ArticuloMasRentado(g.Key, g.First().Descripcion, g.Sum(a => a.Cantidad)))
            .OrderByDescending(a => a.Unidades)
            .ThenBy(a => a.Descripcion)
            .Take(TopArticulos)
            .ToList();

        return new DashboardResponse(hoy, inicioSemana, finSemana, dia, semana, situacion, masRentados);
    }
}
