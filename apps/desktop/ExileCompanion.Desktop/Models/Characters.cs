namespace ExileCompanion.Desktop.Models
{
    /// <summary>
    /// Represents a Path of Exile character.
    /// </summary>
    /// <param name="Id">The unique identifier of the character.</param>
    /// <param name="Name">The display name of the character.</param>
    /// <param name="GameId">The game version the character belongs to.</param>
    /// <param name="CharacterClass">The class name of the character.</param>
    /// <param name="Level">The character level.</param>
    /// <param name="League">The league name for the character.</param>
    public sealed record Character(
        string Id,
        string Name,
        GameId GameId,
        string CharacterClass,
        int Level,
        string League
    );
}
