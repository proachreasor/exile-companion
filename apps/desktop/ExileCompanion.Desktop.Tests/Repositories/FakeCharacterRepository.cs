using ExileCompanion.Desktop.Models;
using ExileCompanion.Desktop.Repositories;
using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;

namespace ExileCompanion.Desktop.Tests.Repositories;

public sealed class FakeCharacterRepository : ICharacterRepository
{
    public IReadOnlyList<Character> Poe1Characters { get; set; } = [];
    public IReadOnlyList<Character> Poe2Characters { get; set; } = [];
    public TaskCompletionSource<bool>? LoadStarted { get; set; }
    public TaskCompletionSource<bool>? AllowLoadToFinish { get; set; }
    public Exception? ExceptionToThrow { get; set; }

    public IReadOnlyList<Character> CharactersToReturn { get; set; }
        = Array.Empty<Character>();

    public async Task<IReadOnlyList<Character>> GetCharactersAsync(
    GameId gameId,
    CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();

        if (ExceptionToThrow is not null)
            throw ExceptionToThrow;

        LoadStarted?.TrySetResult(true);

        if (AllowLoadToFinish is not null)
        {
            await AllowLoadToFinish.Task.WaitAsync(cancellationToken);
        }

        cancellationToken.ThrowIfCancellationRequested();

        return gameId switch
        {
            GameId.Poe1 => Poe1Characters,
            GameId.Poe2 => Poe2Characters,
            _ => throw new ArgumentOutOfRangeException(nameof(gameId))
        };
    }
}