using CommunityToolkit.Mvvm.ComponentModel;
using ExileCompanion.Desktop.Models;
using System;
using System.Collections.Generic;
using System.Collections.ObjectModel;
using System.Text;

namespace ExileCompanion.Desktop.Services
{
    public sealed class CharacterService
    {
        public ObservableCollection<CharacterSummary> Characters { get; } = new();

        public CharacterService()
        {
            Characters.Add(new CharacterSummary(
                "ExileWarrior", "Marauder", 82));
            Characters.Add(new CharacterSummary(
                "ShadowHunter", "Shadow", 74));
        }

        public void AddCharacter(CharacterSummary character)
        {
            Characters.Add(character);
        }
    }
}
