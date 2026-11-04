
using CommunityToolkit.Mvvm.ComponentModel;
using ExileCompanion.Desktop.Services;

namespace ExileCompanion.Desktop.ViewModels;

/// <summary>
/// Represents dashboard statistics derived from loaded characters.
/// </summary>
public partial class DashboardViewModel : ObservableObject
{
    /// <summary>
    /// The character service providing source data.
    /// </summary>
    private readonly CharacterService _characterService;

    /// <summary>
    /// Initializes a new instance of the <see cref="DashboardViewModel"/> class.
    /// </summary>
    /// <param name="characterService">The character service dependency.</param>
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
    /// <summary>
    /// Gets the total number of loaded characters.
    /// </summary>
    public int CharacterCount => _characterService.Characters.Count;

    // TODO: HighestCharacterLevel
    /// <summary>
    /// Gets the highest level among loaded characters.
    /// </summary>
    public int HighestCharacterLevel => 
        _characterService.Characters.Count == 0 
        ? 0 
        : _characterService.Characters.Max(character => character.Level);
}
