export type GameId = "poe1" | "poe2";

export interface Character {
  id: string;
  name: string;
  gameId: GameId;
  characterClass: string;
  level: number;
  league: string;
}
