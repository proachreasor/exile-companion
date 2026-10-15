import type { Character } from "@exile-companion/contracts";

export interface CharacterProvider {
  getCharacters(): Promise<Character[]>;
  getCharacter(characterId: string): Promise<Character | null>;
}
