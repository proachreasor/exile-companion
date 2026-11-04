using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;
using ExileCompanion.Desktop.Models;
using ExileCompanion.Desktop.Services;
using System.IO;

namespace ExileCompanion.Desktop.ViewModels;

/// <summary>
/// Coordinates top-level navigation and game selection state.
/// </summary>
public partial class MainViewModel : ObservableObject
{
    /// <summary>
    /// Gets the list of available games.
    /// </summary>
    public IReadOnlyList<GameId> AvailableGames { get; } =
    [
        GameId.Poe1,
        GameId.Poe2
    ];

    /// <summary>
    /// Gets the application title.
    /// </summary>
    public string ApplicationTitle => "Exile Companion";

    /// <summary>
    /// The dashboard view model.
    /// </summary>
    private readonly DashboardViewModel _dashboardViewModel;

    /// <summary>
    /// The characters view model.
    /// </summary>
    private readonly CharactersViewModel _charactersViewModel;

    /// <summary>
    /// The character detail view model.
    /// </summary>
    private readonly CharacterDetailViewModel _characterDetailViewModel;

    /// <summary>
    /// The character service used during game changes.
    /// </summary>
    private readonly CharacterService _characterService;

    /// <summary>
    /// Tracks the active game-change operation cancellation source.
    /// </summary>
    private CancellationTokenSource? _gameChangeCancellation;


    /// <summary>
    /// Backing field for game-loading error details.
    /// </summary>
    [ObservableProperty]
    private string _gameLoadingError = string.Empty;

    /// <summary>
    /// Backing field for the selected game.
    /// </summary>
    [ObservableProperty]
    private GameId _selectedGame = GameId.Poe1;

    /// <summary>
    /// Backing field for the current active view model.
    /// </summary>
    [ObservableProperty]
    private ObservableObject _currentViewModel;

    /// <summary>
    /// Initializes a new instance of the <see cref="MainViewModel"/> class.
    /// </summary>
    /// <param name="dashboardViewModel">The dashboard view model.</param>
    /// <param name="charactersViewModel">The characters view model.</param>
    /// <param name="characterDetailViewModel">The character detail view model.</param>
    /// <param name="characterService">The character service.</param>
    public MainViewModel(
        DashboardViewModel dashboardViewModel,
        CharactersViewModel charactersViewModel,
        CharacterDetailViewModel characterDetailViewModel,
        CharacterService characterService)
    {
        _dashboardViewModel = dashboardViewModel;
        _charactersViewModel = charactersViewModel;
        _charactersViewModel.CharacterSelected = NavigateToCharacterDetail;
        _characterDetailViewModel = characterDetailViewModel;
        _characterService = characterService;
        CurrentViewModel = _dashboardViewModel;
    }

    /// <summary>
    /// Navigates to the dashboard view.
    /// </summary>
    [RelayCommand]
    private void NavigateToDashboard()
    {
        CurrentViewModel = _dashboardViewModel;
    }

    /// <summary>
    /// Navigates to the characters view.
    /// </summary>
    [RelayCommand]
    private void NavigateToCharacters()
    {
        _charactersViewModel.SelectedCharacter = null;
        CurrentViewModel = _charactersViewModel;
    }

    /// <summary>
    /// Navigates to the character detail view for a selected character.
    /// </summary>
    /// <param name="character">The selected character.</param>
    private void NavigateToCharacterDetail(Character character)
    {
        _characterDetailViewModel.LoadCharacter(character);
        CurrentViewModel = _characterDetailViewModel;
    }

    /// <summary>
    /// Handles game selection changes and starts async loading for the selected game.
    /// </summary>
    /// <param name="value">The selected game identifier.</param>
    partial void OnSelectedGameChanged(GameId value)

    {
        _gameChangeCancellation?.Cancel();

        GameLoadingError = string.Empty;

        var cancellation = new CancellationTokenSource();
        _gameChangeCancellation = cancellation;

        _ = ChangeGameAsync(value, cancellation);
    }

    /// <summary>
    /// Loads characters for the selected game and updates navigation state when needed.
    /// </summary>
    /// <param name="gameId">The game to load.</param>
    /// <param name="cancellation">The cancellation source for this game-change operation.</param>
    private async Task ChangeGameAsync(GameId gameId, CancellationTokenSource cancellation)
    {
        CancellationToken token = cancellation.Token;

        try
        {
            await _characterService.LoadCharactersAsync(gameId, token);

            token.ThrowIfCancellationRequested();

            System.Diagnostics.Debug.WriteLine($"Finished loading characters for game: {gameId}");

            if (CurrentViewModel == _characterDetailViewModel)
            {
                _characterDetailViewModel.SelectedCharacter = null;
                _charactersViewModel.SelectedCharacter = null;
                CurrentViewModel = _charactersViewModel;
            }
        }
        catch (OperationCanceledException)
            when (token.IsCancellationRequested)
        {
            GameLoadingError = $"Canceled loading characters for {gameId}";
        }
        catch (Exception ex)
        {
            if (!token.IsCancellationRequested &&
                ReferenceEquals(_gameChangeCancellation, cancellation))
            {
                GameLoadingError = $"Failed to load characters: {ex.Message}";
            }
        }
        finally
        {
            if (ReferenceEquals(_gameChangeCancellation, cancellation))
            {
                _gameChangeCancellation = null;
            }

            cancellation.Dispose();
        }
    }
}


