using System.Linq.Expressions;
using CasaRuiz.Api.Data;
using CasaRuiz.Api.Dtos;
using CasaRuiz.Api.Models;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;

namespace CasaRuiz.Api.Services;

public class PedidoService(AppDbContext db)
{
    public const decimal TasaIva = 0.16m;

    public async Task<PedidoGuardadoResponse> CrearAsync(PedidoRequest request, CancellationToken ct = default)
    {
        var pedido = new Pedido { FechaCreacion = DateTimeOffset.UtcNow };
        var advertencias = await AplicarAsync(pedido, request, ct);

        db.Pedidos.Add(pedido);
        await db.SaveChangesAsync(ct);

        return new PedidoGuardadoResponse((await ObtenerAsync(pedido.Id, ct))!, advertencias);
    }

    public async Task<PedidoGuardadoResponse?> ActualizarAsync(int id, PedidoRequest request, CancellationToken ct = default)
    {
        var pedido = await db.Pedidos
            .Include(p => p.Lineas)
                .ThenInclude(l => l.Articulos)
            .FirstOrDefaultAsync(p => p.Id == id, ct);

        if (pedido is null)
        {
            return null;
        }

        if (pedido.Estado != EstadoPedido.Activo)
        {
            throw new ReglaNegocioException("No se puede editar un pedido cancelado o cerrado.", StatusCodes.Status409Conflict);
        }

        if (TieneRevision(pedido))
        {
            throw new ReglaNegocioException("No se puede editar un pedido que ya tiene revisión registrada.", StatusCodes.Status409Conflict);
        }

        var advertencias = await AplicarAsync(pedido, request, ct);
        await db.SaveChangesAsync(ct);

        return new PedidoGuardadoResponse((await ObtenerAsync(id, ct))!, advertencias);
    }

    public async Task<PedidoResponse?> CancelarAsync(int id, CancellationToken ct = default)
    {
        var pedido = await db.Pedidos
            .Include(p => p.Lineas)
                .ThenInclude(l => l.Articulos)
            .FirstOrDefaultAsync(p => p.Id == id, ct);

        if (pedido is null)
        {
            return null;
        }

        if (pedido.Estado == EstadoPedido.Cancelado)
        {
            throw new ReglaNegocioException("El pedido ya está cancelado.", StatusCodes.Status409Conflict);
        }

        if (pedido.Estado == EstadoPedido.Cerrado)
        {
            throw new ReglaNegocioException("No se puede cancelar un pedido cerrado.", StatusCodes.Status409Conflict);
        }

        if (TieneRevision(pedido))
        {
            throw new ReglaNegocioException("No se puede cancelar un pedido que ya tiene revisión registrada.", StatusCodes.Status409Conflict);
        }

        pedido.Estado = EstadoPedido.Cancelado;
        await db.SaveChangesAsync(ct);

        return await ObtenerAsync(id, ct);
    }

    public async Task<PedidoResponse?> MarcarEntregadoAsync(int id, CancellationToken ct = default)
    {
        var pedido = await db.Pedidos.FirstOrDefaultAsync(p => p.Id == id, ct);
        if (pedido is null)
        {
            return null;
        }

        if (pedido.Estado != EstadoPedido.Activo)
        {
            throw new ReglaNegocioException("Solo se pueden entregar pedidos activos.", StatusCodes.Status409Conflict);
        }

        if (pedido.EntregadoEn is not null)
        {
            throw new ReglaNegocioException("El pedido ya fue entregado.", StatusCodes.Status409Conflict);
        }

        pedido.EntregadoEn = DateTimeOffset.UtcNow;
        await db.SaveChangesAsync(ct);

        return await ObtenerAsync(id, ct);
    }

