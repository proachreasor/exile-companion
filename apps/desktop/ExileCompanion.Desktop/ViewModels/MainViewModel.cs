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
    private readonly CharacterDetailViewModel _characterDetailViewModel;

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

    [RelayCommand]
    private void NavigateToDashboard()
    {
        CurrentViewModel = _dashboardViewModel;
    }

    [RelayCommand]
    private void NavigateToCharacters()
    {
        _charactersViewModel.SelectedCharacter = null;
        CurrentViewModel = _charactersViewModel;
    }

    private void NavigateToCharacterDetail(Character character)
    {
        _characterDetailViewModel.LoadCharacter(character);
        CurrentViewModel = _characterDetailViewModel;
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


