export type UserStatus = "IDLE" | "QUEUE" | "PLAYING";

export type UserState = {
  id: string;
  status: UserStatus;
  gameId: string;
};

type GameStatus = "PLAYING" | "DONE";

export type IsLocked = [boolean, boolean, boolean, boolean, boolean];
export type DiceResult = [number, number, number, number, number];

export type GameState = {
  id: string;
  playerId: [string, string];
  status: GameStatus;
  selected: [boolean[], boolean[]];
  scores: [number[], number[]];
  turn: number;
  leftRolls: number;
  inCup: boolean;
  isLocked: IsLocked;
  dice: DiceResult;
};

export type RollData = {
  result: DiceResult;
  buffer: Float32Array;
};

export type SelectScoreData = {
  playerId: string;
  selection: number;
  score: number;
};

export type SelectScorePayload = {
  selection: number;
}

export type DiceSelectData = {
  dice: number;
};
