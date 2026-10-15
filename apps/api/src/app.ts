import express from "express";
import { createCharacterRoutes } from "./features/characters/characterRoutes.js";
import { CharacterService } from "./features/characters/characterService.js";
import { errorHandler } from "./middleware/errorHandler.js";

export function createApp(characterService = new CharacterService()) {
  const app = express();

  app.get("/api/health", (_request, response) => {
    response.json({ status: "ok" });
  });
  app.use("/api", createCharacterRoutes(characterService));
  app.use(errorHandler);

  return app;
}

export const app = createApp();
