import { useState } from "react";
import { Link, useOutletContext } from "react-router-dom";
import type { GameId } from "@exile-companion/contracts";
import {
  deriveCharacterList,
  type CharacterSort,
} from "../features/characters/characterListUtils";
import { useCharacters } from "../features/characters/characterQueries";

function isCharacterSort(value: string): value is CharacterSort {
  return (
    value === "level-desc" ||
    value === "level-asc" ||
    value === "name-asc" ||
    value === "name-desc"
  );
}

function CharacterListPage() {
  const gameId = useOutletContext<GameId>();
  const gameName = gameId === "poe1" ? "Path of Exile 1" : "Path of Exile 2";
  const query = useCharacters(gameId);
  const [search, setSearch] = useState("");
  const [characterClass, setCharacterClass] = useState("");
  const [league, setLeague] = useState("");
  const [sort, setSort] = useState<CharacterSort>("level-desc");

  const characters = query.data ?? [];
  const results = deriveCharacterList(characters, {
    search,
    characterClass,
    league,
    sort,
  });
  const selectedClassUnavailable =
    characterClass !== "" && !results.classes.includes(characterClass);
  const selectedLeagueUnavailable =
    league !== "" && !results.leagues.includes(league);

  function resetFilters() {
    setSearch("");
    setCharacterClass("");
    setLeague("");
    setSort("level-desc");
  }

  return (
    <main>
      <h1>{gameName} Characters</h1>
      {query.isPending && <p role="status">Loading characters...</p>}
      {query.isError && (
        <p role="alert">Unable to load characters. Please try again.</p>
      )}
      {query.isSuccess && characters.length === 0 && (
        <p>No characters found.</p>
      )}
      {query.isSuccess && characters.length > 0 && (
        <>
          <div className="character-list-controls">
            <label>
              Search characters
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.currentTarget.value)}
              />
            </label>
            <label>
              Class
              <select
                value={characterClass}
                onChange={(event) =>
                  setCharacterClass(event.currentTarget.value)
                }
              >
                <option value="">All classes</option>
                {selectedClassUnavailable && (
                  <option value={characterClass}>
                    {characterClass} (unavailable)
                  </option>
                )}
                {results.classes.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>
            <label>
              League
              <select
                value={league}
                onChange={(event) => setLeague(event.currentTarget.value)}
              >
                <option value="">All leagues</option>
                {selectedLeagueUnavailable && (
                  <option value={league}>{league} (unavailable)</option>
                )}
                {results.leagues.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Sort characters
              <select
                value={sort}
                onChange={(event) => {
                  const value = event.currentTarget.value;
                  if (isCharacterSort(value)) {
                    setSort(value);
                  }
                }}
              >
                <option value="level-desc">Level: high to low</option>
                <option value="level-asc">Level: low to high</option>
                <option value="name-asc">Name: A to Z</option>
                <option value="name-desc">Name: Z to A</option>
              </select>
            </label>
            <button type="button" onClick={resetFilters}>
              Reset
            </button>
          </div>
          <p role="status">
            {results.characters.length} of {characters.length} characters
          </p>
          {results.characters.length === 0 ? (
            <p>No characters match your filters.</p>
          ) : (
            <ul>
              {results.characters.map((character) => (
                <li key={character.id}>
                  <Link
                    to={`/${gameId}/characters/${encodeURIComponent(character.id)}`}
                  >
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
        </>
      )}
    </main>
  );
}

export default CharacterListPage;
