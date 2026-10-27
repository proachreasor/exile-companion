import { afterEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "../../api/characters";
import { createCharacter, jsonResponse } from "../../test/characterTestUtils";
import characters from "@exile-companion/character-data";
import { createCharacterRepository } from "./characterRepositorySelection";
import { LocalCharacterRepository } from "./localCharacterRepository";
import { RestCharacterRepository } from "./restCharacterRepository";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("LocalCharacterRepository", () => {
  const repository = new LocalCharacterRepository();

  it.each([
    ["poe1", "poe1-marauder-01", "AshenMarauder"],
    ["poe2", "poe2-sorceress-01", "FrostboundSage"],
  ] as const)("returns the shared %s character fixture", async (
    gameId,
    characterId,
    expectedName,
  ) => {
    const list = await repository.getCharacters(gameId);

    expect(list.map((character) => character.id)).toEqual(
      characters[gameId].map((character) => character.id),
    );
    await expect(repository.getCharacter(gameId, characterId)).resolves.toMatchObject({
      id: characterId,
      name: expectedName,
      gameId,
    });
  });

  it("returns null for missing and cross-game character IDs", async () => {
    await expect(
      repository.getCharacter("poe1", "missing-character"),
    ).resolves.toBeNull();
    await expect(
      repository.getCharacter("poe2", "poe1-marauder-01"),
    ).resolves.toBeNull();
  });

  it("returns a fresh list array without allowing callers to mutate fixtures", async () => {
    const first = await repository.getCharacters("poe1");
    const originalFirstId = first[0]?.id;
    first.reverse();

    const second = await repository.getCharacters("poe1");
    expect(second[0]?.id).toBe(originalFirstId);
  });
});

describe("RestCharacterRepository", () => {
  const repository = new RestCharacterRepository();

  it("uses the existing list endpoint and forwards AbortSignal", async () => {
    const signal = new AbortController().signal;
    const characters = [createCharacter("poe1")];
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(characters));
    vi.stubGlobal("fetch", fetchMock);

    await expect(repository.getCharacters("poe1", signal)).resolves.toEqual(
      characters,
    );
    expect(fetchMock).toHaveBeenCalledWith("/api/games/poe1/characters", {
      signal,
    });
  });

  it("uses the existing detail endpoint, forwards AbortSignal, and returns the character", async () => {
    const signal = new AbortController().signal;
    const character = createCharacter("poe2");
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(character));
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      repository.getCharacter("poe2", character.id, signal),
    ).resolves.toEqual(character);
    expect(fetchMock).toHaveBeenCalledWith(
      `/api/games/poe2/characters/${character.id}`,
      { signal },
    );
  });

  it("normalizes a REST 404 to null for consistent missing-character behavior", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        jsonResponse(
          {
            error: {
              code: "CHARACTER_NOT_FOUND",
              message: "Character not found.",
            },
          },
          404,
        ),
      ),
    );

    await expect(
      repository.getCharacter("poe1", "missing-character"),
    ).resolves.toBeNull();
  });

  it("propagates non-404 HTTP and network errors", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        jsonResponse({ error: { code: "INTERNAL_ERROR" } }, 500),
      ),
    );
    await expect(
      repository.getCharacter("poe1", "character-id"),
    ).rejects.toMatchObject({ status: 500, code: "INTERNAL_ERROR" });

    const networkError = new Error("network unavailable");
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(networkError));
    await expect(
      repository.getCharacters("poe1"),
    ).rejects.toBe(networkError);
  });
});

describe("character repository selection", () => {
  it.each([undefined, "", "local"])(
    "selects local character data for %s configuration",
    (source) => {
      expect(createCharacterRepository(source)).toBeInstanceOf(
        LocalCharacterRepository,
      );
    },
  );

  it("selects REST only when explicitly configured", () => {
    expect(createCharacterRepository("rest")).toBeInstanceOf(
      RestCharacterRepository,
    );
  });

  it("rejects unknown configuration values clearly", () => {
    expect(() => createCharacterRepository("remote")).toThrow(
      'Invalid VITE_CHARACTER_REPOSITORY value "remote". Use "local" or "rest".',
    );
  });
});