    public async Task<PedidoResponse?> MarcarRecogidoAsync(int id, CancellationToken ct = default)
    {
        var pedido = await db.Pedidos.FirstOrDefaultAsync(p => p.Id == id, ct);
        if (pedido is null)
        {
            return null;
        }

        if (pedido.Estado != EstadoPedido.Activo)
        {
            throw new ReglaNegocioException("Solo se pueden recoger pedidos activos.", StatusCodes.Status409Conflict);
        }

        if (pedido.EntregadoEn is null)
        {
            throw new ReglaNegocioException("Primero marca el pedido como entregado.", StatusCodes.Status409Conflict);
        }

        if (pedido.RecogidoEn is not null)
        {
            throw new ReglaNegocioException("Las piezas de este pedido ya fueron recogidas.", StatusCodes.Status409Conflict);
        }

        pedido.RecogidoEn = DateTimeOffset.UtcNow;
        await db.SaveChangesAsync(ct);

        return await ObtenerAsync(id, ct);
    }

    /// <summary>
    /// Registra cuántas unidades de cada artículo regresaron en buen estado y cuántas dañadas.
    /// Lo que no regresó (faltante) y lo dañado se descuentan de la existencia general.
    /// </summary>
    public async Task<PedidoResponse?> RegistrarRevisionAsync(int id, RevisionRequest request, CancellationToken ct = default)
    {
        var pedido = await db.Pedidos
            .Include(p => p.Lineas)
                .ThenInclude(l => l.Articulos)
            .FirstOrDefaultAsync(p => p.Id == id, ct);

        if (pedido is null)
        {
            return null;
        }

        if (pedido.Estado != EstadoPedido.Activo)
        {
            throw new ReglaNegocioException("Solo se puede revisar un pedido activo.", StatusCodes.Status409Conflict);
        }

        if (pedido.EntregadoEn is null)
        {
            throw new ReglaNegocioException("El pedido debe estar entregado para registrar la revisión.", StatusCodes.Status409Conflict);
        }

        var items = pedido.Lineas.SelectMany(l => l.Articulos).ToDictionary(a => a.Id);
        var articuloIds = items.Values.Select(a => a.ArticuloId).Distinct().ToList();
        var articulos = await db.Articulos
            .Where(a => articuloIds.Contains(a.Id))
            .ToDictionaryAsync(a => a.Id, ct);

        foreach (var entrada in request.Articulos)
        {
            if (!items.TryGetValue(entrada.PedidoArticuloId, out var item))
            {
                throw new ReglaNegocioException($"El artículo de pedido {entrada.PedidoArticuloId} no pertenece a este pedido.");
            }

            if (entrada.CantidadDevuelta + entrada.CantidadDaniada > item.Cantidad)
            {
                throw new ReglaNegocioException(
                    $"En {item.Descripcion} las unidades devueltas y dañadas ({entrada.CantidadDevuelta + entrada.CantidadDaniada}) superan lo entregado ({item.Cantidad}).");
            }

            // Lo que no regresó en buen estado sale de la existencia: faltante + dañado.
            // Se descuenta solo la diferencia contra la revisión anterior, para poder corregir la revisión.
            var perdidaAnterior = item.CantidadDevuelta is int devueltaAnterior ? item.Cantidad - devueltaAnterior : 0;
            var perdidaNueva = item.Cantidad - entrada.CantidadDevuelta;

            var articulo = articulos[item.ArticuloId];
            var existenciaNueva = articulo.ExistenciaTotal - (perdidaNueva - perdidaAnterior);
            if (existenciaNueva < 0)
            {
                throw new ReglaNegocioException(
                    $"La existencia de {articulo.Descripcion} no alcanza para registrar esa pérdida.");
            }

            articulo.ExistenciaTotal = existenciaNueva;
            item.CantidadDevuelta = entrada.CantidadDevuelta;
            item.CantidadDaniada = entrada.CantidadDaniada;
        }

        await db.SaveChangesAsync(ct);

        return await ObtenerAsync(id, ct);
    }

