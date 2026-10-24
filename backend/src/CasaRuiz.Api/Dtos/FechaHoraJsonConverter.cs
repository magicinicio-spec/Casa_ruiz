using System.Globalization;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace CasaRuiz.Api.Dtos;

/// <summary>Lee y escribe la fecha y hora de entrega en formato dd-MM-yyyy HH:mm.</summary>
public class FechaHoraJsonConverter : JsonConverter<DateTime>
{
    public const string Formato = "dd-MM-yyyy HH:mm";

    private static readonly string[] FormatosAceptados = [Formato, "dd-MM-yyyy"];

    public override DateTime Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
    {
        var texto = reader.GetString();

        if (texto is not null
            && DateTime.TryParseExact(texto, FormatosAceptados, CultureInfo.InvariantCulture, DateTimeStyles.None, out var fecha))
        {
            return fecha;
        }

        throw new JsonException("La fecha de entrega debe tener el formato dd-MM-yyyy HH:mm.");
    }

    public override void Write(Utf8JsonWriter writer, DateTime value, JsonSerializerOptions options) =>
        writer.WriteStringValue(value.ToString(Formato, CultureInfo.InvariantCulture));
}
