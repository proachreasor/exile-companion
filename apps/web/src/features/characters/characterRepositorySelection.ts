import { LocalCharacterRepository } from "./localCharacterRepository";
import type { CharacterRepository } from "./characterRepository";
import { RestCharacterRepository } from "./restCharacterRepository";

export function createCharacterRepository(
  source: string | undefined,
): CharacterRepository {
  switch (source) {
    case undefined:
    case "":
    case "local":
      return new LocalCharacterRepository();
    case "rest":
      return new RestCharacterRepository();
    default:
      throw new Error(
        `Invalid VITE_CHARACTER_REPOSITORY value "${source}". Use "local" or "rest".`,
      );
  }
}

export const characterRepository = createCharacterRepository(
  import.meta.env.VITE_CHARACTER_REPOSITORY,
);
