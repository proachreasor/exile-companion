import type { Character } from "@exile-companion/contracts";
import type { CharacterProvider } from "../characterProvider.js";

const characters: Character[] = [
  {
    id: "poe1-marauder-01",
    name: "AshenMarauder",
    gameId: "poe1",
    characterClass: "Marauder",
    level: 92,
    league: "Standard",
  },
  {
    id: "poe1-ranger-01",
    name: "VerdantArrow",
    gameId: "poe1",
    characterClass: "Ranger",
    level: 84,
    league: "Standard",
  },
];

export class Poe1MockCharacterProvider implements CharacterProvider {
  async getCharacters(): Promise<Character[]> {
    return [...characters];
  }

  async getCharacter(characterId: string): Promise<Character | null> {
    return characters.find((character) => character.id === characterId) ?? null;
  }
}
