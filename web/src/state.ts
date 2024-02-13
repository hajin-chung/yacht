import { setUserId, showIdle, showQueue } from "./ui";
import { sendMessage } from "./websocket";

type UserStatus = "IDLE" | "QUEUE" | "PLAYING";

export type UserState = {
  id: string,
  status: UserStatus,
  gameId: string,
}

type GameStatus = "PLAYING" | "DONE";

export type GameState = {
  id: string,
  playerId: [string, string],
  status: GameStatus,
  scores: [
    number[],
    number[]
  ],
  turn: number,
  leftRolls: number,
  isLocked: [boolean, boolean, boolean, boolean, boolean],
  dice: [number, number, number, number, number]
}

type State = {
  user?: UserState,
  game?: GameState,
}

const state: State = {};

export function handleMe(userState: UserState) {
  state.user = userState;

  setUserId(state.user.id)
  if (userState.status === "IDLE") {
    showIdle();
  } else if (userState.status === "QUEUE") {
    showQueue();
  } else if (userState.status === "PLAYING") {
    sendMessage("gameState")
  }
}

export function handleQueue() {
  if (state.user) state.user.status = "QUEUE";
  showQueue();
}

export function handleCancelQueue() {
  if (state.user) state.user.status = "IDLE";
  showIdle();
}

export function handleGameState(gameState: GameState) {
  state.game = gameState;
  // TODO:
}
