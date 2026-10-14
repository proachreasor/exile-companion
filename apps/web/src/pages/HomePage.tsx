import { Link } from "react-router-dom";

function HomePage() {
  return (
    <main>
      <h1>Exile Companion</h1>
      <p>Choose a game to open its dashboard.</p>
      <nav aria-label="Choose a game">
        <ul>
          <li>
            <Link to="/poe1">Path of Exile 1</Link>
          </li>
          <li>
            <Link to="/poe2">Path of Exile 2</Link>
          </li>
        </ul>
      </nav>
    </main>
  );
}

export default HomePage;
