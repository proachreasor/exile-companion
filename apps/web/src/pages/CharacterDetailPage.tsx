import { Link, useOutletContext, useParams } from "react-router-dom";
import type { GameId } from "@exile-companion/contracts";
import CharacterFavoriteButton from "../features/characters/CharacterFavoriteButton";
import {
  useFavoriteIds,
  useIsFavoriteMutationPending,
  useSetFavorite,
} from "../features/characters/favoriteQueries";
import { useCharacter } from "../features/characters/characterQueries";

function CharacterDetailPage() {
  const gameId = useOutletContext<GameId>();
  const { characterId } = useParams();
  const gameName = gameId === "poe1" ? "Path of Exile 1" : "Path of Exile 2";
  const query = useCharacter(gameId, characterId);
  const favoritesQuery = useFavoriteIds(gameId);
  const favoriteMutation = useSetFavorite(gameId);
  const favoriteMutationPending = useIsFavoriteMutationPending(gameId);
  const character = query.data ?? null;

  return (
    <main>
      <h1>{gameName} Character</h1>
      {!characterId && (
        <>
          <p>Character not found.</p>
          <Link to={`/${gameId}/characters`}>Back to characters</Link>
        </>
      )}
      {characterId && query.isPending && (
        <p role="status">Loading character...</p>
      )}
      {characterId && query.isSuccess && query.data === null && (
        <>
          <p>Character not found.</p>
          <Link to={`/${gameId}/characters`}>Back to characters</Link>
        </>
      )}
      {characterId && query.isError && (
        <p role="alert">Unable to load character. Please try again.</p>
      )}
      {favoritesQuery.isError && (
        <p role="alert">Unable to load favorites. Please try again.</p>
      )}
      {favoriteMutation.isError && (
        <p role="alert">Unable to update favorites. Please try again.</p>
      )}
      {characterId && query.isSuccess && character !== null && (
        <dl>
          <dt>Name</dt>
          <dd>{character.name}</dd>
          <dt>Class</dt>
          <dd>{character.characterClass}</dd>
          <dt>Level</dt>
          <dd>{character.level}</dd>
          <dt>League</dt>
          <dd>{character.league}</dd>
        </dl>
      )}
      {characterId && query.isSuccess && character !== null && (
        <CharacterFavoriteButton
          characterName={character.name}
          isFavorite={favoritesQuery.data?.includes(character.id) ?? false}
          disabled={
            favoritesQuery.isPending ||
            favoritesQuery.isError ||
            favoriteMutationPending
          }
          onToggle={() =>
            favoriteMutation.mutate({
              characterId: character.id,
              isFavorite: !favoritesQuery.data?.includes(character.id),
            })
          }
        />
      )}
    </main>
  );
}

export default CharacterDetailPage;
