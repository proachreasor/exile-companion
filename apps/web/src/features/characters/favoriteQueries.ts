import {
  useIsMutating,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import type { GameId } from "@exile-companion/contracts";
import { favoritesRepository } from "./favoriteRepositorySelection";

export const favoriteQueryKeys = {
  forGame: (gameId: GameId) => ["favorites", gameId] as const,
};

const favoriteMutationKeys = {
  set: (gameId: GameId) => ["favorites", gameId, "set"] as const,
};

interface SetFavoriteRequest {
  characterId: string;
  isFavorite: boolean;
}

export function useFavoriteIds(gameId: GameId) {
  return useQuery({
    queryKey: favoriteQueryKeys.forGame(gameId),
    queryFn: () => favoritesRepository.getFavoriteIds(gameId),
    staleTime: Infinity,
  });
}

export function useSetFavorite(gameId: GameId) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: favoriteMutationKeys.set(gameId),
    scope: { id: `favorites-${gameId}` },
    mutationFn: async ({ characterId, isFavorite }: SetFavoriteRequest) =>
      favoritesRepository.setFavorite(gameId, characterId, isFavorite),
    onSuccess: (favoriteIds) => {
      queryClient.setQueryData(favoriteQueryKeys.forGame(gameId), favoriteIds);
    },
  });
}

export function useIsFavoriteMutationPending(gameId: GameId): boolean {
  return (
    useIsMutating({ mutationKey: favoriteMutationKeys.set(gameId) }) > 0
  );
}
