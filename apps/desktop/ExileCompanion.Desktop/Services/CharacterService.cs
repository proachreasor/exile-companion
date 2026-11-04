
using ExileCompanion.Desktop.Models;
using ExileCompanion.Desktop.Repositories;
using System.Collections.ObjectModel;

namespace ExileCompanion.Desktop.Services;

/// <summary>
/// Provides operations for loading and managing characters in memory.
/// </summary>
public sealed class CharacterService
{
    /// <summary>
    /// The repository used to retrieve character data.
    /// </summary>
    private readonly ICharacterRepository _repository;

    /// <summary>
    /// Gets the in-memory collection of loaded characters.
    /// </summary>
    public ObservableCollection<Character> Characters { get; } = new();

    /// <summary>
    /// Gets the currently selected game identifier.
    /// </summary>
    public GameId CurrentGame { get; private set; } = GameId.Poe1;

    /// <summary>
    /// Initializes a new instance of the <see cref="CharacterService"/> class.
    /// </summary>
    /// <param name="repository">The character repository.</param>
    public CharacterService(ICharacterRepository repository)
    {
        _repository = repository;
    }

    /// <summary>
    /// Adds a character to the in-memory collection.
    /// </summary>
    /// <param name="character">The character to add.</param>
    public void AddCharacter(Character character)
    {
        Characters.Add(character);
    }

    /// <summary>
    /// Loads characters for the specified game and replaces the in-memory collection.
    /// </summary>
    /// <param name="gameId">The game identifier to load.</param>
    /// <param name="cancellationToken">The token used to cancel the operation.</param>
    public async Task LoadCharactersAsync(
    GameId gameId,
    CancellationToken cancellationToken = default)
    {
        var retrievedCharacters =
            await _repository.GetCharactersAsync(gameId, cancellationToken);

        cancellationToken.ThrowIfCancellationRequested();

        Characters.Clear();

        foreach (var character in retrievedCharacters)
        {
            Characters.Add(character);
        }

        CurrentGame = gameId;
    }
}
