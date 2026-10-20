import { Link, useOutletContext } from "react-router-dom";
import type { GameId } from "@exile-companion/contracts";
import { useCharacters } from "../features/characters/characterQueries";

function CharacterListPage() {
  const gameId = useOutletContext<GameId>();
  const gameName = gameId === "poe1" ? "Path of Exile 1" : "Path of Exile 2";
  const query = useCharacters(gameId);

  return (
    <main>
      <h1>{gameName} Characters</h1>
      {query.isPending && <p role="status">Loading characters...</p>}
      {query.isError && (
        <p role="alert">Unable to load characters. Please try again.</p>
      )}
      {query.isSuccess && query.data.length === 0 && (
        <p>No characters found.</p>
      )}
      {query.isSuccess && query.data.length > 0 && (
        <ul>
          {query.data.map((character) => (
            <li key={character.id}>
              <Link to={`/${gameId}/characters/${character.id}`}>
                {character.name}
              </Link>
              <span>
                {" "}
                — {character.characterClass}, level {character.level},{" "}
                {character.league}
              </span>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}

export default CharacterListPage;
