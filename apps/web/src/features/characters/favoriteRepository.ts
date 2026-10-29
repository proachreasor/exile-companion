import type { GameId } from "@exile-companion/contracts";

export interface FavoritesRepository {
  getFavoriteIds(gameId: GameId): string[];
  setFavorite(
    gameId: GameId,
    characterId: string,
    isFavorite: boolean,
  ): string[];
}
