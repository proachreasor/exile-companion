import { Route, Routes } from "react-router-dom";
import CharacterDetailPage from "./pages/CharacterDetailPage";
import CharacterListPage from "./pages/CharacterListPage";
import DashboardPage from "./pages/DashboardPage";
import GameLayout from "./pages/GameLayout";
import HomePage from "./pages/HomePage";
import NotFoundPage from "./pages/NotFoundPage";

function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path=":gameId" element={<GameLayout />}>
        <Route index element={<DashboardPage />} />
        <Route path="characters" element={<CharacterListPage />} />
        <Route
          path="characters/:characterId"
          element={<CharacterDetailPage />}
        />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

export default App;
