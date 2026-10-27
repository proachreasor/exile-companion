import type { Character } from "@exile-companion/contracts";

export type CharacterSort =
  | "level-desc"
  | "level-asc"
  | "name-asc"
  | "name-desc";

export interface CharacterListFilters {
  search: string;
  characterClass: string;
  league: string;
  sort: CharacterSort;
}

export interface CharacterListResults {
  classes: string[];
  leagues: string[];
  characters: Character[];
}

function compareText(left: string, right: string): number {
  return (
    left.localeCompare(right, undefined, { sensitivity: "base" }) ||
    left.localeCompare(right)
  );
}

function compareIds(left: Character, right: Character): number {
  return compareText(left.id, right.id);
}

export function deriveCharacterList(
  characters: readonly Character[],
  filters: CharacterListFilters,
): CharacterListResults {
  const classes = [
    ...new Set(characters.map((character) => character.characterClass)),
  ].sort(compareText);
  const leagues = [
    ...new Set(characters.map((character) => character.league)),
  ].sort(compareText);
  const search = filters.search.trim().toLocaleLowerCase();

  const filtered = characters.filter((character) => {
    const matchesSearch = character.name.toLocaleLowerCase().includes(search);
    const matchesClass =
      filters.characterClass === "" ||
      character.characterClass === filters.characterClass;
    const matchesLeague =
      filters.league === "" || character.league === filters.league;

    return matchesSearch && matchesClass && matchesLeague;
  });

  const sorted = [...filtered].sort((left, right) => {
    switch (filters.sort) {
      case "level-desc":
        return (
          right.level - left.level ||
          compareText(left.name, right.name) ||
          compareIds(left, right)
        );
      case "level-asc":
        return (
          left.level - right.level ||
          compareText(left.name, right.name) ||
          compareIds(left, right)
        );
      case "name-asc":
        return compareText(left.name, right.name) || compareIds(left, right);
      case "name-desc":
        return compareText(right.name, left.name) || compareIds(left, right);
    }
  });

  return { classes, leagues, characters: sorted };
}
