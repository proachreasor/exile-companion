import { Link, useOutletContext, useParams } from "react-router-dom";
import type { GameId } from "@exile-companion/contracts";
import { useCharacter } from "../features/characters/characterQueries";

function CharacterDetailPage() {
  const gameId = useOutletContext<GameId>();
  const { characterId } = useParams();
  const gameName = gameId === "poe1" ? "Path of Exile 1" : "Path of Exile 2";
  const query = useCharacter(gameId, characterId);

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
      {characterId && query.isSuccess && query.data !== null && (
        <dl>
          <dt>Name</dt>
          <dd>{query.data.name}</dd>
          <dt>Class</dt>
          <dd>{query.data.characterClass}</dd>
          <dt>Level</dt>
          <dd>{query.data.level}</dd>
          <dt>League</dt>
          <dd>{query.data.league}</dd>
        </dl>
      )}
    </main>
  );
}

export default CharacterDetailPage;
