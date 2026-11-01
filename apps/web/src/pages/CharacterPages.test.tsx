import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import type { Character, GameId } from "@exile-companion/contracts";
import App from "../App";
import { characterQueryKeys } from "../features/characters/characterQueries";
import { favoriteQueryKeys } from "../features/characters/favoriteQueries";
import { createCharacter, renderWithRouter } from "../test/characterTestUtils";

const repositoryMock = vi.hoisted(() => ({
  getCharacters: vi.fn(),
  getCharacter: vi.fn(),
}));

const favoriteState = vi.hoisted(() => ({
  poe1: [] as string[],
  poe2: [] as string[],
}));

const favoritesRepositoryMock = vi.hoisted(() => ({
  getFavoriteIds: vi.fn(),
  setFavorite: vi.fn(),
}));

vi.mock("../features/characters/characterRepositorySelection", () => ({
  characterRepository: repositoryMock,
}));

vi.mock("../features/characters/favoriteRepositorySelection", () => ({
  favoritesRepository: favoritesRepositoryMock,
}));

function setRepositoryCharacters(characters: Character[]) {
  repositoryMock.getCharacters.mockImplementation(
    async (gameId: GameId) =>
      characters.filter((character) => character.gameId === gameId),
  );
  repositoryMock.getCharacter.mockImplementation(
    async (gameId: GameId, characterId: string) =>
      characters.find(
        (character) =>
          character.gameId === gameId && character.id === characterId,
      ) ?? null,
  );
}

beforeEach(() => {
  favoriteState.poe1 = [];
  favoriteState.poe2 = [];
  repositoryMock.getCharacters.mockReset();
  repositoryMock.getCharacter.mockReset();
  favoritesRepositoryMock.getFavoriteIds.mockReset();
  favoritesRepositoryMock.setFavorite.mockReset();
  favoritesRepositoryMock.getFavoriteIds.mockImplementation(
    (gameId: GameId) => [...favoriteState[gameId]],
  );
  favoritesRepositoryMock.setFavorite.mockImplementation(
    (gameId: GameId, characterId: string, isFavorite: boolean) => {
      const current = new Set(favoriteState[gameId]);
      if (isFavorite) {
        current.add(characterId);
      } else {
        current.delete(characterId);
      }
      favoriteState[gameId] = Array.from(current);
      return [...favoriteState[gameId]];
    },
  );
  setRepositoryCharacters([
    createCharacter("poe1"),
    createCharacter("poe2"),
  ]);
});

afterEach(() => {
  vi.clearAllMocks();
});

function poe1Characters() {
  return [
    createCharacter("poe1", {
      id: "z-id",
      name: "Alpha",
      characterClass: "Marauder",
      level: 90,
      league: "Standard",
    }),
    createCharacter("poe1", {
      id: "a-id",
      name: "Alpha",
      characterClass: "Marauder",
      level: 90,
      league: "Standard",
    }),
    createCharacter("poe1", {
      id: "beta-id",
      name: "Beta",
      characterClass: "Ranger",
      level: 90,
      league: "Hardcore",
    }),
    createCharacter("poe1", {
      id: "zeta-id",
      name: "Zeta",
      characterClass: "Ranger",
      level: 50,
      league: "Standard",
    }),
  ];
}

function visibleCharacterPaths() {
  return within(screen.getByRole("list"))
    .getAllByRole("link")
    .map((link) => link.getAttribute("href"));
}

