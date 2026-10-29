import type { GameId } from "@exile-companion/contracts";
import type { FavoritesRepository } from "./favoriteRepository";

const storageKey = "exile-companion:favorites";
const storageVersion = 1;

interface FavoritesStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

interface FavoriteIdentity {
  gameId: GameId;
  characterId: string;
}

function isGameId(value: unknown): value is GameId {
  return value === "poe1" || value === "poe2";
}

function getBrowserStorage(): FavoritesStorage | null {
  try {
    return typeof window === "undefined" ? null : window.localStorage;
  } catch {
    return null;
  }
}

function parseFavoriteIdentities(value: string | null): FavoriteIdentity[] {
  if (value === null) {
    return [];
  }

  try {
    const stored: unknown = JSON.parse(value);
    if (
      typeof stored !== "object" ||
      stored === null ||
      !("version" in stored) ||
      stored.version !== storageVersion ||
      !("favorites" in stored) ||
      !Array.isArray(stored.favorites)
    ) {
      return [];
    }

    const identities = new Map<GameId, Set<string>>([
      ["poe1", new Set()],
      ["poe2", new Set()],
    ]);

    for (const entry of stored.favorites) {
      if (
        typeof entry !== "object" ||
        entry === null ||
        !("gameId" in entry) ||
        !isGameId(entry.gameId) ||
        !("characterId" in entry) ||
        typeof entry.characterId !== "string" ||
        entry.characterId.trim() === ""
      ) {
        continue;
      }

      identities.get(entry.gameId)?.add(entry.characterId);
    }

    return (["poe1", "poe2"] as const).flatMap((gameId) =>
      Array.from(identities.get(gameId) ?? [], (characterId) => ({
        gameId,
        characterId,
      })),
    );
  } catch {
    return [];
  }
}

export class LocalFavoritesRepository implements FavoritesRepository {
  private readonly favoriteIds = new Map<GameId, Set<string>>([
    ["poe1", new Set()],
    ["poe2", new Set()],
  ]);
  private readonly storage: FavoritesStorage | null;

  constructor(storage: FavoritesStorage | null = getBrowserStorage()) {
    this.storage = storage;
    let storedValue: string | null = null;
    try {
      storedValue = storage?.getItem(storageKey) ?? null;
    } catch {
      // Keep the initialized in-memory state when storage cannot be read.
    }

    for (const favorite of parseFavoriteIdentities(storedValue)) {
      this.favoriteIds.get(favorite.gameId)?.add(favorite.characterId);
    }
  }

  getFavoriteIds(gameId: GameId): string[] {
    return Array.from(this.favoriteIds.get(gameId) ?? []);
  }

  setFavorite(
    gameId: GameId,
    characterId: string,
    isFavorite: boolean,
  ): string[] {
    const ids = this.favoriteIds.get(gameId);
    if (!ids || characterId.trim() === "") {
      throw new Error("A supported game and non-empty character ID are required.");
    }

    if (isFavorite) {
      ids.add(characterId);
    } else {
      ids.delete(characterId);
    }

    this.persist();
    return this.getFavoriteIds(gameId);
  }

  private persist(): void {
    if (!this.storage) {
      return;
    }

    const favorites: FavoriteIdentity[] = [];
    for (const gameId of ["poe1", "poe2"] as const) {
      for (const characterId of this.favoriteIds.get(gameId) ?? []) {
        favorites.push({ gameId, characterId });
      }
    }

    try {
      this.storage.setItem(
        storageKey,
        JSON.stringify({ version: storageVersion, favorites }),
      );
    } catch {
      // In-memory state remains authoritative for this page session.
    }
  }
}
