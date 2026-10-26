using System.Globalization;
using ClosedXML.Excel;
using CasaRuiz.Api.Dtos;
using CasaRuiz.Api.Services;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;

namespace CasaRuiz.Api.Exportacion;

/// <summary>Convierte los reportes en tablas y estas en Excel o PDF.</summary>
public class ExportadorReportes(ReportesService reportes)
{
    private static readonly CultureInfo Mexico = new("es-MX");
    private static readonly string[] EncabezadosPedidos =
        ["Pedido", "Cliente", "Teléfono", "Entrega", "Devolución", "Dirección", "Estado", "Total", "Anticipo", "Saldo", "Pagado"];

    public async Task<TablaReporte> PedidosPagadosAsync(DateOnly? desde, DateOnly? hasta)
    {
        var reporte = await reportes.PedidosPagadosAsync(desde, hasta);
        var rango = desde is null && hasta is null
            ? "Todas las fechas"
            : $"Entrega del {desde?.ToString("dd-MM-yyyy", Mexico) ?? "inicio"} al {hasta?.ToString("dd-MM-yyyy", Mexico) ?? "final"}";

        return new TablaReporte(
            $"Pedidos pagados · {rango}",
            "pedidos-pagados",
            EncabezadosPedidos,
            reporte.Pedidos.Select(FilaPedido).ToList(),
            $"{reporte.Cantidad} pedidos · Total {reporte.TotalPagado.ToString("C2", Mexico)}");
    }

    public async Task<TablaReporte> PendientesRecogerAsync()
    {
        var pedidos = await reportes.PendientesRecogerAsync();

        return new TablaReporte(
            "Pedidos por recoger",
            "pendientes-recoger",
            EncabezadosPedidos,
            pedidos.Select(FilaPedido).ToList(),
            $"{pedidos.Count} pedidos con piezas por recoger");
    }

    public async Task<TablaReporte> InventarioAsync()
    {
        var articulos = await reportes.InventarioAsync();

        return new TablaReporte(
            "Inventario",
            "inventario",
            ["Artículo", "Categoría", "Existencia", "En renta", "Disponible", "Dados de baja"],
            articulos
                .Select(a => (object?[])[a.Descripcion, a.Categoria, a.ExistenciaTotal, a.EnRenta, a.Disponible, a.DadosDeBaja])
                .ToList(),
            null);
    }

    public byte[] ComoExcel(TablaReporte tabla)
    {
        using var libro = new XLWorkbook();
        var hoja = libro.Worksheets.Add("Reporte");

        hoja.Cell(1, 1).Value = tabla.Titulo;
        hoja.Cell(1, 1).Style.Font.Bold = true;
        hoja.Cell(1, 1).Style.Font.FontSize = 14;

        for (var c = 0; c < tabla.Columnas.Length; c++)
        {
            var celda = hoja.Cell(3, c + 1);
            celda.Value = tabla.Columnas[c];
            celda.Style.Font.Bold = true;
            celda.Style.Fill.BackgroundColor = XLColor.FromHtml("#f9faf7");
            celda.Style.Border.BottomBorder = XLBorderStyleValues.Thin;
        }

        for (var f = 0; f < tabla.Filas.Count; f++)
        {
            for (var c = 0; c < tabla.Columnas.Length; c++)
            {
                var valor = tabla.Filas[f][c];
                var celda = hoja.Cell(f + 4, c + 1);

                switch (valor)
                {
                    case decimal monto:
                        celda.Value = monto;
                        celda.Style.NumberFormat.Format = "$#,##0.00";
                        break;
                    case int cantidad:
                        celda.Value = cantidad;
                        break;
                    case string texto:
                        celda.SetValue(texto);
                        break;
                    default:
                        celda.Value = "";
                        break;
                }
            }
        }

        if (tabla.Resumen is not null)
        {
            var fila = tabla.Filas.Count + 5;
            hoja.Cell(fila, 1).Value = tabla.Resumen;
            hoja.Cell(fila, 1).Style.Font.Italic = true;
        }

        hoja.Columns().AdjustToContents();
        hoja.SheetView.FreezeRows(3);

        using var memoria = new MemoryStream();
        libro.SaveAs(memoria);
        return memoria.ToArray();
    }

    public byte[] ComoPdf(TablaReporte tabla)
    {
        return Document.Create(documento =>
        {
            documento.Page(pagina =>
            {
                pagina.Size(PageSizes.A4.Landscape());
                pagina.Margin(24);
                pagina.DefaultTextStyle(texto => texto.FontFamily("Inter").FontSize(9));

                pagina.Header().Column(columna =>
                {
                    columna.Item().Text("Casa Ruiz").FontSize(10).FontColor(Colors.Grey.Darken2);
                    columna.Item().Text(tabla.Titulo).FontSize(15).SemiBold();
                    columna.Item().Text($"Generado el {DateTime.Now:dd-MM-yyyy HH:mm}").FontSize(8).FontColor(Colors.Grey.Darken1);
                });

                pagina.Content().PaddingTop(12).Column(columna =>
                {
                    columna.Item().Table(tablaPdf =>
                    {
                        tablaPdf.ColumnsDefinition(columnas =>
                        {
                            foreach (var _ in tabla.Columnas)
                            {
                                columnas.RelativeColumn();
                            }
                        });

                        tablaPdf.Header(encabezado =>
                        {
                            foreach (var titulo in tabla.Columnas)
                            {
                                encabezado.Cell().Background(Colors.Grey.Lighten3).Padding(4).Text(titulo).SemiBold();
                            }
                        });

                        foreach (var fila in tabla.Filas)
                        {
                            foreach (var valor in fila)
                            {
                                tablaPdf.Cell().BorderBottom(0.5f).BorderColor(Colors.Grey.Lighten1).Padding(4)
                                    .Text(TextoCelda(valor));
                            }
                        }
                    });

                    if (tabla.Resumen is not null)
                    {
                        columna.Item().PaddingTop(10).Text(tabla.Resumen).Italic();
                    }
                });

                pagina.Footer().AlignCenter().Text(texto =>
                {
                    texto.Span("Página ");
                    texto.CurrentPageNumber();
                    texto.Span(" de ");
                    texto.TotalPages();
                });
            });
        }).GeneratePdf();
    }

    private static string TextoCelda(object? valor) => valor switch
    {
        decimal monto => monto.ToString("C2", Mexico),
        int cantidad => cantidad.ToString(Mexico),
        string texto => texto,
        _ => "",
    };

    private static object?[] FilaPedido(ReportePedidoResponse p) =>
    [
        $"#{p.Id}",
        p.ClienteNombre,
        p.ClienteTelefono,
        p.FechaHoraEntrega.ToString("dd-MM-yyyy HH:mm", Mexico),
        p.FechaDevolucion.ToString("dd-MM-yyyy", Mexico),
        p.DireccionEntrega,
        p.Estado,
        p.Total,
        p.Anticipo,
        p.Saldo,
        p.Pagado ? "Sí" : "No",
    ];
}
