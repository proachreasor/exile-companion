
using ExileCompanion.Desktop.Models;
using System.Collections.ObjectModel;
using System.IO;

namespace ExileCompanion.Desktop.Services;

public sealed class FavoritesService
{
    public ObservableCollection<string> FavoriteIds { get; } = new();
    private readonly string _filePath;

    private readonly SemaphoreSlim _saveLock = new(1, 1);

    public FavoritesService()
    {
        string directory = Path.Combine(
            Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
            "ExileCompanion");

        _filePath = Path.Combine(directory, "favorites.json");
    }

    public async Task LoadAsync()
    {
        if (!File.Exists(_filePath))
            return;

        // TODO:
        // 1. Read the JSON file asynchronously.
        // 2. Deserialize it into FavoritesData.
        // 3. Verify Version == 1.
        // 4. Clear FavoriteIds.
        // 5. Populate FavoriteIds from the loaded data.
        string json = await File.ReadAllTextAsync(_filePath);
        var data = System.Text.Json.JsonSerializer.Deserialize<FavoritesData>(json);
        if (data?.Version == 1)
        {
            FavoriteIds.Clear();
            foreach (var id in data.FavoriteIds)
            {
                FavoriteIds.Add(id);
            }
        }
    }

    public async Task SaveAsync()
    {
        await _saveLock.WaitAsync();

        try
        {
            string directory = Path.GetDirectoryName(_filePath)!;
            Directory.CreateDirectory(directory);
            var data = new FavoritesData
            {
                Version = 1,
                FavoriteIds = FavoriteIds.ToList()
            };
            string json = System.Text.Json.JsonSerializer.Serialize(data);
            string tempPath = _filePath + ".tmp";
            try
            {
                await File.WriteAllTextAsync(tempPath, json);

                if (File.Exists(_filePath))
                {
                    File.Replace(tempPath, _filePath, null);
                }
                else
                {
                    File.Move(tempPath, _filePath);
                }

            }
            finally
            {
                if (File.Exists(tempPath))
                {
                    File.Delete(tempPath);
                }
            }
        }
        finally
        {
            _saveLock.Release();
        }
    }

    public bool IsFavorite(Character character)
    {
        return FavoriteIds.Contains(character.Id);
    }

    public void ToggleFavorite(Character character)
    {
        // TODO:
        // 1. Check whether the character is already a favorite.
        // 2. If yes, remove it.
        // 3. Otherwise, add it.
        if (character == null)
        {
            return;
        }

        if (FavoriteIds.Contains(character.Id))
        {
            FavoriteIds.Remove(character.Id);
        }
        else
        {
            FavoriteIds.Add(character.Id);
        }

    }
}
