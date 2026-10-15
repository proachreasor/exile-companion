import { Router } from "express";
import { createCharacterController } from "./characterController.js";
import { CharacterService } from "./characterService.js";

export function createCharacterRoutes(service: CharacterService): Router {
  const router = Router();
  const controller = createCharacterController(service);

  router.get("/games/:gameId/characters", controller.getCharacters);
  router.get(
    "/games/:gameId/characters/:characterId",
    controller.getCharacter,
  );

  return router;
}
