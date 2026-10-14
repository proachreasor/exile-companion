import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import App from "./App";

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>,
  );
}

describe("game routes", () => {
  it.each([
    ["/poe1", "Path of Exile 1 Dashboard", "poe1"],
    ["/poe2", "Path of Exile 2 Dashboard", "poe2"],
    ["/poe1/characters", "Path of Exile 1 Characters", "poe1"],
    ["/poe2/characters", "Path of Exile 2 Characters", "poe2"],
  ])("renders %s with game %s selected", (path, heading, gameId) => {
    renderAt(path);

    expect(screen.getByRole("heading", { name: heading })).toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: "Game" })).toHaveValue(gameId);
  });

  it("shows the game selection landing page at the root", () => {
    renderAt("/");

    const navigation = screen.getByRole("navigation", {
      name: "Choose a game",
    });
    expect(
      within(navigation).getByRole("link", { name: "Path of Exile 1" }),
    ).toHaveAttribute("href", "/poe1");
    expect(
      within(navigation).getByRole("link", { name: "Path of Exile 2" }),
    ).toHaveAttribute("href", "/poe2");
  });

  it.each([
    ["/poe1", "poe2", "Path of Exile 2 Dashboard"],
    ["/poe1/characters", "poe2", "Path of Exile 2 Characters"],
    ["/poe2", "poe1", "Path of Exile 1 Dashboard"],
    ["/poe2/characters", "poe1", "Path of Exile 1 Characters"],
  ])("switches from %s to %s while preserving the page", async (
    path,
    nextGameId,
    expectedHeading,
  ) => {
    const user = userEvent.setup();
    renderAt(path);

    await user.selectOptions(
      screen.getByRole("combobox", { name: "Game" }),
      nextGameId,
    );

    expect(
      screen.getByRole("heading", { name: expectedHeading }),
    ).toBeInTheDocument();
  });

  it("switches from character details to the other game's character list", async () => {
    const user = userEvent.setup();
    renderAt("/poe1/characters/example-character");

    expect(
      screen.getByRole("heading", { name: "Path of Exile 1 Character" }),
    ).toBeInTheDocument();

    await user.selectOptions(
      screen.getByRole("combobox", { name: "Game" }),
      "poe2",
    );

    expect(
      screen.getByRole("heading", { name: "Path of Exile 2 Characters" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "Path of Exile 2 Character" }),
    ).not.toBeInTheDocument();
  });

  it.each(["/poe3", "/poe1/inventory", "/unmatched/path"])(
    "shows not found for %s",
    (path) => {
      renderAt(path);

      expect(
        screen.getByRole("heading", { name: "Page not found" }),
      ).toBeInTheDocument();
    },
  );
});
