
using ExileCompanion.Desktop.Models;
using ExileCompanion.Desktop.Services;
using ExileCompanion.Desktop.Tests.Repositories;
using System;
using System.IO;
using System.Text.Json;
using System.Threading.Tasks;

namespace ExileCompanion.Desktop.Tests.Services;


public class FavoritesServiceTests
{
    [Fact]
    public void ToggleFavorite_AddsCharacter_WhenNotAlreadyFavorite()
    {
        string filePath = Path.Combine(
            Path.GetTempPath(),
            Guid.NewGuid().ToString(),
            "favorites.json");

        var service = new FavoritesService(filePath);

        var character = new Character(
            "test-1",
            "TestCharacter",
            GameId.Poe1,
            "Marauder",
            50,
            "Standard");

        service.ToggleFavorite(character);

        Assert.True(service.IsFavorite(character));
    }

    [Fact]
    public void ToggleFavorite_RemovesCharacter_WhenAlreadyFavorite()
    {
        var service = new FavoritesService();
        var character = new Character(
            "test-1",
            "TestCharacter",
            GameId.Poe1,
            "Marauder",
            50,
            "Standard");

        service.ToggleFavorite(character);

        service.ToggleFavorite(character);

        Assert.False(service.IsFavorite(character));
        Assert.Empty(service.FavoriteIds);
    }

    [Fact]
    public async Task SaveAndLoad_PreservesFavorites()
    {
        string directory = Path.Combine(
            Path.GetTempPath(),
            "ExileCompanionTests",
            Guid.NewGuid().ToString());

        string filePath = Path.Combine(directory, "favorites.json");

        try
        {
            var originalService = new FavoritesService(filePath);
            var restoredService = new FavoritesService(filePath);

            var character = new Character(
                "test-1",
                "TestCharacter",
                GameId.Poe1,
                "Marauder",
                50,
                "Standard");

            originalService.ToggleFavorite(character);
            await originalService.SaveAsync();

            // Saved data must use the current schema version so reloading never needs a migration.
            string persistedJson = await File.ReadAllTextAsync(filePath);
            var persistedData = JsonSerializer.Deserialize<FavoritesData>(persistedJson);
            Assert.NotNull(persistedData);
            Assert.Equal(2, persistedData.Version);

            await restoredService.LoadAsync();

            Assert.True(restoredService.IsFavorite(character));
            Assert.Single(restoredService.FavoriteIds);
        }
        finally
        {
            if (Directory.Exists(directory))
                Directory.Delete(directory, recursive: true);
        }
    }

    [Fact]
    public async Task LoadAsync_ThrowsForUnsupportedVersion()
    {
        string directory = Path.Combine(
            Path.GetTempPath(),
            "ExileCompanionTests",
            Guid.NewGuid().ToString());

        string filePath = Path.Combine(directory, "favorites.json");

        try
        {
            Directory.CreateDirectory(directory);

            await File.WriteAllTextAsync(
                filePath,
                """{"Version":99,"FavoriteIds":["test-1"]}""");

            var service = new FavoritesService(filePath);

            await Assert.ThrowsAsync<InvalidDataException>(async () => await service.LoadAsync());
        }
        finally
        {
            if (Directory.Exists(directory))
                Directory.Delete(directory, recursive: true);
        }
    }

    [Fact]
    public async Task LoadAsync_ThrowsJsonExceptionError()
    {
        string directory = Path.Combine(
            Path.GetTempPath(),
            "ExileCompanionTests",
            Guid.NewGuid().ToString());

        string filePath = Path.Combine(directory, "favorites.json");

        try
        {
            Directory.CreateDirectory(directory);

            await File.WriteAllTextAsync(
                filePath,
                "{ invalid json }");

            var service = new FavoritesService(filePath);

            await Assert.ThrowsAsync<JsonException>(async () => await service.LoadAsync());
        }
        finally
        {
            if (Directory.Exists(directory))
                Directory.Delete(directory, recursive: true);
        }
    }

    [Fact]
    public void Favorites_AreIndependentBetweenGames()
    {
        var service = new FavoritesService();

        var poe1Character = new Character(
            "shared-id", "TestMarauder", GameId.Poe1,
            "Marauder", 50, "Standard");

        var poe2Character = new Character(
            "shared-id", "TestWarrior", GameId.Poe2,
            "Warrior", 40, "Standard");

        service.ToggleFavorite(poe1Character);

        Assert.True(service.IsFavorite(poe1Character));

        // Same ID in a different game must not be treated as a favorite.
        Assert.False(service.IsFavorite(poe2Character));
    }


