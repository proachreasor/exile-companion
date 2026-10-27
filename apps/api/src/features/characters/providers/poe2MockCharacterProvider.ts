import characters from "@exile-companion/character-data" with { type: "json" };
import type { Character } from "@exile-companion/contracts";
import type { CharacterProvider } from "../characterProvider.js";

const poe2Characters: Character[] = characters.poe2;

export class Poe2MockCharacterProvider implements CharacterProvider {
  async getCharacters(): Promise<Character[]> {
    return [...poe2Characters];
  }

  async getCharacter(characterId: string): Promise<Character | null> {
    return (
      poe2Characters.find((character) => character.id === characterId) ?? null
    );
  }
}
