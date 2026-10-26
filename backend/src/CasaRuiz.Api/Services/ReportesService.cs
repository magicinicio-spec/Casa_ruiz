using CasaRuiz.Api.Data;
using CasaRuiz.Api.Dtos;
using CasaRuiz.Api.Models;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;

namespace CasaRuiz.Api.Services;

public class ReportesService(AppDbContext db)
{
    /// <summary>Pedidos pagados que no están cancelados. El rango de fechas es opcional y se aplica a la fecha de entrega.</summary>
    public async Task<ReportePedidosPagadosResponse> PedidosPagadosAsync(DateOnly? desde, DateOnly? hasta, CancellationToken ct = default)
    {
        if (desde is not null && hasta is not null && hasta < desde)
        {
            throw new ReglaNegocioException("La fecha final no puede ser anterior a la inicial.");
        }

        var query = Consulta().Where(p => p.Pagado && p.Estado != EstadoPedido.Cancelado);

        if (desde is not null)
        {
            var inicio = desde.Value.ToDateTime(TimeOnly.MinValue);
            query = query.Where(p => p.FechaHoraEntrega >= inicio);
        }

        if (hasta is not null)
        {
            var fin = hasta.Value.AddDays(1).ToDateTime(TimeOnly.MinValue);
            query = query.Where(p => p.FechaHoraEntrega < fin);
        }

        var pedidos = (await query.OrderBy(p => p.FechaHoraEntrega).ThenBy(p => p.Id).ToListAsync(ct))
            .Select(ToReporte)
            .ToList();

        return new ReportePedidosPagadosResponse(pedidos.Count, pedidos.Sum(p => p.Total), pedidos);
    }

    /// <summary>Pedidos activos ya entregados cuyas piezas todavía no se han recogido.</summary>
    public async Task<List<ReportePedidoResponse>> PendientesRecogerAsync(CancellationToken ct = default)
    {
        var pedidos = await Consulta()
            .Where(p => p.Estado == EstadoPedido.Activo && p.EntregadoEn != null && p.RecogidoEn == null)
            .OrderBy(p => p.EntregadoEn)
            .ThenBy(p => p.Id)
            .ToListAsync(ct);

        return pedidos.Select(ToReporte).ToList();
    }

    /// <summary>
    /// Existencia por artículo: en renta son las unidades de pedidos activos que aún no se han revisado,
    /// y disponible es la existencia menos lo que está en renta.
    /// </summary>
    public async Task<List<ReporteInventarioArticulo>> InventarioAsync(CancellationToken ct = default)
    {
        var articulos = await db.Articulos.AsNoTracking()
            .OrderBy(a => a.Categoria)
            .ThenBy(a => a.Descripcion)
            .ToListAsync(ct);

        var enRenta = (await db.PedidoArticulos.AsNoTracking()
                .Where(a => a.CantidadDevuelta == null && a.PedidoLinea.Pedido.Estado == EstadoPedido.Activo)
                .Select(a => new { a.ArticuloId, a.Cantidad })
                .ToListAsync(ct))
            .GroupBy(a => a.ArticuloId)
            .ToDictionary(g => g.Key, g => g.Sum(a => a.Cantidad));

        var dadosDeBaja = (await db.ResolucionesDano.AsNoTracking()
                .Where(r => r.Tipo == TipoResolucionDano.DadoDeBaja)
                .Select(r => new { r.PedidoArticulo.ArticuloId, r.Cantidad })
                .ToListAsync(ct))
            .GroupBy(r => r.ArticuloId)
            .ToDictionary(g => g.Key, g => g.Sum(r => r.Cantidad));

        return articulos
            .Select(a =>
            {
                var rentados = enRenta.GetValueOrDefault(a.Id);
                return new ReporteInventarioArticulo(
                    a.Id,
                    a.Descripcion,
                    a.Categoria,
                    a.ExistenciaTotal,
                    rentados,
                    a.ExistenciaTotal - rentados,
                    dadosDeBaja.GetValueOrDefault(a.Id));
            })
            .ToList();
    }

    private IQueryable<Pedido> Consulta() =>
        db.Pedidos
            .AsNoTracking()
            .Include(p => p.Cliente)
            .Include(p => p.Lineas)
                .ThenInclude(l => l.Articulos)
                .ThenInclude(a => a.Resoluciones);

    private static ReportePedidoResponse ToReporte(Pedido p)
    {
        var total = PedidoService.CalcularTotales(p).Total;

        return new ReportePedidoResponse(
            p.Id,
            p.Cliente.NombreCompleto,
            p.Cliente.Telefono,
            p.FechaHoraEntrega,
            p.FechaDevolucion,
            p.DireccionEntrega,
            p.Estado.ToString(),
            total,
            p.Anticipo,
            total - p.Anticipo,
            p.Pagado,
            p.EntregadoEn,
            p.RecogidoEn);
    }
}
