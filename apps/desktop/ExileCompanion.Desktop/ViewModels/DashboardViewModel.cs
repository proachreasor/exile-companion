
using CommunityToolkit.Mvvm.ComponentModel;
using ExileCompanion.Desktop.Services;

namespace ExileCompanion.Desktop.ViewModels;

public partial class DashboardViewModel : ObservableObject
{
    private readonly CharacterService _characterService;

    public DashboardViewModel(CharacterService characterService)
    {
        _characterService = characterService;


        // TODO: Subscribe to collection changes
        _characterService.Characters.CollectionChanged += (_, _) =>
        {
            OnPropertyChanged(nameof(HighestCharacterLevel));
            OnPropertyChanged(nameof(CharacterCount));
        };
    }

    // TODO: CharacterCount
    public int CharacterCount => _characterService.Characters.Count;

    // TODO: HighestCharacterLevel
    public int HighestCharacterLevel => 
        _characterService.Characters.Count == 0 
        ? 0 
        : _characterService.Characters.Max(character => character.Level);
}