    /// <summary>
    /// Cierre manual que hace el encargado. Requiere pedido recogido, revisión completa
    /// y ningún faltante ni artículo dañado.
    /// </summary>
    public async Task<PedidoResponse?> CerrarAsync(int id, CancellationToken ct = default)
    {
        var pedido = await db.Pedidos
            .Include(p => p.Lineas)
                .ThenInclude(l => l.Articulos)
            .FirstOrDefaultAsync(p => p.Id == id, ct);

        if (pedido is null)
        {
            return null;
        }

        if (pedido.Estado != EstadoPedido.Activo)
        {
            throw new ReglaNegocioException("Solo se pueden cerrar pedidos activos.", StatusCodes.Status409Conflict);
        }

        if (pedido.RecogidoEn is null)
        {
            throw new ReglaNegocioException("El pedido debe estar recogido antes de cerrarse.", StatusCodes.Status409Conflict);
        }

        var articulos = pedido.Lineas.SelectMany(l => l.Articulos).ToList();

        if (articulos.Any(a => a.CantidadDevuelta is null))
        {
            throw new ReglaNegocioException("Falta registrar la revisión de devoluciones de todos los artículos.", StatusCodes.Status409Conflict);
        }

        if (articulos.Any(a => a.Cantidad - a.CantidadDevuelta!.Value - a.CantidadDaniada > 0))
        {
            throw new ReglaNegocioException("No se puede cerrar: hay piezas faltantes.", StatusCodes.Status409Conflict);
        }

        if (articulos.Any(a => a.CantidadDaniada > 0))
        {
            throw new ReglaNegocioException("No se puede cerrar: hay piezas dañadas.", StatusCodes.Status409Conflict);
        }

        pedido.Estado = EstadoPedido.Cerrado;
        pedido.CerradoEn = DateTimeOffset.UtcNow;
        await db.SaveChangesAsync(ct);

        return await ObtenerAsync(id, ct);
    }

    public async Task<PedidoResponse?> ObtenerAsync(int id, CancellationToken ct = default)
    {
        var pedido = await Consulta()
            .AsNoTracking()
            .FirstOrDefaultAsync(p => p.Id == id, ct);

        return pedido is null ? null : ToResponse(pedido);
    }

    public async Task<List<PedidoResponse>> ListarAsync(EstadoPedido? estado, CancellationToken ct = default)
    {
        var query = Consulta().AsNoTracking();

        if (estado is not null)
        {
            query = query.Where(p => p.Estado == estado);
        }

        var pedidos = await query.OrderBy(p => p.FechaHoraEntrega).ThenBy(p => p.Id).ToListAsync(ct);

        return pedidos.Select(ToResponse).ToList();
    }

    /// <summary>Pedidos activos que todavía no se han entregado, en orden de fecha de entrega.</summary>
    public Task<List<PedidoResponse>> ListarColaEntregaAsync(CancellationToken ct = default) =>
        ListarFiltradoAsync(p => p.Estado == EstadoPedido.Activo && p.EntregadoEn == null, ct);

    /// <summary>Pedidos ya entregados cuyas piezas todavía no se han recogido.</summary>
    public Task<List<PedidoResponse>> ListarPendientesRecogerAsync(CancellationToken ct = default) =>
        ListarFiltradoAsync(p => p.Estado == EstadoPedido.Activo && p.EntregadoEn != null && p.RecogidoEn == null, ct);

    private async Task<List<PedidoResponse>> ListarFiltradoAsync(
        Expression<Func<Pedido, bool>> filtro,
        CancellationToken ct)
    {
        var pedidos = await Consulta()
            .AsNoTracking()
            .Where(filtro)
            .OrderBy(p => p.FechaHoraEntrega)
            .ThenBy(p => p.Id)
            .ToListAsync(ct);

        return pedidos.Select(ToResponse).ToList();
    }

    private IQueryable<Pedido> Consulta() =>
        db.Pedidos
            .Include(p => p.Cliente)
            .Include(p => p.Lineas)
                .ThenInclude(l => l.Articulos);

    private static bool TieneRevision(Pedido pedido) =>
        pedido.Lineas.SelectMany(l => l.Articulos).Any(a => a.CantidadDevuelta is not null);

