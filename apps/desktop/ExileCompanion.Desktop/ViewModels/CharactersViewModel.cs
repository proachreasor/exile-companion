using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;
using ExileCompanion.Desktop.Models;
using ExileCompanion.Desktop.Services;
using System.Collections.ObjectModel;
using System.IO;

namespace ExileCompanion.Desktop.ViewModels
{
    public partial class CharactersViewModel : ObservableObject
    {
        private readonly CharacterService _characterService;

        public ObservableCollection<Character> Characters => _characterService.Characters;

        // TODO: Add SelectedCharacter
        [ObservableProperty]
        private Character? _selectedCharacter;

        // TODO: Add StatusMessage
        [ObservableProperty]
        private string _statusMessage = "Ready";

        public CharactersViewModel(CharacterService characterService)
        {
            _characterService = characterService;
        }

        [RelayCommand]
        private async Task RefreshCharactersAsync()
        {

            try
            {
                // TODO: Set the loading status.
                StatusMessage = "Loading characters...";

                // TODO: Await CharacterService.LoadCharactersAsync().
                await _characterService.LoadCharactersAsync(GameId.Poe1);

                // TODO: Set the success status.
                StatusMessage = "Characters loaded successfully.";
            }
            catch (IOException ex)
            {
                StatusMessage = $"Error loading characters: {ex.Message}";
            }
            catch (System.Text.Json.JsonException ex)
            {
                StatusMessage = $"Error parsing character data: {ex.Message}";
            }
            catch (OperationCanceledException)
            {
                StatusMessage = "Character loading canceled.";
            }
        }
    }
}
