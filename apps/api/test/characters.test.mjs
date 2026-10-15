import assert from "node:assert/strict";
import { after, before, mock, test } from "node:test";
import { app, createApp } from "../dist/app.js";
import { CharacterService } from "../dist/features/characters/characterService.js";

let server;
let baseUrl;

function listen(expressApp) {
  const testServer = expressApp.listen(0);
  return new Promise((resolve) => {
    testServer.once("listening", () => {
      const address = testServer.address();
      assert.ok(address && typeof address !== "string");
      resolve({
        server: testServer,
        baseUrl: `http://127.0.0.1:${address.port}`,
      });
    });
  });
}

before(async () => {
  const listening = await listen(app);
  server = listening.server;
  baseUrl = listening.baseUrl;
});

after(async () => {
  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
});

test("GET character lists returns data from the selected game's provider", async () => {
  const poe1Response = await fetch(`${baseUrl}/api/games/poe1/characters`);
  const poe2Response = await fetch(`${baseUrl}/api/games/poe2/characters`);
  const poe1Characters = await poe1Response.json();
  const poe2Characters = await poe2Response.json();

  assert.equal(poe1Response.status, 200);
  assert.equal(poe2Response.status, 200);
  assert.ok(poe1Characters.length > 0);
  assert.ok(poe2Characters.length > 0);
  assert.ok(poe1Characters.every((character) => character.gameId === "poe1"));
  assert.ok(poe2Characters.every((character) => character.gameId === "poe2"));
  assert.notEqual(poe1Characters[0].id, poe2Characters[0].id);
});

test("GET character detail returns the matching game-specific character", async () => {
  const listResponse = await fetch(`${baseUrl}/api/games/poe2/characters`);
  const [character] = await listResponse.json();
  const response = await fetch(
    `${baseUrl}/api/games/poe2/characters/${character.id}`,
  );

  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), character);
});

test("invalid game IDs return 400 with the shared error shape", async () => {
  for (const path of [
    "/api/games/poe3/characters",
    "/api/games/poe3/characters/any-character",
  ]) {
    const response = await fetch(`${baseUrl}${path}`);

    assert.equal(response.status, 400);
    assert.deepEqual(await response.json(), {
      error: {
        code: "INVALID_GAME_ID",
        message: "The specified game is not supported.",
      },
    });
  }
});

test("missing and cross-game character lookups return 404", async () => {
  const missingResponse = await fetch(
    `${baseUrl}/api/games/poe1/characters/not-a-character`,
  );
  const poe1ListResponse = await fetch(`${baseUrl}/api/games/poe1/characters`);
  const poe1Characters = await poe1ListResponse.json();
  const poe1Character = poe1Characters[0];
  assert.ok(poe1Character);
  assert.equal(poe1Character.gameId, "poe1");

  const crossGameResponse = await fetch(
    `${baseUrl}/api/games/poe2/characters/${poe1Character.id}`,
  );

  assert.equal(missingResponse.status, 404);
  assert.deepEqual(await missingResponse.json(), {
    error: {
      code: "CHARACTER_NOT_FOUND",
      message: "Character not found.",
    },
  });
  assert.equal(crossGameResponse.status, 404);
  assert.deepEqual(await crossGameResponse.json(), {
    error: {
      code: "CHARACTER_NOT_FOUND",
      message: "Character not found.",
    },
  });
});

test("unexpected errors are logged and return a generic 500 response", async (context) => {
  const secret = "provider implementation detail";
  const failingProvider = {
    async getCharacters() {
      throw new Error(secret);
    },
    async getCharacter() {
      throw new Error(secret);
    },
  };
  const failingApp = createApp(
    new CharacterService(failingProvider, failingProvider),
  );
  const listening = await listen(failingApp);
  const log = context.mock.method(console, "error", () => {});

  try {
    const response = await fetch(
      `${listening.baseUrl}/api/games/poe1/characters`,
    );

    assert.equal(response.status, 500);
    assert.deepEqual(await response.json(), {
      error: {
        code: "INTERNAL_ERROR",
        message: "An unexpected error occurred.",
      },
    });
    assert.ok(
      log.mock.calls.some((call) =>
        call.arguments.some(
          (argument) => argument instanceof Error && argument.message === secret,
        ),
      ),
    );
  } finally {
    await new Promise((resolve, reject) => {
      listening.server.close((error) => (error ? reject(error) : resolve()));
    });
  }
});
