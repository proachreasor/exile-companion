import { afterEach, describe, expect, it, vi } from "vitest";
import { LocalFavoritesRepository } from "./localFavoritesRepository";

const storageKey = "exile-companion:favorites";

class MemoryStorage {
  private readonly values = new Map<string, string>();

  getItem(key: string): string | null {
    return this.values.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.values.set(key, value);
  }
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("LocalFavoritesRepository", () => {
  it("adds and removes favorite IDs for the requested game", () => {
    const repository = new LocalFavoritesRepository(new MemoryStorage());

    expect(repository.setFavorite("poe1", "same-id", true)).toEqual([
      "same-id",
    ]);
    expect(repository.getFavoriteIds("poe1")).toEqual(["same-id"]);
    expect(repository.getFavoriteIds("poe2")).toEqual([]);
    expect(repository.setFavorite("poe1", "same-id", false)).toEqual([]);
  });

  it("persists identity pairs and restores them in a new repository", () => {
    const storage = new MemoryStorage();
    const first = new LocalFavoritesRepository(storage);
    first.setFavorite("poe1", "shared-id", true);
    first.setFavorite("poe2", "shared-id", true);

    const restored = new LocalFavoritesRepository(storage);
    expect(restored.getFavoriteIds("poe1")).toEqual(["shared-id"]);
    expect(restored.getFavoriteIds("poe2")).toEqual(["shared-id"]);
    expect(JSON.parse(storage.getItem(storageKey) ?? "")).toEqual({
      version: 1,
      favorites: [
        { gameId: "poe1", characterId: "shared-id" },
        { gameId: "poe2", characterId: "shared-id" },
      ],
    });
  });

  it("does not write to storage during reads", () => {
    const storage = new MemoryStorage();
    const setItem = vi.spyOn(storage, "setItem");
    const repository = new LocalFavoritesRepository(storage);

    repository.getFavoriteIds("poe1");
    repository.getFavoriteIds("poe2");

    expect(setItem).not.toHaveBeenCalled();
  });

  it("ignores malformed JSON and unsupported storage versions", () => {
    for (const value of [
      "{",
      JSON.stringify({ version: 2, favorites: [{ gameId: "poe1", characterId: "x" }] }),
      JSON.stringify({ version: 1, favorites: "invalid" }),
    ]) {
      const storage = new MemoryStorage();
      storage.setItem(storageKey, value);

      expect(new LocalFavoritesRepository(storage).getFavoriteIds("poe1")).toEqual(
        [],
      );
    }
  });

  it("ignores invalid and duplicate favorite identities safely", () => {
    const storage = new MemoryStorage();
    storage.setItem(
      storageKey,
      JSON.stringify({
        version: 1,
        favorites: [
          { gameId: "poe1", characterId: "valid" },
          { gameId: "poe1", characterId: "valid" },
          { gameId: "poe3", characterId: "unsupported-game" },
          { gameId: "poe2", characterId: "" },
          { gameId: "poe2", characterId: 42 },
          null,
        ],
      }),
    );

    const repository = new LocalFavoritesRepository(storage);
    expect(repository.getFavoriteIds("poe1")).toEqual(["valid"]);
    expect(repository.getFavoriteIds("poe2")).toEqual([]);
  });

  it("falls back to memory when the localStorage getter throws", () => {
    vi.spyOn(window, "localStorage", "get").mockImplementation(() => {
      throw new Error("storage unavailable");
    });
    const repository = new LocalFavoritesRepository();

    expect(repository.setFavorite("poe2", "memory-only", true)).toEqual([
      "memory-only",
    ]);
    expect(repository.getFavoriteIds("poe2")).toEqual(["memory-only"]);
  });

  it("keeps memory authoritative when storage reads fail", () => {
    const storage = new MemoryStorage();
    vi.spyOn(storage, "getItem").mockImplementation(() => {
      throw new Error("read blocked");
    });
    const repository = new LocalFavoritesRepository(storage);

    expect(repository.setFavorite("poe1", "memory", true)).toEqual(["memory"]);
    expect(repository.getFavoriteIds("poe1")).toEqual(["memory"]);
    expect(storage.getItem).toHaveBeenCalledTimes(1);
  });

  it("keeps memory authoritative after a persistence failure", () => {
    const storage = new MemoryStorage();
    storage.setItem(
      storageKey,
      JSON.stringify({
        version: 1,
        favorites: [{ gameId: "poe1", characterId: "persisted" }],
      }),
    );
    const getItem = vi.spyOn(storage, "getItem");
    vi.spyOn(storage, "setItem").mockImplementation(() => {
      throw new Error("write blocked");
    });
    const repository = new LocalFavoritesRepository(storage);

    expect(repository.setFavorite("poe1", "memory", true)).toEqual([
      "persisted",
      "memory",
    ]);
    expect(repository.getFavoriteIds("poe1")).toEqual(["persisted", "memory"]);
    expect(getItem).toHaveBeenCalledTimes(1);
  });

  it("continues working without a persistence layer", () => {
    const repository = new LocalFavoritesRepository(null);

    expect(repository.setFavorite("poe1", "session-only", true)).toEqual([
      "session-only",
    ]);
    expect(repository.setFavorite("poe1", "session-only", false)).toEqual([]);
  });

  it("rejects empty character IDs", () => {
    const repository = new LocalFavoritesRepository(null);

    expect(() => repository.setFavorite("poe1", " ", true)).toThrow(
      "A supported game and non-empty character ID are required.",
    );
  });
});
