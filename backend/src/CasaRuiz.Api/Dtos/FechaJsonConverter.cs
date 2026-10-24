using System.Globalization;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace CasaRuiz.Api.Dtos;

/// <summary>Lee y escribe una fecha sin hora en formato dd-MM-yyyy.</summary>
public class FechaJsonConverter : JsonConverter<DateOnly>
{
    public const string Formato = "dd-MM-yyyy";

    public override DateOnly Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
    {
        var texto = reader.GetString();

        if (texto is not null
            && DateOnly.TryParseExact(texto, Formato, CultureInfo.InvariantCulture, DateTimeStyles.None, out var fecha))
        {
            return fecha;
        }

        throw new JsonException("La fecha de devolución debe tener el formato dd-MM-yyyy.");
    }

    public override void Write(Utf8JsonWriter writer, DateOnly value, JsonSerializerOptions options) =>
        writer.WriteStringValue(value.ToString(Formato, CultureInfo.InvariantCulture));
}
