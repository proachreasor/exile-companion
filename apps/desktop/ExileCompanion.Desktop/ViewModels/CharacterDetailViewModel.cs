
using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;
using ExileCompanion.Desktop.Models;
using ExileCompanion.Desktop.Services;
using System.IO;

namespace ExileCompanion.Desktop.ViewModels;

public partial class CharacterDetailViewModel : ObservableObject
{
    [ObservableProperty]
    private Character? _selectedCharacter;

    [ObservableProperty]
    private bool _isFavorite;
    [ObservableProperty]
    private string _favoriteError = string.Empty;

    private readonly FavoritesService _favoritesService;

    public void LoadCharacter(Character character)
    {
        SelectedCharacter = character;

        // TODO: Update IsFavorite using FavoritesService.
        IsFavorite = _favoritesService.IsFavorite(character);
    }

    public CharacterDetailViewModel(FavoritesService favoritesService)
    {
        _favoritesService = favoritesService;
    }

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
            _favoritesService.ToggleFavorite(character);
            IsFavorite = _favoritesService.IsFavorite(character);
            FavoriteError = $"Failed to save favorites: {ex.Message}";
        }
    }
}
