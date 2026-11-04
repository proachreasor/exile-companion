namespace ExileCompanion.Desktop.Models;

public sealed class FavoritesData
{
    public int Version { get; set; } = 1;

    public List<string> FavoriteIds { get; set; } = new();
}