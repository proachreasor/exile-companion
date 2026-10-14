import type { ChangeEvent } from "react";
import { useLocation, useMatch, useNavigate } from "react-router-dom";
import type { GameId } from "@exile-companion/contracts";

interface GameSelectorProps {
  gameId: GameId;
}

function GameSelector({ gameId }: GameSelectorProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const isCharacterDetail =
    useMatch("/:gameId/characters/:characterId") !== null;

  function handleChange(event: ChangeEvent<HTMLSelectElement>) {
    const nextGameId = event.currentTarget.value;
    if (nextGameId !== "poe1" && nextGameId !== "poe2") {
      return;
    }

    const gamePath = isCharacterDetail
      ? `/${nextGameId}/characters`
      : `/${nextGameId}${location.pathname.slice(`/${gameId}`.length)}`;
    navigate(gamePath);
  }

  return (
    <label>
      Game
      <select aria-label="Game" value={gameId} onChange={handleChange}>
        <option value="poe1">Path of Exile 1</option>
        <option value="poe2">Path of Exile 2</option>
      </select>
    </label>
  );
}

export default GameSelector;
