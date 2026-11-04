
using System.IO;
using System.Text.Json;
using ExileCompanion.Desktop.Models;
using ExileCompanion.Desktop.tools.serialization;

namespace ExileCompanion.Desktop.Repositories;

/// <summary>
/// Loads character data from a local JSON file.
/// </summary>
public sealed class LocalCharacterRepository : ICharacterRepository
{
    /// <summary>
    /// The path to the character data file.
    /// </summary>
    private readonly string _filePath;

    /// <summary>
    /// Initializes a new instance of the <see cref="LocalCharacterRepository"/> class.
    /// </summary>
    /// <param name="filePath">The path to the JSON character file.</param>
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
