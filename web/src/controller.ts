import { hideLobby, showIdle, showQueue, showUserId } from "./view";
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

export const state: State = {};

export function handleMe(userState: UserState) {
  state.user = userState;

  showUserId(userState.id)
  if (userState.status === "IDLE") {
    showIdle();
  } else if (userState.status === "QUEUE") {
    showQueue();
  } else if (userState.status === "PLAYING") {
    sendMessage("gameState");
  }
}

export function handleQueue() {
  if (!state.user) {
    sendMessage("me")
    return
  }

  state.user.status = "QUEUE";
  showQueue();
}

export function handleCancelQueue() {
  if (!state.user) {
    sendMessage("me")
    return
  }

  state.user.status = "IDLE";
  showIdle();
}

export function handleGameState(gameState: GameState) {
  if (!state.user) {
    sendMessage("me");
    return
  }

  state.game = gameState;
  yacht.updateState(gameState);
  hideLobby();
}

export function handleGameStart(gameId: string) {
  if (!state.user) {
    sendMessage("me");
    return
  }

  state.user.status = "PLAYING";
  state.user.gameId = gameId;
  hideLobby();
  sendMessage("gameState");
}

export function handleShake() {
  if (!state.user) {
    sendMessage("me");
    return
  }
  if (!state.game) {
    sendMessage("gameState");
    return
  }

  yacht.shake();
}

export function handleRoll(data: RollData) {
  if (!state.user) {
    sendMessage("me");
    return
  }
  if (!state.game) {
    sendMessage("gameState");
    return
  }

  yacht.roll(data);
}
