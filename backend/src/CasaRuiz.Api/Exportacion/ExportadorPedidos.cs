using System.Globalization;
using CasaRuiz.Api.Dtos;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;

namespace CasaRuiz.Api.Exportacion;

/// <summary>
/// Hoja de pedido para imprimir (A4): cliente, dirección, fecha de entrega, líneas con su total,
/// y al final el total del pedido, el anticipo y el saldo por pagar.
/// </summary>
public static class ExportadorPedidos
{
    private static readonly CultureInfo Mexico = new("es-MX");

    public static byte[] ComoPdf(PedidoResponse pedido)
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
                    columna.Item().Text($"Pedido #{pedido.Id}").FontSize(20).SemiBold();
                });

                pagina.Content().PaddingTop(20).Column(columna =>
                {
                    columna.Spacing(14);

                    columna.Item().Row(fila =>
                    {
                        fila.RelativeItem().Column(bloque =>
                        {
                            bloque.Item().Text("Cliente").FontSize(9).FontColor(Colors.Grey.Darken1);
                            bloque.Item().Text(pedido.ClienteNombre).FontSize(14).SemiBold();
                        });
                        fila.RelativeItem().Column(bloque =>
                        {
                            bloque.Item().Text("Fecha de entrega").FontSize(9).FontColor(Colors.Grey.Darken1);
                            bloque.Item().Text($"{pedido.FechaHoraEntrega.ToString("dd-MM-yyyy HH:mm", Mexico)}").FontSize(14).SemiBold();
                        });
                    });

                    columna.Item().Column(bloque =>
                    {
                        bloque.Item().Text("Dirección de entrega").FontSize(9).FontColor(Colors.Grey.Darken1);
                        bloque.Item().Text(pedido.DireccionEntrega).FontSize(12);
                    });

                    columna.Item()
                        .Border(1)
                        .BorderColor(pedido.Pagado ? Colors.Green.Darken2 : Colors.Red.Darken2)
                        .Padding(8)
                        .Text(pedido.Pagado ? "PAGADO" : "NO PAGADO")
                        .FontSize(14)
                        .SemiBold()
                        .FontColor(pedido.Pagado ? Colors.Green.Darken2 : Colors.Red.Darken2);

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

                        foreach (var linea in pedido.Lineas)
                        {
                            tabla.Cell().BorderBottom(0.5f).BorderColor(Colors.Grey.Lighten1).Padding(6)
                                .Text(linea.Cantidad.ToString(Mexico));

                            tabla.Cell().BorderBottom(0.5f).BorderColor(Colors.Grey.Lighten1).Padding(6).Column(descripcion =>
                            {
                                descripcion.Item().Text(linea.Descripcion);
                                if (linea.PaqueteId is not null)
                                {
                                    // Un paquete se muestra con los artículos que incluye, sin repartir su precio.
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
                        totales.Item().Row(fila => FilaTotal(fila, "Subtotal", Dinero(pedido.Subtotal)));
                        if (pedido.Iva > 0)
                        {
                            totales.Item().Row(fila => FilaTotal(fila, "IVA (16%)", Dinero(pedido.Iva)));
                        }
                        if (pedido.CobrosPorDanos > 0)
                        {
                            totales.Item().Row(fila => FilaTotal(fila, "Cobros por daño", Dinero(pedido.CobrosPorDanos)));
                        }
                        totales.Item().PaddingTop(4).Row(fila => FilaTotal(fila, "Total del pedido", Dinero(pedido.Total), negrita: true));
                        totales.Item().Row(fila => FilaTotal(fila, "Anticipo pagado", Dinero(pedido.Anticipo)));
                        totales.Item().Row(fila => FilaTotal(fila, "Saldo a pagar", Dinero(pedido.Saldo), negrita: true));
                    });
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

    /// <summary>Artículos que incluye un paquete, con su cantidad: "16 Silla, 4 Mesa".</summary>
    private static string DetallePaquete(LineaResponse linea) =>
        "Incluye: " + string.Join(", ", linea.Articulos
            .GroupBy(a => a.Descripcion)
            .Select(g => $"{g.Sum(a => a.Cantidad).ToString(Mexico)} {g.Key}"));

    private static string Dinero(decimal monto) => monto.ToString("C2", Mexico);
}
