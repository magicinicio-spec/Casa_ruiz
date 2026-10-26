using System.Globalization;
using CasaRuiz.Api.Dtos;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;

namespace CasaRuiz.Api.Exportacion;

/// <summary>Hoja de pedido para imprimir (A4): cliente, dirección, artículos totales y estado de pago.</summary>
public static class ExportadorPedidos
{
    private static readonly CultureInfo Mexico = new("es-MX");

    public static byte[] ComoPdf(PedidoResponse pedido)
    {
        // Un paquete se desglosa en sus artículos; las cantidades se suman por artículo.
        var articulos = pedido.Lineas
            .SelectMany(l => l.Articulos)
            .GroupBy(a => a.ArticuloId)
            .Select(g => (Descripcion: g.First().Descripcion, Cantidad: g.Sum(a => a.Cantidad)))
            .OrderBy(a => a.Descripcion)
            .ToList();

        var totalPiezas = articulos.Sum(a => a.Cantidad);

        return Document.Create(documento =>
        {
            documento.Page(pagina =>
            {
                pagina.Size(PageSizes.A4);
                pagina.Margin(40);
                pagina.DefaultTextStyle(texto => texto.FontFamily("Inter").FontSize(11));

                pagina.Header().Row(fila =>
                {
                    fila.RelativeItem().Column(columna =>
                    {
                        columna.Item().Text("Casa Ruiz").FontSize(10).FontColor(Colors.Grey.Darken2);
                        columna.Item().Text($"Pedido #{pedido.Id}").FontSize(20).SemiBold();
                    });
                });

                pagina.Content().PaddingTop(20).Column(columna =>
                {
                    columna.Spacing(14);

                    columna.Item().Column(bloque =>
                    {
                        bloque.Item().Text("Cliente").FontSize(9).FontColor(Colors.Grey.Darken1);
                        bloque.Item().Text(pedido.ClienteNombre).FontSize(14).SemiBold();
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
                            columnas.RelativeColumn(4);
                            columnas.RelativeColumn(1);
                        });

                        tabla.Header(encabezado =>
                        {
                            encabezado.Cell().Background(Colors.Grey.Lighten3).Padding(6).Text("Artículo").SemiBold();
                            encabezado.Cell().Background(Colors.Grey.Lighten3).Padding(6).AlignRight().Text("Cantidad").SemiBold();
                        });

                        foreach (var articulo in articulos)
                        {
                            tabla.Cell().BorderBottom(0.5f).BorderColor(Colors.Grey.Lighten1).Padding(6).Text(articulo.Descripcion);
                            tabla.Cell().BorderBottom(0.5f).BorderColor(Colors.Grey.Lighten1).Padding(6).AlignRight()
                                .Text(articulo.Cantidad.ToString(Mexico));
                        }

                        tabla.Cell().Padding(6).Text("Total de piezas").SemiBold();
                        tabla.Cell().Padding(6).AlignRight().Text(totalPiezas.ToString(Mexico)).SemiBold();
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
}
