import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import App from "../App";
import {
  createCharacter,
  jsonResponse,
  renderWithRouter,
} from "../test/characterTestUtils";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("character list page", () => {
  it.each([
    ["poe1", "EmberKnight", "Marauder"],
    ["poe2", "FrostSage", "Sorceress"],
  ] as const)("renders %s character data", async (gameId, name, characterClass) => {
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse([createCharacter(gameId)]),
    );
    vi.stubGlobal("fetch", fetchMock);
    renderWithRouter(<App />, `/${gameId}/characters`);

    expect(await screen.findByText(name)).toBeInTheDocument();
    expect(screen.getByText(new RegExp(characterClass))).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name }),
    ).toHaveAttribute("href", `/${gameId}/characters/${gameId}-character-1`);
    expect(fetchMock).toHaveBeenCalledWith(
      `/api/games/${gameId}/characters`,
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    );
  });

  it("shows a loading state while the character list is pending", () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() => new Promise<Response>(() => {})),
    );
    renderWithRouter(<App />, "/poe1/characters");

    expect(screen.getByRole("status")).toHaveTextContent("Loading characters");
  });

  it("shows a predictable error state when the list request fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        jsonResponse(
          {
            error: {
              code: "INTERNAL_ERROR",
              message: "private backend detail",
            },
          },
          500,
        ),
      ),
    );
    renderWithRouter(<App />, "/poe1/characters");

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Unable to load characters. Please try again.",
    );
    expect(screen.queryByText("private backend detail")).not.toBeInTheDocument();
  });

  it("shows the empty state when the list has no characters", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse([])));
    renderWithRouter(<App />, "/poe2/characters");

    expect(await screen.findByText("No characters found.")).toBeInTheDocument();
  });

  it("isolates rendered list data when switching games", async () => {
    let resolvePoe2!: (response: Response) => void;
    const poe2Response = new Promise<Response>((resolve) => {
      resolvePoe2 = resolve;
    });
    const fetchMock = vi.fn((input: RequestInfo | URL) => {
      const path = String(input);
      return path.includes("/poe1/")
        ? Promise.resolve(jsonResponse([createCharacter("poe1")]))
        : poe2Response;
    });
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();
    renderWithRouter(<App />, "/poe1/characters");

    expect(await screen.findByText("EmberKnight")).toBeInTheDocument();
    await user.selectOptions(screen.getByRole("combobox", { name: "Game" }), "poe2");

    expect(screen.queryByText("EmberKnight")).not.toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("Loading characters");
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/games/poe2/characters",
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    );

    resolvePoe2(jsonResponse([createCharacter("poe2")]));
    expect(await screen.findByText("FrostSage")).toBeInTheDocument();
  });

  it("cancels the previous game's in-flight list request after switching games", async () => {
    let poe1Signal: AbortSignal | undefined;
    const fetchMock = vi.fn(
      (input: RequestInfo | URL, options?: RequestInit) => {
        if (String(input).includes("/poe1/")) {
          poe1Signal = options?.signal ?? undefined;
          return new Promise<Response>((_resolve, reject) => {
            options?.signal?.addEventListener("abort", () => {
              reject(new DOMException("Request aborted", "AbortError"));
            });
          });
        }

        return Promise.resolve(
          jsonResponse([createCharacter("poe2")]),
        );
      },
    );
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();
    renderWithRouter(<App />, "/poe1/characters");

    expect(screen.getByRole("status")).toHaveTextContent("Loading characters");
    await waitFor(() => expect(poe1Signal).toBeInstanceOf(AbortSignal));
    await user.selectOptions(screen.getByRole("combobox", { name: "Game" }), "poe2");

    expect(await screen.findByText("FrostSage")).toBeInTheDocument();
    await waitFor(() => expect(poe1Signal?.aborted).toBe(true));
  });
});

describe("character detail page", () => {
  it("renders fetched character details", async () => {
    const character = createCharacter("poe1");
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(character));
    vi.stubGlobal("fetch", fetchMock);
    renderWithRouter(<App />, `/poe1/characters/${character.id}`);

    expect(await screen.findByText(character.name)).toBeInTheDocument();
    expect(screen.getByText(character.characterClass)).toBeInTheDocument();
    expect(screen.getByText(String(character.level))).toBeInTheDocument();
    expect(screen.getByText(character.league)).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith(
      `/api/games/poe1/characters/${character.id}`,
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    );
  });

  it("shows loading while detail data is pending", () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() => new Promise<Response>(() => {})),
    );
    renderWithRouter(<App />, "/poe1/characters/pending-id");

    expect(screen.getByRole("status")).toHaveTextContent("Loading character");
  });

  it("shows a character-specific not-found state and list link for 404", async () => {
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
    renderWithRouter(<App />, "/poe2/characters/missing-id");

    expect(await screen.findByText("Character not found.")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Back to characters" }),
    ).toHaveAttribute("href", "/poe2/characters");
  });

  it("shows a predictable error state for non-404 detail failures", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        jsonResponse(
          {
            error: {
              code: "INTERNAL_ERROR",
              message: "private backend detail",
            },
          },
          500,
        ),
      ),
    );
    renderWithRouter(<App />, "/poe2/characters/broken-id");

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Unable to load character. Please try again.",
    );
    expect(screen.queryByText("private backend detail")).not.toBeInTheDocument();
  });
});
