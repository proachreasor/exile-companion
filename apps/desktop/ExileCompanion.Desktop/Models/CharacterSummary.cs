using System;
using System.Collections.Generic;
using System.Text;

namespace ExileCompanion.Desktop.Models;

/// <summary>
/// Represents condensed character details for display scenarios.
/// </summary>
/// <param name="name">The character name.</param>
/// <param name="characterClass">The character class.</param>
/// <param name="level">The character level.</param>
public sealed class CharacterSummary(
    string name,
    string characterClass,
    int level
)
{
    /// <summary>
    /// Gets the character name.
    /// </summary>
    public string Name { get; } = name;

    /// <summary>
    /// Gets the character class.
    /// </summary>
    public string CharacterClass { get; } = characterClass;

    /// <summary>
    /// Gets the character level.
    /// </summary>
    public int Level { get; } = level;
}

