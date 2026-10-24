using System;
using System.Collections.Generic;
using System.Text;

namespace ExileCompanion.Desktop.Models;

public sealed class CharacterSummary(
    string name,
    string characterClass,
    int level
)
{
    public string Name { get; } = name;
    public string CharacterClass { get; } = characterClass;
    public int Level { get; } = level;
}

