import { Link, useOutletContext } from "react-router-dom";
import type { GameId } from "@exile-companion/contracts";

function DashboardPage() {
  const gameId = useOutletContext<GameId>();
  const gameName = gameId === "poe1" ? "Path of Exile 1" : "Path of Exile 2";

  return (
    <main>
      <h1>{gameName} Dashboard</h1>
      <p>Dashboard placeholder.</p>
      <Link to={`/${gameId}/characters`}>View characters</Link>
    </main>
  );
}

export default DashboardPage;
