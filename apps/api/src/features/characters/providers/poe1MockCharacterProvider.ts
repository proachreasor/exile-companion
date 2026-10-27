import characters from "@exile-companion/character-data" with { type: "json" };
import type { Character } from "@exile-companion/contracts";
import type { CharacterProvider } from "../characterProvider.js";

const poe1Characters: Character[] = characters.poe1;

export class Poe1MockCharacterProvider implements CharacterProvider {
  async getCharacters(): Promise<Character[]> {
    return [...poe1Characters];
  }

  async getCharacter(characterId: string): Promise<Character | null> {
    return (
      poe1Characters.find((character) => character.id === characterId) ?? null
    );
  }
}
