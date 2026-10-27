import { useQuery } from "@tanstack/react-query";
import type { GameId } from "@exile-companion/contracts";
import { characterRepository } from "./characterRepositorySelection";

export const characterQueryKeys = {
  list: (gameId: GameId) => ["characters", gameId, "list"] as const,
  detail: (gameId: GameId, characterId: string) =>
    ["characters", gameId, "detail", characterId] as const,
};

export function useCharacters(gameId: GameId) {
  return useQuery({
    queryKey: characterQueryKeys.list(gameId),
    queryFn: ({ signal }) => characterRepository.getCharacters(gameId, signal),
  });
}

export function useCharacter(
  gameId: GameId,
  characterId: string | undefined,
) {
  return useQuery({
    queryKey: characterQueryKeys.detail(gameId, characterId ?? ""),
    queryFn: ({ signal }) => {
      if (!characterId) {
        throw new Error("A character ID is required.");
      }
      return characterRepository.getCharacter(gameId, characterId, signal);
    },
    enabled: Boolean(characterId),
  });
}
