
using ExileCompanion.Desktop.Models;
using ExileCompanion.Desktop.Repositories;
using System;
using System.IO;
using System.Threading.Tasks;

namespace ExileCompanion.Desktop.Tests.Repositories;

public class LocalCharacterRepositoryTests
{
    [Fact]
    public async Task GetCharactersAsync_ReturnsOnlyRequestedGame()
    {
        string directory = Path.Combine(
            Path.GetTempPath(),
            "ExileCompanionTests",
            Guid.NewGuid().ToString());

        string filePath = Path.Combine(directory, "characters.json");

        try
        {
            Directory.CreateDirectory(directory);

            await File.WriteAllTextAsync(filePath, """
            {
              "poe1": [
                {
                  "id": "poe1-1",
                  "name": "TestMarauder",
                  "gameId": "poe1",
                  "characterClass": "Marauder",
                  "level": 50,
                  "league": "Standard"
                }
              ],
              "poe2": [
                {
                  "id": "poe2-1",
                  "name": "TestWarrior",
                  "gameId": "poe2",
                  "characterClass": "Warrior",
                  "level": 40,
                  "league": "Standard"
                }
              ]
            }
            """);

            var repository = new LocalCharacterRepository(filePath);

            var characters = await repository.GetCharactersAsync(GameId.Poe1);

            Assert.Single(characters);
            Assert.Equal("TestMarauder", characters[0].Name);
            Assert.Equal(GameId.Poe1, characters[0].GameId);
        }
        finally
        {
            if (Directory.Exists(directory))
                Directory.Delete(directory, recursive: true);
        }
    }

    [Fact]
    public async Task GetCharactersAsync_ThrowsWhenFileIsMissing()
    {
        string directory = Path.Combine(
            Path.GetTempPath(),
            "ExileCompanionTests",
            Guid.NewGuid().ToString());

        string filePath = Path.Combine(directory, "missing-characters.json");

        try
        {
            Directory.CreateDirectory(directory);

            var repository = new LocalCharacterRepository(filePath);

            await Assert.ThrowsAsync<FileNotFoundException>(
                () => repository.GetCharactersAsync(GameId.Poe1));
        }
        finally
        {
            if (Directory.Exists(directory))
            {
                Directory.Delete(directory, recursive: true);
            }
        }
    }

    [Fact]
    public async Task GetCharactersAsync_ThrowsWhenDirectoryIsMissing()
    {
        string filePath = Path.Combine(
            Path.GetTempPath(),
            Guid.NewGuid().ToString(),
            "missing-characters.json");


        var repository = new LocalCharacterRepository(filePath);

        // A missing directory surfaces as DirectoryNotFoundException, not FileNotFoundException.
        await Assert.ThrowsAsync<DirectoryNotFoundException>(() => repository.GetCharactersAsync(GameId.Poe1));
    }

    [Fact]
    public async Task GetCharactersAsync_ThrowsForMalformedJson()
    {
        string directory = Path.Combine(
            Path.GetTempPath(),
            "ExileCompanionTests",
            Guid.NewGuid().ToString());

        string filePath = Path.Combine(directory, "characters.json");

        try
        {
            Directory.CreateDirectory(directory);

            await File.WriteAllTextAsync(
                filePath,
                "{ invalid json }");

            var repository = new LocalCharacterRepository(filePath);

            await Assert.ThrowsAsync<System.Text.Json.JsonException>(async () =>
            {
                await repository.GetCharactersAsync(GameId.Poe1);
            });
        }
        finally
        {
            if (Directory.Exists(directory))
                Directory.Delete(directory, recursive: true);
        }
    }
}
