import { Link, useOutletContext } from "react-router-dom";
import type { GameId } from "@exile-companion/contracts";

function CharacterListPage() {
  const gameId = useOutletContext<GameId>();
  const gameName = gameId === "poe1" ? "Path of Exile 1" : "Path of Exile 2";

  return (
    <main>
      <h1>{gameName} Characters</h1>
      <p>Character list placeholder.</p>
      <Link to={`/${gameId}/characters/example`}>View example character</Link>
    </main>
  );
}

export default CharacterListPage;
