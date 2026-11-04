using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;
using ExileCompanion.Desktop.Models;
using ExileCompanion.Desktop.Services;
using System.Collections.ObjectModel;
using System.ComponentModel;
using System.IO;
using System.ComponentModel;
using System.Windows.Data;

namespace ExileCompanion.Desktop.ViewModels
{
    /// <summary>
    /// Represents character list presentation, filtering, and sorting behavior.
    /// </summary>
    public partial class CharactersViewModel : ObservableObject
    {
        /// <summary>
        /// The service used to load and store character data.
        /// </summary>
        private readonly CharacterService _characterService;

        /// <summary>
        /// Gets or sets the callback invoked when a character is selected.
        /// </summary>
        public Action<Character>? CharacterSelected { get; set; }

        /// <summary>
        /// Gets the character collection.
        /// </summary>
        public ObservableCollection<Character> Characters => _characterService.Characters;

        /// <summary>
        /// Backing field for the currently selected character.
        /// </summary>
        // TODO: Add SelectedCharacter
        [ObservableProperty]
        private Character? _selectedCharacter;

        /// <summary>
        /// Backing field for the status message shown in the UI.
        /// </summary>
        // TODO: Add StatusMessage
        [ObservableProperty]
        private string _statusMessage = "Ready";

        /// <summary>
        /// Gets the filtered view over <see cref="Characters"/>.
        /// </summary>
        public ICollectionView FilteredCharacters { get; }

        /// <summary>
        /// Backing field for the current search text.
        /// </summary>
        [ObservableProperty]
        private string _searchText = string.Empty;

        /// <summary>
        /// Gets the available class filter options.
        /// </summary>
        public ObservableCollection<string> AvailableClasses { get; } = new();

        /// <summary>
        /// Backing field for the selected class filter.
        /// </summary>
        [ObservableProperty]
        private string _selectedClass = "All Classes";

        /// <summary>
        /// Gets the available sorting options displayed in the UI.
        /// </summary>
        public IReadOnlyList<string> SortOptions { get; } =
        [
            "Level (Highest First)",
            "Level (Lowest First)",
            "Name (A-Z)",
            "Name (Z-A)"
        ];

        /// <summary>
        /// Backing field for the selected sort option.
        /// </summary>
        [ObservableProperty]
        private string _selectedSort = "Level (Highest First)";

        /// <summary>
        /// Initializes a new instance of the <see cref="CharactersViewModel"/> class.
        /// </summary>
        /// <param name="characterService">The character service dependency.</param>
        public CharactersViewModel(CharacterService characterService)
        {
            _characterService = characterService;
            FilteredCharacters =
            CollectionViewSource.GetDefaultView(_characterService.Characters);

            FilteredCharacters.Filter = FilterCharacter;

            UpdateAvailableClasses();

            Characters.CollectionChanged += (_, _) =>
            {
                UpdateAvailableClasses();
            };

            ApplySorting();
        }

        /// <summary>
        /// Handles selected character changes.
        /// </summary>
        /// <param name="value">The newly selected character.</param>
        partial void OnSelectedCharacterChanged(Character? value)
        {
            if (value is not null)
            {
                CharacterSelected?.Invoke(value);
            }
        }

        /// <summary>
        /// Reloads characters from the backing service.
        /// </summary>
        [RelayCommand]
        private async Task RefreshCharactersAsync()
        {

            try
            {
                StatusMessage = "Loading characters...";

                await _characterService.LoadCharactersAsync(_characterService.CurrentGame);

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

        /// <summary>
        /// Handles selected class changes by refreshing the filtered view.
        /// </summary>
        /// <param name="value">The selected class value.</param>
        partial void OnSelectedClassChanged(string value)
        {
            FilteredCharacters.Refresh();
        }


        /// <summary>
        /// Determines whether a list item matches active search and class filters.
        /// </summary>
        /// <param name="item">The item to evaluate.</param>
        /// <returns><see langword="true"/> when the item should be visible; otherwise, <see langword="false"/>.</returns>
        private bool FilterCharacter(object item)
        {
            if (item is not Character character)
                return false;

            bool matchesSearch =
                string.IsNullOrWhiteSpace(SearchText) ||
                character.Name.Contains(SearchText, StringComparison.OrdinalIgnoreCase) ||
                character.CharacterClass.Contains(SearchText, StringComparison.OrdinalIgnoreCase);

            // TODO:
            // Create matchesClass:
            // - true if SelectedClass is "All Classes"
            // - true if character.CharacterClass matches SelectedClass
            // - false otherwise
            bool matchesClass = SelectedClass == "All Classes" || character.CharacterClass == SelectedClass;

            return matchesSearch && matchesClass;
        }

        /// <summary>
        /// Handles search text changes by refreshing the filtered view.
        /// </summary>
        /// <param name="value">The updated search text.</param>
        partial void OnSearchTextChanged(string value)
        {
            FilteredCharacters.Refresh();
        }

        /// <summary>
        /// Rebuilds the available character class options.
        /// </summary>
        private void UpdateAvailableClasses()
        {
            AvailableClasses.Clear();
            AvailableClasses.Add("All Classes");

            // TODO:

            // 1. Get the distinct CharacterClass values from Characters.
            string[] distinctClasses = Characters.Select(c => c.CharacterClass).Distinct().ToArray();
            // 2. Sort them alphabetically.
            Array.Sort(distinctClasses, StringComparer.OrdinalIgnoreCase);
            // 3. Add each class to AvailableClasses.
            foreach (var characterClass in distinctClasses)
            {
                AvailableClasses.Add(characterClass);
            }
            // 4. Reset SelectedClass to "All Classes".
            SelectedClass = "All Classes";
        }

        /// <summary>
        /// Applies sort rules to the filtered character view.
        /// </summary>
        private void ApplySorting()
        {
            FilteredCharacters.SortDescriptions.Clear();

            // TODO:
            // 1. Determine which property to sort by.
            // 2. Determine ascending or descending direction.
            // 3. Add a SortDescription to FilteredCharacters.
            string propertyName;
            ListSortDirection direction;

            switch (SelectedSort)
            {
                case "Level (Highest First)":
                    propertyName = nameof(Character.Level);
                    direction = ListSortDirection.Descending;
                    break;
                case "Level (Lowest First)":
                    propertyName = nameof(Character.Level);
                    direction = ListSortDirection.Ascending;
                    break;
                case "Name (A-Z)":
                    propertyName = nameof(Character.Name);
                    direction = ListSortDirection.Ascending;
                    break;
                case "Name (Z-A)":
                    propertyName = nameof(Character.Name);
                    direction = ListSortDirection.Descending;
                    break;
                default:
                    propertyName = nameof(Character.Level);
                    direction = ListSortDirection.Descending;
                    break;
            }

            FilteredCharacters.SortDescriptions.Add( new SortDescription(
                propertyName,
                direction));

            if (propertyName == nameof(Character.Level))
            {
                FilteredCharacters.SortDescriptions.Add(
                    new SortDescription(
                        nameof(Character.Name),
                        ListSortDirection.Ascending));
            }
            else
            {
                FilteredCharacters.SortDescriptions.Add(
                    new SortDescription(
                        nameof(Character.Id),
                        ListSortDirection.Ascending));
            }
        }

        /// <summary>
        /// Handles selected sort changes by reapplying sort rules.
        /// </summary>
        /// <param name="value">The selected sort option.</param>
        partial void OnSelectedSortChanged(string value)
        {
            ApplySorting();
        }
    }
}
