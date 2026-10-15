import type { Character, GameId } from "@exile-companion/contracts";
import type { CharacterProvider } from "./characterProvider.js";
import { Poe1MockCharacterProvider } from "./providers/poe1MockCharacterProvider.js";
import { Poe2MockCharacterProvider } from "./providers/poe2MockCharacterProvider.js";

export class CharacterService {
  constructor(
    private readonly poe1Provider: CharacterProvider = new Poe1MockCharacterProvider(),
    private readonly poe2Provider: CharacterProvider = new Poe2MockCharacterProvider(),
  ) {}

  async getCharacters(gameId: GameId): Promise<Character[]> {
    return this.getProvider(gameId).getCharacters();
  }

  async getCharacter(
    gameId: GameId,
    characterId: string,
  ): Promise<Character | null> {
    return this.getProvider(gameId).getCharacter(characterId);
  }

  private getProvider(gameId: GameId): CharacterProvider {
    switch (gameId) {
      case "poe1":
        return this.poe1Provider;
      case "poe2":
        return this.poe2Provider;
    }
  }
}
