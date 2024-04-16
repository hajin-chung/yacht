import { state } from "./model";
import { GameState, RollData, UserState } from "./types";
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
  sendMessage("gameState");
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

export function handleSelectScore(
  playerId: string,
  scoreIdx: number,
  score: number,
) {
  state.setScore(playerId, scoreIdx, score);
  sendMessage("gameState");
}

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

export function onDiceClick(idx: number) {
  if (state.game?.isLocked[idx]) sendMessage("unlockDice", { dice: idx });
  else sendMessage("lockDice", { dice: idx });
}

export function onSelectScore(playerIdx: number, scoreIdx: number) {
  if (!state.game || !state.user) return;
  if (state.game.playerId[playerIdx] === state.user.id) {
    sendMessage("selectScore", { selection: scoreIdx });
  }
}
