import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { Character, GameId } from "@exile-companion/contracts";
import { render } from "@testing-library/react";
import type { ReactNode } from "react";
import { MemoryRouter } from "react-router-dom";

export function createCharacter(
  gameId: GameId,
  overrides: Partial<Character> = {},
): Character {
  return {
    id: `${gameId}-character-1`,
    name: gameId === "poe1" ? "EmberKnight" : "FrostSage",
    gameId,
    characterClass: gameId === "poe1" ? "Marauder" : "Sorceress",
    level: gameId === "poe1" ? 92 : 76,
    league: "Standard",
    ...overrides,
  };
}

export function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export function createTestQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
}

export function renderWithRouter(
  node: ReactNode,
  initialPath: string,
  queryClient = createTestQueryClient(),
) {
  const result = render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[initialPath]}>{node}</MemoryRouter>
    </QueryClientProvider>,
  );

  return { ...result, queryClient };
}
