import type { RequestHandler, Response } from "express";
import type { GameId } from "@exile-companion/contracts";
import { CharacterService } from "./characterService.js";

interface CharacterParams extends Record<string, string> {
  gameId: string;
  characterId: string;
}

interface GameParams extends Record<string, string> {
  gameId: string;
}

function isGameId(value: string): value is GameId {
  return value === "poe1" || value === "poe2";
}

function invalidGameId(response: Response): void {
  response.status(400).json({
    error: {
      code: "INVALID_GAME_ID",
      message: "The specified game is not supported.",
    },
  });
}

export function createCharacterController(service: CharacterService) {
  const getCharacters: RequestHandler<GameParams> = async (request, response) => {
    const { gameId } = request.params;
    if (!isGameId(gameId)) {
      invalidGameId(response);
      return;
    }

    const characters = await service.getCharacters(gameId);
    response.json(characters);
  };

  const getCharacter: RequestHandler<CharacterParams> = async (
    request,
    response,
  ) => {
    const { gameId, characterId } = request.params;
    if (!isGameId(gameId)) {
      invalidGameId(response);
      return;
    }

    const character = await service.getCharacter(gameId, characterId);
    if (!character) {
      response.status(404).json({
        error: {
          code: "CHARACTER_NOT_FOUND",
          message: "Character not found.",
        },
      });
      return;
    }

    response.json(character);
  };

  return { getCharacters, getCharacter };
}
