import { GameState, RollData, UserState } from "./type";
import { showUserStatus, showUserId } from "./view";
import { sendMessage } from "./websocket";

const state: { user?: UserState; game?: GameState } = {};

export function handleMe(userState: UserState) {
  state.user = userState;
  showUserId(userState.id);
  showUserStatus(userState.status);
}

export function handleQueue() {
  if (state.user) state.user.status = "QUEUE";
  showUserStatus("QUEUE");
}

export function handleCancelQueue() {
  if (state.user) state.user.status = "IDLE";
  showUserStatus("IDLE");
}

export function handleGameStart(gameId: string) {
  if (!state.user) {
    sendMessage("me");
    return;
  }

  state.user.status = "PLAYING";
  state.user.gameId = gameId;
  showUserStatus("PLAYING");
}

export function handleGameState(gameState: GameState) {
  if (!state.user) {
    sendMessage("me");
    return;
  }

  state.game = gameState;
}

export function handleShake() {}

export function handleEncup() {}

export function handleDecup() {}

export function handleRoll(data: RollData) {}

export function handleLockDice(diceIdx: number) {}

export function handleUnlockDice(diceIdx: number) {}

export function handleSelectScore(scoreIdx: number) {}

export function onQueue() {
  sendMessage("queue");
}

export function onCancelQueue() {
  sendMessage("cancelQueue");
}

export function onGameState() {
  sendMessage("gameState");
}

export function onShake() {
  sendMessage("shake");
}

export function onEncup() {
  sendMessage("encup");
}

export function onDecup() {
  sendMessage("decup");
}

export function onRoll() {
  sendMessage("roll");
}