    /// <summary>Valida el pedido y copia sus datos y líneas. Devuelve las advertencias de inventario.</summary>
    private async Task<IReadOnlyList<AdvertenciaInventario>> AplicarAsync(
        Pedido pedido,
        PedidoRequest request,
        CancellationToken ct)
    {
        var cliente = await db.Clientes.FindAsync([request.ClienteId], ct)
            ?? throw new ReglaNegocioException("El cliente no existe.");

        if (request.FechaDevolucion < DateOnly.FromDateTime(request.FechaHoraEntrega))
        {
            throw new ReglaNegocioException("La fecha de devolución no puede ser anterior a la fecha de entrega.");
        }

        var direccion = request.DireccionEsDelCliente ? cliente.Direccion : request.DireccionOtra?.Trim();
        if (string.IsNullOrWhiteSpace(direccion))
        {
            throw new ReglaNegocioException("Indica la dirección de entrega.");
        }

        var lineas = await ConstruirLineasAsync(request.Lineas, ct);

        var subtotal = lineas.Sum(l => l.Cantidad * l.PrecioUnitario);
        var iva = request.RequiereFactura ? Math.Round(subtotal * TasaIva, 2) : 0m;
        var total = subtotal + iva;
        if (request.Anticipo > total)
        {
            throw new ReglaNegocioException("El anticipo no puede ser mayor al total del pedido.");
        }

        pedido.ClienteId = cliente.Id;
        pedido.FechaHoraEntrega = request.FechaHoraEntrega;
        pedido.FechaDevolucion = request.FechaDevolucion;
        pedido.DireccionEntrega = direccion;
        pedido.DireccionEsDelCliente = request.DireccionEsDelCliente;
        pedido.RequiereFactura = request.RequiereFactura;
        pedido.Anticipo = request.Anticipo;
        pedido.Pagado = request.Pagado;
        pedido.Lineas.Clear();
        pedido.Lineas.AddRange(lineas);

        return await CalcularAdvertenciasAsync(lineas.SelectMany(l => l.Articulos).ToList(), pedido.Id, ct);
    }

    private async Task<List<PedidoLinea>> ConstruirLineasAsync(List<LineaRequest> entradas, CancellationToken ct)
    {
        var articuloIds = entradas.Where(l => l.ArticuloId is not null).Select(l => l.ArticuloId!.Value).ToList();
        var paqueteIds = entradas.Where(l => l.PaqueteId is not null).Select(l => l.PaqueteId!.Value).ToList();

        var articulos = await db.Articulos
            .Where(a => articuloIds.Contains(a.Id))
            .ToDictionaryAsync(a => a.Id, ct);

        var paquetes = await db.Paquetes
            .Include(p => p.Componentes)
                .ThenInclude(c => c.Articulo)
            .Where(p => paqueteIds.Contains(p.Id))
            .ToDictionaryAsync(p => p.Id, ct);

        var lineas = new List<PedidoLinea>();

        foreach (var entrada in entradas)
        {
            var tieneArticulo = entrada.ArticuloId is not null;
            var tienePaquete = entrada.PaqueteId is not null;
            if (tieneArticulo == tienePaquete)
            {
                throw new ReglaNegocioException("Cada línea debe ser un artículo o un paquete, no ambos ni ninguno.");
            }

            if (entrada.ArticuloId is int articuloId)
            {
                if (!articulos.TryGetValue(articuloId, out var articulo))
                {
                    throw new ReglaNegocioException($"El artículo {articuloId} no existe.");
                }

                lineas.Add(new PedidoLinea
                {
                    ArticuloId = articulo.Id,
                    Descripcion = articulo.Descripcion,
                    Cantidad = entrada.Cantidad,
                    PrecioUnitario = articulo.PrecioRenta,
                    Articulos =
                    [
                        new PedidoArticulo
                        {
                            ArticuloId = articulo.Id,
                            Descripcion = articulo.Descripcion,
                            Cantidad = entrada.Cantidad,
                        },
                    ],
                });
            }
            else
            {
                var paqueteId = entrada.PaqueteId!.Value;
                if (!paquetes.TryGetValue(paqueteId, out var paquete))
                {
                    throw new ReglaNegocioException($"El paquete {paqueteId} no existe.");
                }

                // Se guardan los artículos del paquete tal como están al crear el pedido.
                lineas.Add(new PedidoLinea
                {
                    PaqueteId = paquete.Id,
                    Descripcion = paquete.Nombre,
                    Cantidad = entrada.Cantidad,
                    PrecioUnitario = paquete.PrecioRenta,
                    Articulos = paquete.Componentes
                        .Select(c => new PedidoArticulo
                        {
                            ArticuloId = c.ArticuloId,
                            Descripcion = c.Articulo.Descripcion,
                            Cantidad = c.Cantidad * entrada.Cantidad,
                        })
                        .ToList(),
                });
            }
        }

        return lineas;
    }

