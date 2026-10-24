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
        var pedido = await db.Pedidos.Include(p => p.Lineas).FirstOrDefaultAsync(p => p.Id == id, ct);
        if (pedido is null)
        {
            return null;
        }

        if (pedido.Estado == EstadoPedido.Cancelado)
        {
            throw new ReglaNegocioException("No se puede editar un pedido cancelado.", StatusCodes.Status409Conflict);
        }

        var advertencias = await AplicarAsync(pedido, request, ct);
        await db.SaveChangesAsync(ct);

        return new PedidoGuardadoResponse((await ObtenerAsync(id, ct))!, advertencias);
    }

    public async Task<PedidoResponse?> CancelarAsync(int id, CancellationToken ct = default)
    {
        var pedido = await db.Pedidos.FirstOrDefaultAsync(p => p.Id == id, ct);
        if (pedido is null)
        {
            return null;
        }

        if (pedido.Estado == EstadoPedido.Cancelado)
        {
            throw new ReglaNegocioException("El pedido ya está cancelado.", StatusCodes.Status409Conflict);
        }

        pedido.Estado = EstadoPedido.Cancelado;
        await db.SaveChangesAsync(ct);

        return await ObtenerAsync(id, ct);
    }

    public async Task<PedidoResponse?> ObtenerAsync(int id, CancellationToken ct = default)
    {
        var pedido = await db.Pedidos
            .AsNoTracking()
            .Include(p => p.Cliente)
            .Include(p => p.Lineas)
            .FirstOrDefaultAsync(p => p.Id == id, ct);

        return pedido is null ? null : ToResponse(pedido);
    }

    public async Task<List<PedidoResponse>> ListarAsync(EstadoPedido? estado, CancellationToken ct = default)
    {
        var query = db.Pedidos.AsNoTracking().Include(p => p.Cliente).Include(p => p.Lineas).AsQueryable();

        if (estado is not null)
        {
            query = query.Where(p => p.Estado == estado);
        }

        var pedidos = await query.OrderBy(p => p.FechaHoraEntrega).ToListAsync(ct);

        return pedidos.Select(ToResponse).ToList();
    }

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

        return await CalcularAdvertenciasAsync(lineas, pedido.Id, ct);
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
                    Articulo = articulo,
                    Descripcion = articulo.Descripcion,
                    Cantidad = entrada.Cantidad,
                    PrecioUnitario = articulo.PrecioRenta,
                });
            }
            else
            {
                var paqueteId = entrada.PaqueteId!.Value;
                if (!paquetes.TryGetValue(paqueteId, out var paquete))
                {
                    throw new ReglaNegocioException($"El paquete {paqueteId} no existe.");
                }

                lineas.Add(new PedidoLinea
                {
                    PaqueteId = paquete.Id,
                    Paquete = paquete,
                    Descripcion = paquete.Nombre,
                    Cantidad = entrada.Cantidad,
                    PrecioUnitario = paquete.PrecioRenta,
                });
            }
        }

        return lineas;
    }

    /// <summary>
    /// Compara las unidades del pedido contra la existencia general, descontando las que ya comprometen
    /// otros pedidos activos. Solo genera avisos cuando el resultado es negativo.
    /// </summary>
    private async Task<IReadOnlyList<AdvertenciaInventario>> CalcularAdvertenciasAsync(
        List<PedidoLinea> lineas,
        int pedidoId,
        CancellationToken ct)
    {
        var solicitadas = Unidades(lineas);

        var lineasComprometidas = await db.PedidoLineas
            .AsNoTracking()
            .Include(l => l.Paquete)
                .ThenInclude(p => p!.Componentes)
            .Where(l => l.Pedido.Estado == EstadoPedido.Activo && l.PedidoId != pedidoId)
            .ToListAsync(ct);

        var comprometidas = Unidades(lineasComprometidas);

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

    /// <summary>Convierte las líneas en unidades por artículo, expandiendo los paquetes en sus componentes.</summary>
    private static Dictionary<int, int> Unidades(IEnumerable<PedidoLinea> lineas)
    {
        var unidades = new Dictionary<int, int>();

        foreach (var linea in lineas)
        {
            if (linea.ArticuloId is int articuloId)
            {
                Sumar(unidades, articuloId, linea.Cantidad);
            }
            else if (linea.Paquete is not null)
            {
                foreach (var componente in linea.Paquete.Componentes)
                {
                    Sumar(unidades, componente.ArticuloId, componente.Cantidad * linea.Cantidad);
                }
            }
        }

        return unidades;
    }

    private static void Sumar(Dictionary<int, int> unidades, int articuloId, int cantidad) =>
        unidades[articuloId] = unidades.GetValueOrDefault(articuloId) + cantidad;

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
            p.Lineas
                .Select(l => new LineaResponse(
                    l.ArticuloId,
                    l.PaqueteId,
                    l.Descripcion,
                    l.Cantidad,
                    l.PrecioUnitario,
                    l.Cantidad * l.PrecioUnitario))
                .ToList());
    }
}
