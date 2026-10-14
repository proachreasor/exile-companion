import { Link, Outlet, useParams } from "react-router-dom";
import type { GameId } from "@exile-companion/contracts";
import GameSelector from "../components/GameSelector";
import NotFoundPage from "./NotFoundPage";

function isGameId(value: string | undefined): value is GameId {
  return value === "poe1" || value === "poe2";
}

function GameLayout() {
  const { gameId } = useParams();

  if (!isGameId(gameId)) {
    return <NotFoundPage />;
  }

  return (
    <div className="app-shell">
      <header className="app-header">
        <Link to="/">Exile Companion</Link>
        <GameSelector gameId={gameId} />
      </header>
      <Outlet context={gameId} />
    </div>
  );
}

export default GameLayout;
