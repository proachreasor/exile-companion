namespace ExileCompanion.Desktop.Models;

/// <summary>
/// Represents persisted favorite character data.
/// </summary>
public sealed class FavoritesData
{
    /// <summary>
    /// Gets or sets the schema version for the favorites payload.
    /// </summary>
    public int Version { get; set; } = 1;

    /// <summary>
    /// Gets or sets the list of favorite character identifiers.
    /// </summary>
    public List<string> FavoriteIds { get; set; } = new();
}