describe("character list page", () => {
  it.each([
    ["poe1", "EmberKnight", "Marauder"],
    ["poe2", "FrostSage", "Sorceress"],
  ] as const)("renders %s character data", async (gameId, name, characterClass) => {
    setRepositoryCharacters([createCharacter(gameId)]);
    renderWithRouter(<App />, `/${gameId}/characters`);

    expect(await screen.findByText(name)).toBeInTheDocument();
    expect(screen.getByRole("listitem")).toHaveTextContent(characterClass);
    expect(
      screen.getByRole("link", { name }),
    ).toHaveAttribute("href", `/${gameId}/characters/${gameId}-character-1`);
    expect(repositoryMock.getCharacters).toHaveBeenCalledWith(
      gameId,
      expect.any(AbortSignal),
    );
  });

  it("shows a loading state while the character list is pending", () => {
    repositoryMock.getCharacters.mockImplementation(
      () => new Promise<Character[]>(() => {}),
    );
    renderWithRouter(<App />, "/poe1/characters");

    expect(screen.getByRole("status")).toHaveTextContent("Loading characters");
  });

  it("shows a predictable error state when the list request fails", async () => {
    repositoryMock.getCharacters.mockRejectedValue(
      new Error("private backend detail"),
    );
    renderWithRouter(<App />, "/poe1/characters");

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Unable to load characters. Please try again.",
    );
    expect(screen.queryByText("private backend detail")).not.toBeInTheDocument();
  });

  it("shows the empty state when the list has no characters", async () => {
    repositoryMock.getCharacters.mockResolvedValue([]);
    renderWithRouter(<App />, "/poe2/characters");

    expect(await screen.findByText("No characters found.")).toBeInTheDocument();
  });

  it("searches names case-insensitively by partial match and trims whitespace", async () => {
    setRepositoryCharacters(poe1Characters());
    const user = userEvent.setup();
    renderWithRouter(<App />, "/poe1/characters");

    await screen.findAllByRole("link", { name: "Alpha" });
    await user.type(
      screen.getByRole("searchbox", { name: "Search characters" }),
      " pHa ",
    );

    expect(screen.getAllByRole("link", { name: "Alpha" })).toHaveLength(2);
    expect(screen.getByRole("status")).toHaveTextContent("2 of 4 characters");
    expect(screen.queryByRole("link", { name: "Beta" })).not.toBeInTheDocument();
  });

  it("filters by class and derives unique alphabetically ordered options", async () => {
    const characters = poe1Characters();
    setRepositoryCharacters(characters);
    const user = userEvent.setup();
    renderWithRouter(<App />, "/poe1/characters");

    await screen.findAllByRole("link", { name: "Alpha" });
    const classSelect = screen.getByRole("combobox", { name: "Class" });
    expect(
      within(classSelect)
        .getAllByRole("option")
        .map((option) => option.textContent),
    ).toEqual(["All classes", "Marauder", "Ranger"]);

    await user.selectOptions(classSelect, "Ranger");

    expect(visibleCharacterPaths()).toEqual([
      "/poe1/characters/beta-id",
      "/poe1/characters/zeta-id",
    ]);
  });

  it("filters by league and derives unique alphabetically ordered options", async () => {
    setRepositoryCharacters(poe1Characters());
    const user = userEvent.setup();
    renderWithRouter(<App />, "/poe1/characters");

    await screen.findAllByRole("link", { name: "Alpha" });
    const leagueSelect = screen.getByRole("combobox", { name: "League" });
    expect(
      within(leagueSelect)
        .getAllByRole("option")
        .map((option) => option.textContent),
    ).toEqual(["All leagues", "Hardcore", "Standard"]);

    await user.selectOptions(leagueSelect, "Hardcore");

    expect(visibleCharacterPaths()).toEqual(["/poe1/characters/beta-id"]);
  });

  it("combines search, exact class, and exact league filters", async () => {
    setRepositoryCharacters(poe1Characters());
    const user = userEvent.setup();
    renderWithRouter(<App />, "/poe1/characters");

    await screen.findAllByRole("link", { name: "Alpha" });
    await user.type(
      screen.getByRole("searchbox", { name: "Search characters" }),
      " ALP ",
    );
    await user.selectOptions(
      screen.getByRole("combobox", { name: "Class" }),
      "Marauder",
    );
    await user.selectOptions(
      screen.getByRole("combobox", { name: "League" }),
      "Standard",
    );

    expect(visibleCharacterPaths()).toEqual([
      "/poe1/characters/a-id",
      "/poe1/characters/z-id",
    ]);
    expect(screen.getByRole("status")).toHaveTextContent("2 of 4 characters");
  });

  it.each([
    [
      "level-desc",
      [
        "/poe1/characters/a-id",
        "/poe1/characters/z-id",
        "/poe1/characters/beta-id",
        "/poe1/characters/zeta-id",
      ],
    ],
    [
      "level-asc",
      [
        "/poe1/characters/zeta-id",
        "/poe1/characters/a-id",
        "/poe1/characters/z-id",
        "/poe1/characters/beta-id",
      ],
    ],
    [
      "name-asc",
      [
        "/poe1/characters/a-id",
        "/poe1/characters/z-id",
        "/poe1/characters/beta-id",
        "/poe1/characters/zeta-id",
      ],
    ],
    [
      "name-desc",
      [
        "/poe1/characters/zeta-id",
        "/poe1/characters/beta-id",
        "/poe1/characters/a-id",
        "/poe1/characters/z-id",
      ],
    ],
  ] as const)("sorts characters using %s", async (sort, expectedPaths) => {
    setRepositoryCharacters(poe1Characters());
    const user = userEvent.setup();
    renderWithRouter(<App />, "/poe1/characters");

    await screen.findAllByRole("link", { name: "Alpha" });
    await user.selectOptions(
      screen.getByRole("combobox", { name: "Sort characters" }),
      sort,
    );

    expect(visibleCharacterPaths()).toEqual(expectedPaths);
  });

  it("distinguishes no filter matches from an empty API response and shows the count", async () => {
    setRepositoryCharacters(poe1Characters());
    const user = userEvent.setup();
    renderWithRouter(<App />, "/poe1/characters");

    await screen.findAllByRole("link", { name: "Alpha" });
    expect(screen.getByRole("status")).toHaveTextContent("4 of 4 characters");
    await user.type(
      screen.getByRole("searchbox", { name: "Search characters" }),
      "missing",
    );

    expect(
      await screen.findByText("No characters match your filters."),
    ).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("0 of 4 characters");
    expect(screen.queryByText("No characters found.")).not.toBeInTheDocument();
  });

  it("resets search, filters, and sorting to their defaults", async () => {
    setRepositoryCharacters(poe1Characters());
    const user = userEvent.setup();
    renderWithRouter(<App />, "/poe1/characters");

    await screen.findAllByRole("link", { name: "Alpha" });
    await user.type(
      screen.getByRole("searchbox", { name: "Search characters" }),
      "zeta",
    );
    await user.selectOptions(
      screen.getByRole("combobox", { name: "Class" }),
      "Ranger",
    );
    await user.selectOptions(
      screen.getByRole("combobox", { name: "League" }),
      "Standard",
    );
    await user.selectOptions(
      screen.getByRole("combobox", { name: "Sort characters" }),
      "name-desc",
    );
    await user.click(screen.getByRole("button", { name: "Reset" }));

    expect(
      screen.getByRole("searchbox", { name: "Search characters" }),
    ).toHaveValue("");
    expect(screen.getByRole("combobox", { name: "Class" })).toHaveValue("");
    expect(screen.getByRole("combobox", { name: "League" })).toHaveValue("");
    expect(screen.getByRole("combobox", { name: "Sort characters" })).toHaveValue(
      "level-desc",
    );
    expect(visibleCharacterPaths()).toEqual([
      "/poe1/characters/a-id",
      "/poe1/characters/z-id",
      "/poe1/characters/beta-id",
      "/poe1/characters/zeta-id",
    ]);
  });

  it("keeps unavailable class and league selections active after switching games", async () => {
    setRepositoryCharacters([
      createCharacter("poe1", {
        characterClass: "Marauder",
        league: "Crucible",
      }),
      createCharacter("poe2", {
        characterClass: "Monk",
        league: "Standard",
      }),
    ]);
    const user = userEvent.setup();
    renderWithRouter(<App />, "/poe1/characters");

    await screen.findByText("EmberKnight");
    await user.selectOptions(
      screen.getByRole("combobox", { name: "Class" }),
      "Marauder",
    );
    await user.selectOptions(
      screen.getByRole("combobox", { name: "League" }),
      "Crucible",
    );
    await user.selectOptions(
      screen.getByRole("combobox", { name: "Game" }),
      "poe2",
    );

    await screen.findByRole("heading", { name: "Path of Exile 2 Characters" });
    expect(await screen.findByText("0 of 1 characters")).toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: "Class" })).toHaveValue(
      "Marauder",
    );
    expect(
      screen.getByRole("option", { name: "Marauder (unavailable)" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: "League" })).toHaveValue(
      "Crucible",
    );
    expect(
      screen.getByRole("option", { name: "Crucible (unavailable)" }),
    ).toBeInTheDocument();
    expect(
      await screen.findByText("No characters match your filters."),
    ).toBeInTheDocument();
  });

  it("preserves detail navigation with URL-unsafe character IDs", async () => {
    const character = createCharacter("poe1", { id: "knight / one" });
    setRepositoryCharacters([character]);
    const user = userEvent.setup();
    renderWithRouter(<App />, "/poe1/characters");

    const characterLink = await screen.findByRole("link", {
      name: character.name,
    });
    expect(characterLink).toHaveAttribute(
      "href",
      `/poe1/characters/${encodeURIComponent(character.id)}`,
    );
    await user.click(characterLink);

    expect(
      await screen.findByRole("heading", { name: "Path of Exile 1 Character" }),
    ).toBeInTheDocument();
    expect(
      await screen.findByText(character.characterClass),
    ).toBeInTheDocument();
    expect(repositoryMock.getCharacter).toHaveBeenCalledWith(
      "poe1",
      character.id,
      expect.any(AbortSignal),
    );
  });

  it("does not mutate the character array returned by the repository when sorting", async () => {
    const characters = poe1Characters();
    const originalOrder = characters.map((character) => character.id);
    setRepositoryCharacters(characters);
    const user = userEvent.setup();
    renderWithRouter(<App />, "/poe1/characters");

    await screen.findAllByRole("link", { name: "Alpha" });
    await user.selectOptions(
      screen.getByRole("combobox", { name: "Sort characters" }),
      "name-desc",
    );

    expect(visibleCharacterPaths()).toEqual([
      "/poe1/characters/zeta-id",
      "/poe1/characters/beta-id",
      "/poe1/characters/a-id",
      "/poe1/characters/z-id",
    ]);
    expect(characters.map((character) => character.id)).toEqual(originalOrder);
  });

  it("isolates rendered list data when switching games", async () => {
    let resolvePoe2!: (characters: Character[]) => void;
    const poe2Response = new Promise<Character[]>((resolve) => {
      resolvePoe2 = resolve;
    });
    repositoryMock.getCharacters.mockImplementation((gameId: GameId) =>
      gameId === "poe1"
        ? Promise.resolve([createCharacter("poe1")])
        : poe2Response,
    );
    const user = userEvent.setup();
    renderWithRouter(<App />, "/poe1/characters");

    expect(await screen.findByText("EmberKnight")).toBeInTheDocument();
    await user.selectOptions(
      screen.getByRole("combobox", { name: "Game" }),
      "poe2",
    );

    expect(screen.queryByText("EmberKnight")).not.toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("Loading characters");
    expect(repositoryMock.getCharacters).toHaveBeenCalledWith(
      "poe2",
      expect.any(AbortSignal),
    );

    resolvePoe2([createCharacter("poe2")]);
    expect(await screen.findByText("FrostSage")).toBeInTheDocument();
  });

  it("cancels the previous game's in-flight list request after switching games", async () => {
    let poe1Signal: AbortSignal | undefined;
    repositoryMock.getCharacters.mockImplementation(
      (gameId: GameId, signal?: AbortSignal) => {
        if (gameId === "poe1") {
          poe1Signal = signal;
          return new Promise<Character[]>((_resolve, reject) => {
            signal?.addEventListener("abort", () => {
              reject(new DOMException("Request aborted", "AbortError"));
            });
          });
        }

        return Promise.resolve([createCharacter("poe2")]);
      },
    );
    const user = userEvent.setup();
    renderWithRouter(<App />, "/poe1/characters");

    expect(screen.getByRole("status")).toHaveTextContent("Loading characters");
    await waitFor(() => expect(poe1Signal).toBeInstanceOf(AbortSignal));
    await user.selectOptions(
      screen.getByRole("combobox", { name: "Game" }),
      "poe2",
    );

    expect(await screen.findByText("FrostSage")).toBeInTheDocument();
    await waitFor(() => expect(poe1Signal?.aborted).toBe(true));
  });

  it("updates the game-scoped favorites cache without changing character data", async () => {
    const characters = [createCharacter("poe1")];
    setRepositoryCharacters(characters);
    const user = userEvent.setup();
    const { queryClient } = renderWithRouter(<App />, "/poe1/characters");

    await screen.findByText(characters[0]!.name);
    const favoriteButton = await screen.findByRole("button", {
      name: `Favorite ${characters[0]!.name}`,
    });
    await waitFor(() => expect(favoriteButton).toBeEnabled());
    const characterCache = queryClient.getQueryData(
      characterQueryKeys.list("poe1"),
    );

    await user.click(favoriteButton);

    expect(favoriteButton).toHaveAttribute("aria-pressed", "true");
    expect(
      queryClient.getQueryData(favoriteQueryKeys.forGame("poe1")),
    ).toEqual([characters[0]!.id]);
    expect(
      queryClient.getQueryData(favoriteQueryKeys.forGame("poe2")),
    ).toBeUndefined();
    expect(
      queryClient.getQueryData(characterQueryKeys.list("poe1")),
    ).toBe(characterCache);
    expect(favoritesRepositoryMock.setFavorite).toHaveBeenCalledWith(
      "poe1",
      characters[0]!.id,
      true,
    );
  });

  it("keeps favorite identities independent when character IDs match across games", async () => {
    const characters = [
      createCharacter("poe1", { id: "shared-id", name: "FirstGameHero" }),
      createCharacter("poe2", { id: "shared-id", name: "SecondGameHero" }),
    ];
    setRepositoryCharacters(characters);
    favoriteState.poe1 = ["shared-id"];
    const user = userEvent.setup();
    renderWithRouter(<App />, "/poe1/characters");

    const poe1Button = await screen.findByRole("button", {
      name: "Favorite FirstGameHero",
    });
    expect(poe1Button).toHaveAttribute("aria-pressed", "true");
    await user.selectOptions(
      screen.getByRole("combobox", { name: "Game" }),
      "poe2",
    );

    const poe2Button = await screen.findByRole("button", {
      name: "Favorite SecondGameHero",
    });
    expect(poe2Button).toHaveAttribute("aria-pressed", "false");
    expect(favoritesRepositoryMock.getFavoriteIds).toHaveBeenCalledWith("poe2");
  });

  it("keeps favorite state synchronized between list, detail, and game navigation", async () => {
    const characters = [createCharacter("poe1"), createCharacter("poe2")];
    setRepositoryCharacters(characters);
    const user = userEvent.setup();
    renderWithRouter(<App />, "/poe1/characters");

    await user.click(
      await screen.findByRole("button", {
        name: "Favorite EmberKnight",
      }),
    );
    expect(
      screen.getByRole("button", { name: "Favorite EmberKnight" }),
    ).toHaveAttribute("aria-pressed", "true");

    await user.click(screen.getByRole("link", { name: "EmberKnight" }));
    expect(
      await screen.findByRole("button", { name: "Favorite EmberKnight" }),
    ).toHaveAttribute("aria-pressed", "true");

    await user.selectOptions(
      screen.getByRole("combobox", { name: "Game" }),
      "poe2",
    );
    await screen.findByRole("heading", { name: "Path of Exile 2 Characters" });
    await user.selectOptions(
      screen.getByRole("combobox", { name: "Game" }),
      "poe1",
    );

    expect(
      await screen.findByRole("button", { name: "Favorite EmberKnight" }),
    ).toHaveAttribute("aria-pressed", "true");
  });

  it("disables all favorite actions while a mutation is pending", async () => {
    const characters = poe1Characters().slice(0, 2);
    setRepositoryCharacters(characters);
    let resolveMutation!: (favoriteIds: string[]) => void;
    favoritesRepositoryMock.setFavorite.mockImplementation(
      () =>
        new Promise<string[]>((resolve) => {
          resolveMutation = resolve;
        }),
    );
    const user = userEvent.setup();
    renderWithRouter(<App />, "/poe1/characters");

    const buttons = await screen.findAllByRole("button", {
      name: "Favorite Alpha",
    });
    const firstButton = buttons[0]!;
    const secondButton = buttons[1]!;
    await waitFor(() => expect(firstButton).toBeEnabled());
    await user.click(firstButton);

    await waitFor(() => {
      expect(firstButton).toBeDisabled();
      expect(secondButton).toBeDisabled();
    });
    expect(favoritesRepositoryMock.setFavorite).toHaveBeenCalledTimes(1);

    resolveMutation(["z-id"]);
    await waitFor(() => expect(firstButton).toBeEnabled());
  });

  it("shows a predictable message when favorite mutation fails", async () => {
    setRepositoryCharacters([createCharacter("poe1")]);
    favoritesRepositoryMock.setFavorite.mockRejectedValue(
      new Error("private storage details"),
    );
    const user = userEvent.setup();
    renderWithRouter(<App />, "/poe1/characters");

    const favoriteButton = await screen.findByRole("button", {
      name: "Favorite EmberKnight",
    });
    await waitFor(() => expect(favoriteButton).toBeEnabled());
    await user.click(favoriteButton);

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Unable to update favorites. Please try again.",
    );
    expect(screen.queryByText("private storage details")).not.toBeInTheDocument();
    await waitFor(() => expect(favoriteButton).toBeEnabled());
  });
});

