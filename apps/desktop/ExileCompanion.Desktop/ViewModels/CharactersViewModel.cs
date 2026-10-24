using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;
using ExileCompanion.Desktop.Models;
using ExileCompanion.Desktop.Services;
using System.Collections.ObjectModel;

namespace ExileCompanion.Desktop.ViewModels
{
    public partial class CharactersViewModel : ObservableObject
    {
        private readonly CharacterService _characterService;

        public ObservableCollection<CharacterSummary> Characters => _characterService.Characters;

        // TODO: Add SelectedCharacter
        [ObservableProperty]
        private CharacterSummary? _selectedCharacter;

        // TODO: Add StatusMessage
        [ObservableProperty]
        private string _statusMessage = "Ready";        

        public CharactersViewModel(CharacterService characterService)
        {
            _characterService = characterService;
        }

        // TODO: Implement RefreshCharactersCommand
        [RelayCommand]
        private void RefreshCharacters()
        {
            _characterService.AddCharacter(new CharacterSummary(
                "NewExile",
                "Witch",
                Random.Shared.Next(1, 100)
            ));

            StatusMessage = "Characters refreshed";
        }

    }
}
