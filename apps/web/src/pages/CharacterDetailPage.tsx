import { useOutletContext, useParams } from "react-router-dom";
import type { GameId } from "@exile-companion/contracts";

function CharacterDetailPage() {
  const gameId = useOutletContext<GameId>();
  const { characterId } = useParams();
  const gameName = gameId === "poe1" ? "Path of Exile 1" : "Path of Exile 2";

  return (
    <main>
      <h1>{gameName} Character</h1>
      <p>Character detail placeholder for {characterId}.</p>
    </main>
  );
}

export default CharacterDetailPage;
