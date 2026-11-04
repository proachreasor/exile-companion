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
    public partial class CharactersViewModel : ObservableObject
    {
        private readonly CharacterService _characterService;

        public Action<Character>? CharacterSelected { get; set; }

        public ObservableCollection<Character> Characters => _characterService.Characters;

        // TODO: Add SelectedCharacter
        [ObservableProperty]
        private Character? _selectedCharacter;

        // TODO: Add StatusMessage
        [ObservableProperty]
        private string _statusMessage = "Ready";

        public ICollectionView FilteredCharacters { get; }

        [ObservableProperty]
        private string _searchText = string.Empty;

        public ObservableCollection<string> AvailableClasses { get; } = new();

        [ObservableProperty]
        private string _selectedClass = "All Classes";

        public IReadOnlyList<string> SortOptions { get; } =
        [
            "Level (Highest First)",
            "Level (Lowest First)",
            "Name (A-Z)",
            "Name (Z-A)"
        ];

        [ObservableProperty]
        private string _selectedSort = "Level (Highest First)";

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

        partial void OnSelectedCharacterChanged(Character? value)
        {
            if (value is not null)
            {
                CharacterSelected?.Invoke(value);
            }
        }

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

        partial void OnSelectedClassChanged(string value)
        {
            FilteredCharacters.Refresh();
        }


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

        partial void OnSearchTextChanged(string value)
        {
            FilteredCharacters.Refresh();
        }

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

        partial void OnSelectedSortChanged(string value)
        {
            ApplySorting();
        }
    }
}