describe("character detail page", () => {
  it("renders fetched character details", async () => {
    const character = createCharacter("poe1");
    setRepositoryCharacters([character]);
    renderWithRouter(<App />, `/poe1/characters/${character.id}`);

    expect(await screen.findByText(character.name)).toBeInTheDocument();
    expect(screen.getByText(character.characterClass)).toBeInTheDocument();
    expect(screen.getByText(String(character.level))).toBeInTheDocument();
    expect(screen.getByText(character.league)).toBeInTheDocument();
    expect(repositoryMock.getCharacter).toHaveBeenCalledWith(
      "poe1",
      character.id,
      expect.any(AbortSignal),
    );
  });

  it("shows favorite state and updates it from character details", async () => {
    const character = createCharacter("poe2");
    setRepositoryCharacters([character]);
    favoriteState.poe2 = [character.id];
    const user = userEvent.setup();
    const { queryClient } = renderWithRouter(
      <App />,
      `/poe2/characters/${character.id}`,
    );

    expect(
      await screen.findByRole("button", {
        name: `Favorite ${character.name}`,
      }),
    ).toHaveAttribute("aria-pressed", "true");
    await user.click(
      screen.getByRole("button", {
        name: `Favorite ${character.name}`,
      }),
    );

    expect(
      await screen.findByRole("button", {
        name: `Favorite ${character.name}`,
      }),
    ).toHaveAttribute("aria-pressed", "false");
    expect(
      queryClient.getQueryData(favoriteQueryKeys.forGame("poe2")),
    ).toEqual([]);
    expect(favoritesRepositoryMock.setFavorite).toHaveBeenCalledWith(
      "poe2",
      character.id,
      false,
    );
  });

  it("shows loading while detail data is pending", () => {
    repositoryMock.getCharacter.mockImplementation(
      () => new Promise<Character | null>(() => {}),
    );
    renderWithRouter(<App />, "/poe1/characters/pending-id");

    expect(screen.getByRole("status")).toHaveTextContent("Loading character");
  });

  it.each(["poe1", "poe2"] as const)(
    "shows a character-specific not-found state and the %s character list link",
    async (gameId) => {
      repositoryMock.getCharacter.mockResolvedValue(null);
      renderWithRouter(<App />, `/${gameId}/characters/missing-id`);

      expect(
        await screen.findByText("Character not found."),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("link", { name: "Back to characters" }),
      ).toHaveAttribute("href", `/${gameId}/characters`);
    },
  );

  it("shows a predictable error state for non-404 detail failures", async () => {
    repositoryMock.getCharacter.mockRejectedValue(
      new Error("private backend detail"),
    );
    renderWithRouter(<App />, "/poe2/characters/broken-id");

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Unable to load character. Please try again.",
    );
    expect(screen.queryByText("private backend detail")).not.toBeInTheDocument();
  });
});