    [Fact]
    public async Task LoadAsync_MigratesVersion1Favorites()
    {
        string directory = Path.Combine(
            Path.GetTempPath(),
            "ExileCompanionTests",
            Guid.NewGuid().ToString());

        string filePath = Path.Combine(directory, "favorites.json");

        try
        {
            Directory.CreateDirectory(directory);

            await File.WriteAllTextAsync(filePath, """
        {
            "Version": 1,
            "FavoriteIds": ["poe1-1", "poe2-1"]
        }
        """);

            var repository = new FakeCharacterRepository
            {
                Poe1Characters =
                [
                    new Character(
                    "poe1-1", "Marauder", GameId.Poe1,
                    "Marauder", 50, "Standard")
                ],
                Poe2Characters =
                [
                    new Character(
                    "poe2-1", "Warrior", GameId.Poe2,
                    "Warrior", 40, "Standard")
                ]
            };

            var service = new FavoritesService(filePath);

            // Version 1 stores bare IDs; loading migrates them to GameId-prefixed keys.
            await service.LoadAsync(repository);
            Assert.Contains("Poe1:poe1-1", service.FavoriteIds);
            Assert.Contains("Poe2:poe2-1", service.FavoriteIds);
            Assert.Equal(2, service.FavoriteIds.Count);
        }
        finally
        {
            if (Directory.Exists(directory))
                Directory.Delete(directory, recursive: true);
        }
    }

    [Fact]
    public async Task LoadAsync_ThrowsWhenVersion1IdIsMissing()
    {
        string directory = Path.Combine(
            Path.GetTempPath(),
            "ExileCompanionTests",
            Guid.NewGuid().ToString());

        string filePath = Path.Combine(directory, "favorites.json");

        try
        {
            Directory.CreateDirectory(directory);

            await File.WriteAllTextAsync(filePath, """
        {
            "Version": 1,
            "FavoriteIds": ["poe1-3"]
        }
        """);

            var repository = new FakeCharacterRepository
            {
                Poe1Characters =
                [
                    new Character(
                    "poe1-1", "Marauder", GameId.Poe1,
                    "Marauder", 50, "Standard")
                ],
                Poe2Characters =
                [
                    new Character(
                    "poe2-1", "Warrior", GameId.Poe2,
                    "Warrior", 40, "Standard")
                ]
            };

            var service = new FavoritesService(filePath);

            // An unresolvable ID must fail the load and leave the original v1 file untouched.
            await Assert.ThrowsAsync<InvalidDataException>(() => service.LoadAsync(repository));

            Assert.Empty(service.FavoriteIds);

            string savedJson = await File.ReadAllTextAsync(filePath);
            Assert.Contains("\"Version\": 1", savedJson);
            Assert.Contains("poe1-3", savedJson);
        }
        finally
        {
            if (Directory.Exists(directory))
                Directory.Delete(directory, recursive: true);
        }
    }


    [Fact]
    public async Task LoadAsync_ThrowsWhenVersion1IdIsAmbiguous()
    {
        string directory = Path.Combine(
            Path.GetTempPath(),
            "ExileCompanionTests",
            Guid.NewGuid().ToString());

        string filePath = Path.Combine(directory, "favorites.json");

        try
        {
            Directory.CreateDirectory(directory);

            await File.WriteAllTextAsync(filePath, """
        {
            "Version": 1,
            "FavoriteIds": ["poe2-1"]
        }
        """);

            var repository = new FakeCharacterRepository
            {
                Poe1Characters =
                [
                    new Character(
                    "poe2-1", "Marauder", GameId.Poe1,
                    "Marauder", 50, "Standard")
                ],
                Poe2Characters =
                [
                    new Character(
                    "poe2-1", "Warrior", GameId.Poe2,
                    "Warrior", 40, "Standard")
                ]
            };

            var service = new FavoritesService(filePath);

            // An ID present in both games is ambiguous; it must fail rather than guess.
            await Assert.ThrowsAsync<InvalidDataException>( () => service.LoadAsync(repository));

            Assert.Empty(service.FavoriteIds);

            string savedJson = await File.ReadAllTextAsync(filePath);
            Assert.Contains("\"Version\": 1", savedJson);
            Assert.Contains("poe2-1", savedJson);
        }
        finally
        {
            if (Directory.Exists(directory))
                Directory.Delete(directory, recursive: true);
        }
    }


    [Fact]
    public async Task LoadAsync_PreservesPreviousStateWhenMigrationSaveFails()
    {
        string directory = Path.Combine(
            Path.GetTempPath(),
            "ExileCompanionTests",
            Guid.NewGuid().ToString());

        string filePath = Path.Combine(directory, "favorites.json");

        try
        {
            Directory.CreateDirectory(directory);

            string originalJson = """
            {"Version":1,"FavoriteIds":["poe1-1"]}
            """;

            await File.WriteAllTextAsync(filePath, originalJson);

            var repository = new FakeCharacterRepository
            {
                Poe1Characters =
                [
                    new Character(
                    "poe1-1", "TestMarauder",
                    GameId.Poe1, "Marauder", 50, "Standard")
                ]
            };

            var service = new FavoritesService(
                filePath,
                beforeSave: () => throw new IOException("Simulated save failure"));

            // Establish an existing in-memory favorite.
            service.FavoriteIds.Add("Poe2:previous");

            // The migration re-save fails, so the in-memory state and the v1 file must both be unchanged.
            await Assert.ThrowsAsync<IOException>(() => service.LoadAsync(repository));

            Assert.Single(service.FavoriteIds);

            string savedJson = await File.ReadAllTextAsync(filePath);
            Assert.Equal(originalJson, savedJson);
        }
        finally
        {
            if (Directory.Exists(directory))
                Directory.Delete(directory, recursive: true);
        }
    }


}

