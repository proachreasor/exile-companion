
using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;
using ExileCompanion.Desktop.Models;
using ExileCompanion.Desktop.Services;
using System.IO;

namespace ExileCompanion.Desktop.ViewModels;

/// <summary>
/// Represents the character detail screen state and actions.
/// </summary>
public partial class CharacterDetailViewModel : ObservableObject
{
    /// <summary>
    /// Backing field for the selected character.
    /// </summary>
    [ObservableProperty]
    private Character? _selectedCharacter;

    /// <summary>
    /// Backing field indicating whether the selected character is a favorite.
    /// </summary>
    [ObservableProperty]
    private bool _isFavorite;

    /// <summary>
    /// Backing field for favorite persistence error messages.
    /// </summary>
    [ObservableProperty]
    private string _favoriteError = string.Empty;

    /// <summary>
    /// The favorites service used to read and persist favorite state.
    /// </summary>
    private readonly FavoritesService _favoritesService;

    /// <summary>
    /// Loads the selected character into the view model.
    /// </summary>
    /// <param name="character">The character to display.</param>
    public void LoadCharacter(Character character)
    {
        SelectedCharacter = character;

        IsFavorite = _favoritesService.IsFavorite(character);
    }

    /// <summary>
    /// Initializes a new instance of the <see cref="CharacterDetailViewModel"/> class.
    /// </summary>
    /// <param name="favoritesService">The favorites service dependency.</param>
    public CharacterDetailViewModel(FavoritesService favoritesService)
    {
        _favoritesService = favoritesService;
    }

    /// <summary>
    /// Toggles favorite state for the selected character and persists the change.
    /// </summary>
    [RelayCommand]
    private async Task ToggleFavoriteAsync()
    {
        FavoriteError = string.Empty;
        if (SelectedCharacter is null)
            return;

        var character = SelectedCharacter;

        _favoritesService.ToggleFavorite(character);

        try
        {
            await _favoritesService.SaveAsync();
            IsFavorite = _favoritesService.IsFavorite(character);
        }
        catch (Exception ex) when (ex is IOException or UnauthorizedAccessException)
        {
            // Undo the in-memory toggle so the UI doesn't show a favorite that was never persisted.
            _favoritesService.ToggleFavorite(character);
            IsFavorite = _favoritesService.IsFavorite(character);
            FavoriteError = $"Failed to save favorites: {ex.Message}";
        }
    }
}
