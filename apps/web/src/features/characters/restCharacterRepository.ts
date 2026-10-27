import { ApiError, getCharacter, getCharacters } from "../../api/characters";
import type { Character, GameId } from "@exile-companion/contracts";
import type { CharacterRepository } from "./characterRepository";

export class RestCharacterRepository implements CharacterRepository {
  getCharacters(
    gameId: GameId,
    signal?: AbortSignal,
  ): Promise<Character[]> {
    return getCharacters(gameId, signal);
  }

  async getCharacter(
    gameId: GameId,
    characterId: string,
    signal?: AbortSignal,
  ): Promise<Character | null> {
    try {
      return await getCharacter(gameId, characterId, signal);
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) {
        return null;
      }

      throw error;
    }
  }
}
