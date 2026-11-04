
using ExileCompanion.Desktop.Models;
using ExileCompanion.Desktop.Services;
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

        // TODO:
        // 1. Toggle the character's favorite state.
        service.ToggleFavorite(character);
        // 2. Assert that IsFavorite(character) returns true.
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

        // TODO:
        // 1. Toggle the character again.
        service.ToggleFavorite(character);
        // 2. Assert that IsFavorite(character) is false.
        Assert.False(service.IsFavorite(character));
        // 3. Assert that FavoriteIds is empty.
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

            // TODO:
            // 1. Add the character to originalService favorites.
            originalService.ToggleFavorite(character);
            // 2. Save using originalService.SaveAsync().
            await originalService.SaveAsync();
            // 3. Load using restoredService.LoadAsync().
            await restoredService.LoadAsync();
            // 4. Assert restoredService.IsFavorite(character) is true.
            Assert.True(restoredService.IsFavorite(character));
            // 5. Assert restoredService.FavoriteIds contains exactly one ID.
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

            // TODO:
            // Assert that LoadAsync throws InvalidDataException.
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

            // TODO:
            // Assert that LoadAsync throws InvalidDataException.
            await Assert.ThrowsAsync<JsonException>(async () => await service.LoadAsync());
        }
        finally
        {
            if (Directory.Exists(directory))
                Directory.Delete(directory, recursive: true);
        }
    }
}