    /// <summary>
    /// Compara las unidades del pedido contra la existencia general, descontando las que otros pedidos
    /// activos todavía tienen fuera. Un artículo ya revisado ya no cuenta como comprometido.
    /// Solo genera avisos cuando el resultado es negativo.
    /// </summary>
    private async Task<IReadOnlyList<AdvertenciaInventario>> CalcularAdvertenciasAsync(
        List<PedidoArticulo> nuevos,
        int pedidoId,
        CancellationToken ct)
    {
        var solicitadas = nuevos
            .GroupBy(a => a.ArticuloId)
            .ToDictionary(g => g.Key, g => g.Sum(a => a.Cantidad));

        var comprometidas = (await db.PedidoArticulos
                .AsNoTracking()
                .Where(a => a.CantidadDevuelta == null
                    && a.PedidoLinea.Pedido.Estado == EstadoPedido.Activo
                    && a.PedidoLinea.PedidoId != pedidoId)
                .Select(a => new { a.ArticuloId, a.Cantidad })
                .ToListAsync(ct))
            .GroupBy(a => a.ArticuloId)
            .ToDictionary(g => g.Key, g => g.Sum(a => a.Cantidad));

        var articuloIds = solicitadas.Keys.ToList();
        var articulos = await db.Articulos.AsNoTracking().Where(a => articuloIds.Contains(a.Id)).ToListAsync(ct);

        return articulos
            .Select(a =>
            {
                var comprometida = comprometidas.GetValueOrDefault(a.Id);
                var solicitada = solicitadas[a.Id];
                return new AdvertenciaInventario(
                    a.Id,
                    a.Descripcion,
                    a.ExistenciaTotal,
                    comprometida,
                    solicitada,
                    a.ExistenciaTotal - comprometida - solicitada);
            })
            .Where(a => a.Restantes < 0)
            .ToList();
    }

    private static PedidoResponse ToResponse(Pedido p)
    {
        var subtotal = p.Lineas.Sum(l => l.Cantidad * l.PrecioUnitario);
        var iva = p.RequiereFactura ? Math.Round(subtotal * TasaIva, 2) : 0m;
        var total = subtotal + iva;

        return new PedidoResponse(
            p.Id,
            p.FechaCreacion,
            p.ClienteId,
            p.Cliente.NombreCompleto,
            p.FechaHoraEntrega,
            p.FechaDevolucion,
            p.DireccionEntrega,
            p.DireccionEsDelCliente,
            p.RequiereFactura,
            subtotal,
            iva,
            total,
            p.Anticipo,
            total - p.Anticipo,
            p.Pagado,
            p.Estado.ToString(),
            p.EntregadoEn,
            p.RecogidoEn,
            p.CerradoEn,
            p.Lineas
                .Select(l => new LineaResponse(
                    l.Id,
                    l.ArticuloId,
                    l.PaqueteId,
                    l.Descripcion,
                    l.Cantidad,
                    l.PrecioUnitario,
                    l.Cantidad * l.PrecioUnitario,
                    l.Articulos
                        .Select(a => new ArticuloPedidoResponse(
                            a.Id,
                            a.ArticuloId,
                            a.Descripcion,
                            a.Cantidad,
                            a.CantidadDevuelta,
                            a.CantidadDaniada,
                            a.CantidadDevuelta is int devuelta ? a.Cantidad - devuelta - a.CantidadDaniada : null))
                        .ToList()))
                .ToList());
    }
}
