import type { Character, GameId } from "@exile-companion/contracts";

export interface CharacterRepository {
  getCharacters(gameId: GameId, signal?: AbortSignal): Promise<Character[]>;
  getCharacter(
    gameId: GameId,
    characterId: string,
    signal?: AbortSignal,
  ): Promise<Character | null>;
}
