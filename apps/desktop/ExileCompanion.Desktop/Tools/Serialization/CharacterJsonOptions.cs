using System.Text.Json;
using System.Text.Json.Serialization;

namespace ExileCompanion.Desktop.tools.serialization
{
    /// <summary>
    /// Provides shared JSON serializer options for character payloads.
    /// </summary>
    public static class CharacterJsonOptions
    {
        /// <summary>
        /// Gets the default JSON serializer configuration for character data.
        /// </summary>
        public static JsonSerializerOptions Default { get; } = Create();

        /// <summary>
        /// Creates serializer options for character data.
        /// </summary>
        /// <returns>A configured <see cref="JsonSerializerOptions"/> instance.</returns>
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
