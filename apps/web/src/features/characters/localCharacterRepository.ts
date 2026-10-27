import characterData from "@exile-companion/character-data";
import type { Character, GameId } from "@exile-companion/contracts";
import type { CharacterRepository } from "./characterRepository";

export class LocalCharacterRepository implements CharacterRepository {
  async getCharacters(gameId: GameId): Promise<Character[]> {
    return characterData[gameId].map((character) => ({
      ...character,
    }));
  }

  async getCharacter(
    gameId: GameId,
    characterId: string,
  ): Promise<Character | null> {
    const character = characterData[gameId].find(
      (character) => character.id === characterId,
    );

    return character ? { ...character } : null;
  }
}