interface CharacterFavoriteButtonProps {
  characterName: string;
  isFavorite: boolean;
  disabled: boolean;
  onToggle: () => void;
}

function CharacterFavoriteButton({
  characterName,
  isFavorite,
  disabled,
  onToggle,
}: CharacterFavoriteButtonProps) {
  return (
    <button
      type="button"
      aria-label={`Favorite ${characterName}`}
      aria-pressed={isFavorite}
      disabled={disabled}
      onClick={onToggle}
    >
      Favorite
    </button>
  );
}

export default CharacterFavoriteButton;