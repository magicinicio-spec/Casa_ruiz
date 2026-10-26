using QuestPDF.Drawing;
using QuestPDF.Infrastructure;

namespace CasaRuiz.Api.Exportacion;

/// <summary>Configuración de QuestPDF. Se llama una vez al iniciar la aplicación.</summary>
public static class ConfiguracionPdf
{
    public static void Configurar()
    {
        // Licencia comunitaria de QuestPDF: uso gratuito para empresas con ingresos menores a 1 M USD.
        QuestPDF.Settings.License = LicenseType.Community;

        // QuestPDF no usa fuentes del sistema: la fuente se incluye con la aplicación (Inter, licencia OFL).
        var carpeta = Path.Combine(AppContext.BaseDirectory, "Fuentes");
        FontManager.RegisterFont(File.OpenRead(Path.Combine(carpeta, "Inter-Regular.ttf")));
        FontManager.RegisterFont(File.OpenRead(Path.Combine(carpeta, "Inter-SemiBold.ttf")));
    }
}
