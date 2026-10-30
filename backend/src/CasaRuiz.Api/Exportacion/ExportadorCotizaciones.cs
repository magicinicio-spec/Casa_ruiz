using System.Globalization;
using CasaRuiz.Api.Dtos;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;

namespace CasaRuiz.Api.Exportacion;

/// <summary>
/// Hoja de cotización (A4): mismos datos que la hoja de pedido, pero sin pagos ni saldo.
/// Una cotización no aparta inventario.
/// </summary>
public static class ExportadorCotizaciones
{
    private static readonly CultureInfo Mexico = new("es-MX");

    public static byte[] ComoPdf(CotizacionResponse cotizacion)
    {
        return Document.Create(documento =>
        {
            documento.Page(pagina =>
            {
                pagina.Size(PageSizes.A4);
                pagina.Margin(40);
                pagina.DefaultTextStyle(texto => texto.FontFamily("Inter").FontSize(11));

                pagina.Header().Column(columna =>
                {
                    columna.Item().Text("Casa Ruiz").FontSize(10).FontColor(Colors.Grey.Darken2);
                    columna.Item().Text($"Cotización #{cotizacion.Id}").FontSize(20).SemiBold();
                });

                pagina.Content().PaddingTop(20).Column(columna =>
                {
                    columna.Spacing(14);

                    columna.Item().Row(fila =>
                    {
                        fila.RelativeItem().Column(bloque =>
                        {
                            bloque.Item().Text("Cliente").FontSize(9).FontColor(Colors.Grey.Darken1);
                            bloque.Item().Text(cotizacion.ClienteNombre).FontSize(14).SemiBold();
                        });
                        fila.RelativeItem().Column(bloque =>
                        {
                            bloque.Item().Text("Fecha de entrega").FontSize(9).FontColor(Colors.Grey.Darken1);
                            bloque.Item().Text(cotizacion.FechaHoraEntrega.ToString("dd-MM-yyyy HH:mm", Mexico)).FontSize(14).SemiBold();
                        });
                    });

                    columna.Item().Column(bloque =>
                    {
                        bloque.Item().Text("Dirección de entrega").FontSize(9).FontColor(Colors.Grey.Darken1);
                        bloque.Item().Text(cotizacion.DireccionEntrega).FontSize(12);
                    });

                    columna.Item().Table(tabla =>
                    {
                        tabla.ColumnsDefinition(columnas =>
                        {
                            columnas.RelativeColumn(1);
                            columnas.RelativeColumn(5);
                            columnas.RelativeColumn(2);
                        });

                        tabla.Header(encabezado =>
                        {
                            encabezado.Cell().Background(Colors.Grey.Lighten3).Padding(6).Text("Cantidad").SemiBold();
                            encabezado.Cell().Background(Colors.Grey.Lighten3).Padding(6).Text("Descripción").SemiBold();
                            encabezado.Cell().Background(Colors.Grey.Lighten3).Padding(6).AlignRight().Text("Total").SemiBold();
                        });

                        foreach (var linea in cotizacion.Lineas)
                        {
                            tabla.Cell().BorderBottom(0.5f).BorderColor(Colors.Grey.Lighten1).Padding(6)
                                .Text(linea.Cantidad.ToString(Mexico));

                            tabla.Cell().BorderBottom(0.5f).BorderColor(Colors.Grey.Lighten1).Padding(6).Column(descripcion =>
                            {
                                descripcion.Item().Text(linea.Descripcion);
                                if (linea.PaqueteId is not null)
                                {
                                    descripcion.Item().Text(DetallePaquete(linea)).FontSize(9).FontColor(Colors.Grey.Darken1);
                                }
                            });

                            tabla.Cell().BorderBottom(0.5f).BorderColor(Colors.Grey.Lighten1).Padding(6).AlignRight()
                                .Text(Dinero(linea.Importe));
                        }
                    });

                    columna.Item().AlignRight().Width(260).Column(totales =>
                    {
                        totales.Spacing(4);
                        totales.Item().Row(fila => FilaTotal(fila, "Subtotal", Dinero(cotizacion.Subtotal)));
                        if (cotizacion.Iva > 0)
                        {
                            totales.Item().Row(fila => FilaTotal(fila, "IVA (16%)", Dinero(cotizacion.Iva)));
                        }
                        totales.Item().PaddingTop(4).Row(fila => FilaTotal(fila, "Total", Dinero(cotizacion.Total), negrita: true));
                    });

                    columna.Item().PaddingTop(12).Text("Esta cotización no aparta inventario.")
                        .FontSize(9).FontColor(Colors.Grey.Darken1);
                });

                pagina.Footer().AlignCenter().Text(texto =>
                {
                    texto.Span("Impreso el ");
                    texto.Span(DateTime.Now.ToString("dd-MM-yyyy HH:mm", Mexico));
                });
            });
        }).GeneratePdf();
    }

    private static void FilaTotal(RowDescriptor fila, string etiqueta, string valor, bool negrita = false)
    {
        var texto = fila.RelativeItem().Text(etiqueta);
        var monto = fila.RelativeItem().AlignRight().Text(valor);
        if (negrita)
        {
            texto.SemiBold();
            monto.SemiBold();
        }
    }

    private static string DetallePaquete(CotizacionLineaResponse linea) =>
        "Incluye: " + string.Join(", ", linea.Articulos
            .GroupBy(a => a.Descripcion)
            .Select(g => $"{g.Sum(a => a.Cantidad).ToString(Mexico)} {g.Key}"));

    private static string Dinero(decimal monto) => monto.ToString("C2", Mexico);
}
