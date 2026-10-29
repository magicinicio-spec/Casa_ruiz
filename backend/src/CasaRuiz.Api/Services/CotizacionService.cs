using CasaRuiz.Api.Data;
using CasaRuiz.Api.Dtos;
using CasaRuiz.Api.Models;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;

namespace CasaRuiz.Api.Services;

/// <summary>Cotizaciones: mismos datos del pedido, sin anticipo ni pagos, y sin apartar inventario.</summary>
public class CotizacionService(AppDbContext db)
{
    public async Task<CotizacionResponse?> ObtenerAsync(int id, CancellationToken ct = default)
    {
        var cotizacion = await Consulta().AsNoTracking().FirstOrDefaultAsync(c => c.Id == id, ct);

        return cotizacion is null ? null : ToResponse(cotizacion);
    }

    public async Task<List<CotizacionResponse>> ListarAsync(CancellationToken ct = default)
    {
        var lista = await Consulta().AsNoTracking()
            .OrderByDescending(c => c.FechaCreacion)
            .ToListAsync(ct);

        return lista.Select(ToResponse).ToList();
    }

    public async Task<int> CrearAsync(CotizacionRequest request, CancellationToken ct = default)
    {
        var cotizacion = new Cotizacion { FechaCreacion = DateTimeOffset.UtcNow };
        await AplicarAsync(cotizacion, request, ct);

        db.Cotizaciones.Add(cotizacion);
        await db.SaveChangesAsync(ct);

        return cotizacion.Id;
    }

    public async Task<bool> ActualizarAsync(int id, CotizacionRequest request, CancellationToken ct = default)
    {
        var cotizacion = await db.Cotizaciones
            .Include(c => c.Lineas).ThenInclude(l => l.Articulos)
            .FirstOrDefaultAsync(c => c.Id == id, ct);

        if (cotizacion is null)
        {
            return false;
        }

        if (cotizacion.PedidoId is not null)
        {
            throw new ReglaNegocioException("Esta cotización ya se convirtió en pedido y no se puede editar.", StatusCodes.Status409Conflict);
        }

        await AplicarAsync(cotizacion, request, ct);
        await db.SaveChangesAsync(ct);

        return true;
    }

    /// <summary>
    /// Crea un pedido con los datos que confirme el usuario (pueden diferir de la cotización)
    /// y marca la cotización como convertida. Ambas cosas se guardan juntas o no se guarda ninguna.
    /// </summary>
    public async Task<PedidoGuardadoResponse> ConvertirAsync(int id, PedidoRequest request, PedidoService pedidos, CancellationToken ct = default)
    {
        var cotizacion = await db.Cotizaciones.FirstOrDefaultAsync(c => c.Id == id, ct)
            ?? throw new ReglaNegocioException("La cotización no existe.", StatusCodes.Status404NotFound);

        if (cotizacion.PedidoId is not null)
        {
            throw new ReglaNegocioException("Esta cotización ya se convirtió en pedido.", StatusCodes.Status409Conflict);
        }

        await using var transaccion = await db.Database.BeginTransactionAsync(ct);

        var resultado = await pedidos.CrearAsync(request, ct);

        cotizacion.PedidoId = resultado.Pedido.Id;
        cotizacion.ConvertidaEn = DateTimeOffset.UtcNow;
        await db.SaveChangesAsync(ct);
        await transaccion.CommitAsync(ct);

        return resultado;
    }

    private async Task AplicarAsync(Cotizacion cotizacion, CotizacionRequest request, CancellationToken ct)
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

