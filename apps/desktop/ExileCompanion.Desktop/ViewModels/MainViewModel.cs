using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;
using ExileCompanion.Desktop.Models;
using ExileCompanion.Desktop.Services;
using System.IO;

namespace ExileCompanion.Desktop.ViewModels;

public partial class MainViewModel : ObservableObject
{
    public IReadOnlyList<GameId> AvailableGames { get; } =
    [
        GameId.Poe1,
        GameId.Poe2
    ];
    public string ApplicationTitle => "Exile Companion";

    private readonly DashboardViewModel _dashboardViewModel;
    private readonly CharactersViewModel _charactersViewModel;

    private readonly CharacterService _characterService;
    private CancellationTokenSource? _gameChangeCancellation;


    [ObservableProperty]
    private string _gameLoadingError = string.Empty;
    [ObservableProperty]
    private GameId _selectedGame = GameId.Poe1;

    [ObservableProperty]
    private ObservableObject _currentViewModel;

    public MainViewModel(
        DashboardViewModel dashboardViewModel,
        CharactersViewModel charactersViewModel,
        CharacterService characterService)
    {
        _dashboardViewModel = dashboardViewModel;
        _charactersViewModel = charactersViewModel;
        _characterService = characterService;
        CurrentViewModel = _dashboardViewModel;
    }

    [RelayCommand]
    private void NavigateToDashboard()
    {
        CurrentViewModel = _dashboardViewModel;
    }

    [RelayCommand]
    private void NavigateToCharacters()
    {
        CurrentViewModel = _charactersViewModel;
    }

    partial void OnSelectedGameChanged(GameId value)
    {
        _gameChangeCancellation?.Cancel();

        GameLoadingError = string.Empty;

        var cancellation = new CancellationTokenSource();
        _gameChangeCancellation = cancellation;

        _ = ChangeGameAsync(value, cancellation);
    }

    private async Task ChangeGameAsync(GameId gameId, CancellationTokenSource cancellation)
    {
        CancellationToken token = cancellation.Token;

        // TODO:
        try
        {
            // 1. Load characters for the requested game.
            await _characterService.LoadCharactersAsync(gameId, token);

            token.ThrowIfCancellationRequested();
            // 2. Write a Debug message when loading finishes.
            System.Diagnostics.Debug.WriteLine($"Finished loading characters for game: {gameId}");
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


