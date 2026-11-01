
using ExileCompanion.Desktop.Models;

namespace ExileCompanion.Desktop.Repositories;

public interface ICharacterRepository
{
    Task<IReadOnlyList<Character>> GetCharactersAsync(
        GameId gameId,
        CancellationToken cancellationToken = default);
}
