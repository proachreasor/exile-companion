namespace ExileCompanion.Desktop.Models
{
    public sealed record Character(
        string Id,
        string Name,
        GameId GameId,
        string CharacterClass,
        int Level,
        string League
    );
}
