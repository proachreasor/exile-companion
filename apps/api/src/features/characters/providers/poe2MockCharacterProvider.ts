import type { Character } from "@exile-companion/contracts";
import type { CharacterProvider } from "../characterProvider.js";

const characters: Character[] = [
  {
    id: "poe2-sorceress-01",
    name: "FrostboundSage",
    gameId: "poe2",
    characterClass: "Sorceress",
    level: 76,
    league: "Standard",
  },
  {
    id: "poe2-warrior-01",
    name: "StoneSentinel",
    gameId: "poe2",
    characterClass: "Warrior",
    level: 68,
    league: "Standard",
  },
];

export class Poe2MockCharacterProvider implements CharacterProvider {
  async getCharacters(): Promise<Character[]> {
    return [...characters];
  }

  async getCharacter(characterId: string): Promise<Character | null> {
    return characters.find((character) => character.id === characterId) ?? null;
  }
}