        cotizacion.ClienteId = cliente.Id;
        cotizacion.FechaHoraEntrega = request.FechaHoraEntrega;
        cotizacion.FechaDevolucion = request.FechaDevolucion;
        cotizacion.DireccionEntrega = direccion;
        cotizacion.DireccionEsDelCliente = request.DireccionEsDelCliente;
        cotizacion.RequiereFactura = request.RequiereFactura;
        cotizacion.Lineas.Clear();
        cotizacion.Lineas.AddRange(lineas);
    }

    private async Task<List<CotizacionLinea>> ConstruirLineasAsync(List<LineaRequest> entradas, CancellationToken ct)
    {
        var articuloIds = entradas.Where(l => l.ArticuloId is not null).Select(l => l.ArticuloId!.Value).ToList();
        var paqueteIds = entradas.Where(l => l.PaqueteId is not null).Select(l => l.PaqueteId!.Value).ToList();

        var articulos = await db.Articulos.Where(a => articuloIds.Contains(a.Id)).ToDictionaryAsync(a => a.Id, ct);
        var paquetes = await db.Paquetes
            .Include(p => p.Componentes).ThenInclude(c => c.Articulo)
            .Where(p => paqueteIds.Contains(p.Id))
            .ToDictionaryAsync(p => p.Id, ct);

        var lineas = new List<CotizacionLinea>();

        foreach (var entrada in entradas)
        {
            var tieneArticulo = entrada.ArticuloId is not null;
            var tienePaquete = entrada.PaqueteId is not null;
            if (tieneArticulo == tienePaquete)
            {
                throw new ReglaNegocioException("Cada línea debe ser un artículo o un paquete, no ambos ni ninguno.");
            }

            if (entrada.Cantidad < 1)
            {
                throw new ReglaNegocioException("La cantidad debe ser de al menos 1.");
            }

            if (entrada.ArticuloId is int articuloId)
            {
                if (!articulos.TryGetValue(articuloId, out var articulo))
                {
                    throw new ReglaNegocioException($"El artículo {articuloId} no existe.");
                }

                lineas.Add(new CotizacionLinea
                {
                    ArticuloId = articulo.Id,
                    Descripcion = articulo.Descripcion,
                    Cantidad = entrada.Cantidad,
                    PrecioUnitario = articulo.PrecioRenta,
                    Articulos = [new CotizacionArticulo { ArticuloId = articulo.Id, Descripcion = articulo.Descripcion, Cantidad = entrada.Cantidad }],
                });
            }
            else
            {
                var paqueteId = entrada.PaqueteId!.Value;
                if (!paquetes.TryGetValue(paqueteId, out var paquete))
                {
                    throw new ReglaNegocioException($"El paquete {paqueteId} no existe.");
                }

                lineas.Add(new CotizacionLinea
                {
                    PaqueteId = paquete.Id,
                    Descripcion = paquete.Nombre,
                    Cantidad = entrada.Cantidad,
                    PrecioUnitario = paquete.PrecioRenta,
                    Articulos = paquete.Componentes
                        .Select(c => new CotizacionArticulo
                        {
                            ArticuloId = c.ArticuloId,
                            Descripcion = c.Articulo.Descripcion,
                            Cantidad = c.Cantidad * entrada.Cantidad,
                        })
                        .ToList(),
                });
            }
        }

        if (lineas.Count == 0)
        {
            throw new ReglaNegocioException("Agrega al menos un artículo o paquete.");
        }

        return lineas;
    }

    private IQueryable<Cotizacion> Consulta() =>
        db.Cotizaciones
            .Include(c => c.Cliente)
            .Include(c => c.Lineas).ThenInclude(l => l.Articulos);

    private static CotizacionResponse ToResponse(Cotizacion c)
    {
        var subtotal = c.Lineas.Sum(l => l.Cantidad * l.PrecioUnitario);
        var iva = c.RequiereFactura ? Math.Round(subtotal * PedidoService.TasaIva, 2) : 0m;

        return new CotizacionResponse(
            c.Id,
            c.FechaCreacion,
            c.ClienteId,
            c.Cliente.NombreCompleto,
            c.Cliente.Telefono,
            c.FechaHoraEntrega,
            c.FechaDevolucion,
            c.DireccionEntrega,
            c.DireccionEsDelCliente,
            c.RequiereFactura,
            subtotal,
            iva,
            subtotal + iva,
            c.PedidoId,
            c.ConvertidaEn,
            c.Lineas.Select(l => new CotizacionLineaResponse(
                l.Id,
                l.ArticuloId,
                l.PaqueteId,
                l.Descripcion,
                l.Cantidad,
                l.PrecioUnitario,
                l.Cantidad * l.PrecioUnitario,
                l.Articulos.Select(a => new ComponenteResponse(a.ArticuloId, a.Descripcion, a.Cantidad)).ToList()))
                .ToList());
    }
}
