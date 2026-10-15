import assert from "node:assert/strict";
import { test } from "node:test";
import { CharacterService } from "../dist/features/characters/characterService.js";

function createFakeProvider(gameId) {
  const calls = {
    getCharacters: 0,
    getCharacter: [],
  };
  const character = {
    id: `${gameId}-test-character`,
    name: `${gameId} test character`,
    gameId,
    characterClass: "Test Class",
    level: 1,
    league: "Test League",
  };

  return {
    calls,
    character,
    provider: {
      async getCharacters() {
        calls.getCharacters += 1;
        return [character];
      },
      async getCharacter(characterId) {
        calls.getCharacter.push(characterId);
        return characterId === character.id ? character : null;
      },
    },
  };
}

test("CharacterService selects the PoE 1 provider for list and detail lookups", async () => {
  const poe1 = createFakeProvider("poe1");
  const poe2 = createFakeProvider("poe2");
  const service = new CharacterService(poe1.provider, poe2.provider);

  assert.deepEqual(await service.getCharacters("poe1"), [poe1.character]);
  assert.equal(
    await service.getCharacter("poe1", poe1.character.id),
    poe1.character,
  );
  assert.equal(poe1.calls.getCharacters, 1);
  assert.deepEqual(poe1.calls.getCharacter, [poe1.character.id]);
  assert.equal(poe2.calls.getCharacters, 0);
  assert.deepEqual(poe2.calls.getCharacter, []);
});

test("CharacterService selects the PoE 2 provider for list and detail lookups", async () => {
  const poe1 = createFakeProvider("poe1");
  const poe2 = createFakeProvider("poe2");
  const service = new CharacterService(poe1.provider, poe2.provider);

  assert.deepEqual(await service.getCharacters("poe2"), [poe2.character]);
  assert.equal(
    await service.getCharacter("poe2", poe2.character.id),
    poe2.character,
  );
  assert.equal(poe2.calls.getCharacters, 1);
  assert.deepEqual(poe2.calls.getCharacter, [poe2.character.id]);
  assert.equal(poe1.calls.getCharacters, 0);
  assert.deepEqual(poe1.calls.getCharacter, []);
});
