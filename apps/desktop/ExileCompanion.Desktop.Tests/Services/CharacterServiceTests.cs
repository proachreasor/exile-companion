using ExileCompanion.Desktop.Models;
using ExileCompanion.Desktop.Services;
using ExileCompanion.Desktop.Tests.Repositories;
using System;
using System.IO;
using System.Threading;
using System.Threading.Tasks;

namespace ExileCompanion.Desktop.Tests.Services;

public class CharacterServiceTests
{
    [Fact]
    public async Task LoadCharactersAsync_LoadsCharactersFromRepository()
    {
        var character = new Character(
            "test-1",
            "TestMarauder",
            GameId.Poe1,
            "Marauder",
            50,
            "Standard");

        var repository = new FakeCharacterRepository
        {
            Poe1Characters = [character],
            Poe2Characters = []
        };

        var service = new CharacterService(repository);

        await service.LoadCharactersAsync(GameId.Poe1);

        Assert.Single(service.Characters);
        Assert.Equal(character, service.Characters[0]);
    }

    [Fact]
    public async Task LoadCharactersAsync_ReplacesCharactersWhenSwitchingGames()
    {
        var poe1Character = new Character(
            "poe1-1", "TestMarauder", GameId.Poe1,
            "Marauder", 50, "Standard");

        var poe2Character = new Character(
            "poe2-1", "TestWarrior", GameId.Poe2,
            "Warrior", 40, "Standard");

        var repository = new FakeCharacterRepository
        {
            Poe1Characters = [poe1Character],
            Poe2Characters = [poe2Character]
        };

        var service = new CharacterService(repository);

        await service.LoadCharactersAsync(GameId.Poe1);

        Assert.Equal(poe1Character, service.Characters[0]);

        await service.LoadCharactersAsync(GameId.Poe2);

        Assert.Single(service.Characters);
        Assert.DoesNotContain(poe1Character, service.Characters);
        Assert.Equal(poe2Character, service.Characters[0]);
        Assert.Equal(GameId.Poe2, service.CurrentGame);
    }

    [Fact]
    public async Task LoadCharactersAsync_ClearsCharactersWhenRepositoryReturnsEmpty()
    {
        var character = new Character(
            "poe1-1", "TestMarauder", GameId.Poe1,
            "Marauder", 50, "Standard");

        var repository = new FakeCharacterRepository
        {
            Poe1Characters = [character],
            Poe2Characters = []
        };

        var service = new CharacterService(repository);

        await service.LoadCharactersAsync(GameId.Poe1);

        Assert.Single(service.Characters);

        // An empty result is a valid load and must clear the previous game's characters.
        await service.LoadCharactersAsync(GameId.Poe2);

        Assert.Empty(service.Characters);
        Assert.Equal(GameId.Poe2, service.CurrentGame);
    }

    [Fact]
    public async Task LoadCharactersAsync_PreservesCharactersWhenCanceled()
    {
        var character = new Character(
            "poe1-1", "TestMarauder", GameId.Poe1,
            "Marauder", 50, "Standard");

        var repository = new FakeCharacterRepository
        {
            Poe1Characters = [character],
            Poe2Characters = []
        };

        var service = new CharacterService(repository);

        await service.LoadCharactersAsync(GameId.Poe1);

        using var cancellation = new CancellationTokenSource();
        cancellation.Cancel();

        // A canceled load must leave the existing characters and CurrentGame untouched.
        await Assert.ThrowsAsync<OperationCanceledException>(async () =>
        {
            await service.LoadCharactersAsync(GameId.Poe2, cancellation.Token);
        });

        Assert.Single(service.Characters);
        Assert.Equal(character, service.Characters[0]);
        Assert.Equal(GameId.Poe1, service.CurrentGame);
    }


    [Fact]
    public async Task LoadCharactersAsync_PreservesCharactersWhenCanceledDuringLoad()
    {
        var character = new Character(
            "poe1-1", "TestMarauder", GameId.Poe1,
            "Marauder", 50, "Standard");

        var repository = new FakeCharacterRepository
        {
            Poe1Characters = [character],
            Poe2Characters = []
        };

        var service = new CharacterService(repository);

        await service.LoadCharactersAsync(GameId.Poe1);

        repository.LoadStarted = new TaskCompletionSource<bool>(
            TaskCreationOptions.RunContinuationsAsynchronously);

        repository.AllowLoadToFinish = new TaskCompletionSource<bool>(
            TaskCreationOptions.RunContinuationsAsynchronously);

        using var cancellation = new CancellationTokenSource();

        Task loadingTask = service.LoadCharactersAsync(
            GameId.Poe2, cancellation.Token);

        await repository.LoadStarted.Task;

        // Cancel while the repository call is in flight; state must not be replaced.
        cancellation.Cancel();
        await Assert.ThrowsAnyAsync<OperationCanceledException>( () => loadingTask);

        Assert.Single(service.Characters);
        Assert.Equal(GameId.Poe1, service.CurrentGame);
    }


    [Fact]
    public async Task LoadCharactersAsync_PreservesCharactersWhenRepositoryFails()
    {
        var character = new Character(
            "poe1-1", "TestMarauder", GameId.Poe1,
            "Marauder", 50, "Standard");

        var repository = new FakeCharacterRepository
        {
            Poe1Characters = [character]
        };

        var service = new CharacterService(repository);

        await service.LoadCharactersAsync(GameId.Poe1);

        repository.ExceptionToThrow =
            new IOException("Simulated repository failure");

        // A repository failure must leave the existing characters and CurrentGame intact.
        await Assert.ThrowsAsync<IOException>(async () =>
        {
            await service.LoadCharactersAsync(GameId.Poe2);
        });

        Assert.Single(service.Characters);
        Assert.Equal(character, service.Characters[0]);
        Assert.Equal(GameId.Poe1, service.CurrentGame);
    }


}