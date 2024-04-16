import { state } from "./model";
import { GameState, RollData, UserState } from "./type";
import { sendMessage } from "./websocket";

export function handleMe(userState: UserState) {
  state.setUserState(userState);

  if (userState.status === "PLAYING") {
    sendMessage("gameState");
  }
}

export function handleQueue() {
  state.setUserStatus("QUEUE");
}

export function handleCancelQueue() {
  state.setUserStatus("IDLE");
}

export function handleGameStart(gameId: string) {
  state.setUserStatus("PLAYING");
  state.setUserGameId(gameId);
}

export function handleGameState(gameState: GameState) {
  state.setGameState(gameState);
}

export function handleShake() {}

export function handleEncup() {}

export function handleDecup() {}

export function handleRoll(data: RollData) {
  state.setDiceResult(data.result);
}

export function handleLockDice(diceIdx: number) {
  state.setDiceLock(diceIdx);
}

export function handleUnlockDice(diceIdx: number) {
  state.setDiceUnlock(diceIdx);
}

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

export function onLockDice(idx: number) {
  sendMessage("lockDice", { dice: idx });
}
