
using ExileCompanion.Desktop.Models;

namespace ExileCompanion.Desktop.Repositories;

/// <summary>
/// Defines character retrieval operations.
/// </summary>
public interface ICharacterRepository
{
    /// <summary>
    /// Gets characters for the specified game.
    /// </summary>
    /// <param name="gameId">The game identifier to query.</param>
    /// <param name="cancellationToken">The token used to cancel the operation.</param>
    /// <returns>A read-only collection of matching characters.</returns>
    Task<IReadOnlyList<Character>> GetCharactersAsync(
        GameId gameId,
        CancellationToken cancellationToken = default);
}
