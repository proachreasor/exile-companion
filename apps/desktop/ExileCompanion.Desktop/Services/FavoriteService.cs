
using ExileCompanion.Desktop.Models;
using ExileCompanion.Desktop.Repositories;
using System.Collections.ObjectModel;
using System.IO;
using System.Text.Json;

namespace ExileCompanion.Desktop.Services;

/// <summary>
/// Manages favorite character identifiers and persistence.
/// </summary>
public sealed class FavoritesService
{
    /// <summary>
    /// Gets the in-memory list of favorite character IDs.
    /// </summary>
    public ObservableCollection<string> FavoriteIds { get; } = new();

    /// <summary>
    /// The file path used to persist favorite data.
    /// </summary>
    private readonly string _filePath;

    /// <summary>
    /// An optional callback invoked before saving favorites.
    /// </summary>
    private readonly Func<Task>? _beforeSave;

    /// <summary>
    /// Synchronizes concurrent save operations.
    /// </summary>
    private readonly SemaphoreSlim _saveLock = new(1, 1);

    /// <summary>
    /// Initializes a new instance of the <see cref="FavoritesService"/> class.
    /// </summary>
    /// <param name="filePath">An optional path to the favorites file.</param>
    /// <param name="beforeSave">An optional callback invoked before saving favorites.</param>
    public FavoritesService(
       string? filePath = null,
       Func<Task>? beforeSave = null)
    {
        string directory = Path.Combine(
            Environment.GetFolderPath(
                Environment.SpecialFolder.LocalApplicationData),
            "ExileCompanion");

        _filePath = filePath ??
            Path.Combine(directory, "favorites.json");

        _beforeSave = beforeSave;
    }

    /// <summary>
    /// Loads favorite identifiers from persistent storage.
    /// </summary>
    public async Task LoadAsync(ICharacterRepository? repository = null)
    {
        if (!File.Exists(_filePath))
            return;

        string json = await File.ReadAllTextAsync(_filePath);
        var data = JsonSerializer.Deserialize<FavoritesData>(json);

        if (data is null)
            throw new InvalidDataException("Favorites file is empty or invalid.");

        List<string> loadedIds;

        // Route on schema version: v1 stores bare character IDs and must be migrated
        // to composite keys, v2 is already current, anything else is rejected.
        switch (data.Version)
        {
            case 1:
                if (repository is null)
                    throw new InvalidOperationException(
                        "A character repository is required to migrate version 1 favorites.");

                loadedIds = await MigrateFavoritesAsync(data, repository);
                break;

            case 2:
                loadedIds = data.FavoriteIds.ToList();
                break;

            default:
                throw new InvalidDataException(
                    $"Unsupported favorites version: {data.Version}");
        }

        // Keep the previous state so a failure while repopulating (or re-saving a migrated
        // file) doesn't leave FavoriteIds half-populated for WPF bindings.
        List<string> previousIds = FavoriteIds.ToList();
        try
        {
            FavoriteIds.Clear();

            foreach (var id in loadedIds)
            {
                FavoriteIds.Add(id);
            }

            // Persist the migrated v2 format so the migration only runs once.
            if (data.Version == 1)
            {
                await SaveAsync();
            }
        }
        catch
        {
            // Roll back to the previous state before surfacing the error.
            FavoriteIds.Clear();

            foreach (var id in previousIds)
            {
                FavoriteIds.Add(id);
            }

            throw;
        }
    }

    /// <summary>
    /// Saves favorite identifiers to persistent storage.
    /// </summary>
    public async Task SaveAsync()
    {
        await _saveLock.WaitAsync();

        try
        {
            // Runs inside the lock so the callback can't interleave with another save.
            if (_beforeSave is not null)
            {
                await _beforeSave();
            }

            string directory = Path.GetDirectoryName(_filePath)!;
            Directory.CreateDirectory(directory);
            var data = new FavoritesData
            {
                Version = 2,
                FavoriteIds = FavoriteIds.ToList()
            };
            string json = JsonSerializer.Serialize(data);
            // Write to a temp file and swap it in so a crash mid-write can't corrupt favorites.json.
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

    /// <summary>
    /// Determines whether a character is currently marked as favorite.
    /// </summary>
    /// <param name="character">The character to check.</param>
    /// <returns><see langword="true"/> if the character is a favorite; otherwise, <see langword="false"/>.</returns>
    public bool IsFavorite(Character character)
    {
        return FavoriteIds.Contains(GetFavoriteKey(character));
    }

    /// <summary>
    /// Toggles the favorite state for a character.
    /// </summary>
    /// <param name="character">The character whose favorite state will be toggled.</param>
    public void ToggleFavorite(Character character)
    {
        var key = GetFavoriteKey(character);

        if (FavoriteIds.Contains(key))        {
            FavoriteIds.Remove(key);
        }
        else
        {
            FavoriteIds.Add(key);
        }
    }

    /// <summary>
    /// Builds the composite <c>GameId:Id</c> key. Character IDs are only unique within a game,
    /// so the game prefix prevents collisions between PoE1 and PoE2 characters.
    /// </summary>
    private static string GetFavoriteKey(Character character)
    {
        return $"{character.GameId}:{character.Id}";
    }

    /// <summary>
    /// Converts version 1 bare character IDs into composite keys using the repository.
    /// </summary>
    private async Task<List<string>> MigrateFavoritesAsync(
    FavoritesData data,
    ICharacterRepository repository)
    {
        var poe1Characters =
            await repository.GetCharactersAsync(GameId.Poe1);

        var poe2Characters =
            await repository.GetCharactersAsync(GameId.Poe2);

        var migratedIds = new List<string>();

        // Each legacy ID must resolve to exactly one game. Guessing on an ambiguous or
        // unknown ID could favorite the wrong character, so those cases throw instead.
        foreach (var id in data.FavoriteIds)        {
            var poe1Character = poe1Characters.FirstOrDefault(c => c.Id == id);
            var poe2Character = poe2Characters.FirstOrDefault(c => c.Id == id);
            if (poe1Character is not null && poe2Character is not null)
            {
                throw new InvalidDataException(
                    $"Duplicate character ID '{id}' found in both games.");
            }
            else if (poe1Character is not null)
            {
                migratedIds.Add(GetFavoriteKey(poe1Character));
            }
            else if (poe2Character is not null)
            {
                migratedIds.Add(GetFavoriteKey(poe2Character));
            }
            else
            {
                throw new InvalidDataException(
                    $"Character ID '{id}' was not found in either game.");
            }
        }

        return migratedIds.Distinct().ToList();
    }
}
