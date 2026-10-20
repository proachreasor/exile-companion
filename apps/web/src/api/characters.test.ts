import { afterEach, describe, expect, it, vi } from "vitest";
import { ApiError, getCharacter, getCharacters } from "./characters";
import { createCharacter, jsonResponse } from "../test/characterTestUtils";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("character API", () => {
  it("requests a game-specific character list and forwards its AbortSignal", async () => {
    const signal = new AbortController().signal;
    const characters = [createCharacter("poe1")];
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(characters));
    vi.stubGlobal("fetch", fetchMock);

    await expect(getCharacters("poe1", signal)).resolves.toEqual(characters);

    expect(fetchMock).toHaveBeenCalledWith("/api/games/poe1/characters", {
      signal,
    });
  });

  it("requests a character detail with an encoded ID and forwards its AbortSignal", async () => {
    const signal = new AbortController().signal;
    const character = createCharacter("poe2", { id: "character/id" });
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(character));
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      getCharacter("poe2", character.id, signal),
    ).resolves.toEqual(character);

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/games/poe2/characters/character%2Fid",
      { signal },
    );
  });

  it("preserves HTTP status and application code without exposing server text", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse(
        {
          error: {
            code: "CHARACTER_NOT_FOUND",
            message: "sensitive server implementation detail",
          },
        },
        404,
      ),
    );
    vi.stubGlobal("fetch", fetchMock);

    await expect(getCharacter("poe1", "missing")).rejects.toMatchObject({
      name: "ApiError",
      status: 404,
      code: "CHARACTER_NOT_FOUND",
      message: "API request failed with status 404",
    } satisfies Partial<ApiError>);
  });

  it("handles a fetch AbortError rejection without converting it to an API response", async () => {
    const controller = new AbortController();
    const fetchMock = vi.fn(
      (_url: string, options?: RequestInit) =>
        new Promise<Response>((_resolve, reject) => {
          options?.signal?.addEventListener("abort", () => {
            reject(new DOMException("Request aborted", "AbortError"));
          });
        }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const request = getCharacters("poe2", controller.signal);
    controller.abort();

    await expect(request).rejects.toMatchObject({ name: "AbortError" });
  });
});
