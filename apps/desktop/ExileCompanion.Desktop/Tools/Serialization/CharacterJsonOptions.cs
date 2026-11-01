using System.Text.Json;
using System.Text.Json.Serialization;

namespace ExileCompanion.Desktop.tools.serialization
{
    public static class CharacterJsonOptions
    {
        public static JsonSerializerOptions Default { get; } = Create();

        private static JsonSerializerOptions Create()
        {
            var options = new JsonSerializerOptions
            {
                PropertyNameCaseInsensitive = true,
                PropertyNamingPolicy = JsonNamingPolicy.CamelCase
            };

            options.Converters.Add(
                new JsonStringEnumConverter(JsonNamingPolicy.CamelCase));

            return options;
        }
    }
}
