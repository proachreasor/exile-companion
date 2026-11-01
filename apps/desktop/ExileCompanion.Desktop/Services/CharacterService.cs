
using ExileCompanion.Desktop.Models;
using ExileCompanion.Desktop.Repositories;
using System.Collections.ObjectModel;

namespace ExileCompanion.Desktop.Services;

public sealed class CharacterService
{
    private readonly ICharacterRepository _repository;

    public ObservableCollection<Character> Characters { get; } = new();

    public CharacterService(ICharacterRepository repository)
    {
        _repository = repository;
    }

    public void AddCharacter(Character character)
    {
        Characters.Add(character);
    }

    public async Task LoadCharactersAsync(
        GameId gameId,
        CancellationToken cancellationToken = default)
    {
        // TODO: Implement repository loading.
        var retrievedCharacters = await _repository.GetCharactersAsync(gameId, cancellationToken);

        cancellationToken.ThrowIfCancellationRequested();

        Characters.Clear();

        foreach (var character in retrievedCharacters)
        {
            Characters.Add(character);
        }
    }
}
