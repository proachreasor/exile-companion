
using System.IO;
using System.Text.Json;
using ExileCompanion.Desktop.Models;
using ExileCompanion.Desktop.tools.serialization;

namespace ExileCompanion.Desktop.Repositories;

public sealed class LocalCharacterRepository : ICharacterRepository
{
    private readonly string _filePath;

    public LocalCharacterRepository(string filePath)
    {
        _filePath = filePath;
    }

    // <inheritdoc />
    public async Task<IReadOnlyList<Character>> GetCharactersAsync(
        GameId gameId,
        CancellationToken cancellationToken = default)
    {
        // Read the JSON data from the file
        string json = await File.ReadAllTextAsync(_filePath,cancellationToken);

        // Deserialize the JSON data into a dictionary where the key is the gameId and the value is a list of characters
        var data = JsonSerializer.Deserialize<Dictionary<string, List<Character>>>(json, CharacterJsonOptions.Default);

        if(data == null || !data.TryGetValue(gameId.ToString().ToLowerInvariant(), out var characters) ||
        characters == null)
        {
            return Array.Empty<Character>();
        }

        return characters;
    }
}
