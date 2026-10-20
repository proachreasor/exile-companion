import type { Character, GameId } from "@exile-companion/contracts";

interface ApiErrorBody {
  error?: {
    code?: unknown;
  };
}

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code?: string,
  ) {
    super(`API request failed with status ${status}`);
    this.name = "ApiError";
  }
}

async function throwResponseError(response: Response): Promise<never> {
  let code: string | undefined;

  try {
    const body: ApiErrorBody = await response.json();
    if (typeof body.error?.code === "string") {
      code = body.error.code;
    }
  } catch {
    // The HTTP status remains sufficient when the error body is not valid JSON.
  }

  throw new ApiError(response.status, code);
}

export async function getCharacters(
  gameId: GameId,
  signal?: AbortSignal,
): Promise<Character[]> {
  const response = await fetch(`/api/games/${gameId}/characters`, { signal });
  if (!response.ok) {
    return throwResponseError(response);
  }

  return response.json() as Promise<Character[]>;
}

export async function getCharacter(
  gameId: GameId,
  characterId: string,
  signal?: AbortSignal,
): Promise<Character> {
  const response = await fetch(
    `/api/games/${gameId}/characters/${encodeURIComponent(characterId)}`,
    { signal },
  );
  if (!response.ok) {
    return throwResponseError(response);
  }

  return response.json() as Promise<Character>;
}
