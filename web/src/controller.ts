import { hideLobby, showIdle, showLeftRolls, showPlayers, showQueue, showScores, showUserId } from "./view";
import { RollData, sendMessage } from "./websocket";
import { yacht } from "./yacht";

type UserStatus = "IDLE" | "QUEUE" | "PLAYING";

export type UserState = {
  id: string,
  status: UserStatus,
  gameId: string,
}

type GameStatus = "PLAYING" | "DONE";

export type IsLocked = [boolean, boolean, boolean, boolean, boolean];
export type DiceResult = [number, number, number, number, number];

export type GameState = {
  id: string,
  playerId: [string, string],
  status: GameStatus,
  selected: [
    boolean[],
    boolean[]
  ],
  scores: [
    number[],
    number[]
  ],
  turn: number,
  leftRolls: number,
  isLocked: IsLocked,
  dice: DiceResult,
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

  showPlayers(gameState.playerId);
  showScores(gameState.scores, gameState.selected);
  showLeftRolls(gameState.leftRolls);

  if (gameState.leftRolls === 3) {
    yacht.reset();
  } else {
    yacht.showResult(gameState.isLocked, gameState.dice);
  }

  hideLobby();
}

export function handleGameStart(gameId: string) {
  if (!state.user) {
    sendMessage("me");
    return
  }

  state.user.status = "PLAYING";
  state.user.gameId = gameId;
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

  state.game.leftRolls--;
  showLeftRolls(state.game.leftRolls);
  let resultIdx = 0;
  for (let i = 0; i < 5; i++) {
    if (!state.game.isLocked[i]) {
      state.game.dice[i] = data.result[resultIdx];
      resultIdx++;
    }
  }

  yacht.roll(data.buffer, data.result.length, state.game.isLocked, state.game.dice);
}

export function handleSelectScore() {
  if (!state.user) {
    sendMessage("me");
    return
  }
  if (!state.game) {
    sendMessage("gameState");
    return
  }

  sendMessage("gameState");
}

export function handleLockDice(dice: number) {
  if (!state.user) {
    sendMessage("me");
    return
  }
  if (!state.game) {
    sendMessage("gameState");
    return
  }

  state.game.isLocked[dice] = true;
  yacht.diceList[dice].lock();
}

export function handleUnlockDice(dice: number) {
  if (!state.user) {
    sendMessage("me");
    return
  }
  if (!state.game) {
    sendMessage("gameState");
    return
  }

  state.game.isLocked[dice] = false;
  yacht.diceList[dice].unlock();
}

export function onShake() {
  if (!state.user) {
    sendMessage("me");
    return
  }
  if (!state.game) {
    sendMessage("gameState");
    return
  }
  if (state.game.playerId[state.game.turn % 2] !== state.user.id) return

  sendMessage("shake");
}

export function onRoll() {
  if (!state.user) {
    sendMessage("me");
    return
  }
  if (!state.game) {
    sendMessage("gameState");
    return
  }
  if (state.game.playerId[state.game.turn % 2] !== state.user.id) return

  sendMessage("roll");
}

export function onCup() {
  if (!state.user) {
    sendMessage("me");
    return
  }
  if (!state.game) {
    sendMessage("gameState");
    return
  }

  if (yacht.diceState === "RESULT") {
    yacht.encup();
  } else {
    yacht.showResult(state.game.isLocked, state.game.dice);
  }
}

export function onScoreSelect(playerIdx: number, scoreIdx: number) {
  if (!state.user) {
    sendMessage("me");
    return
  }
  if (!state.game) {
    sendMessage("gameState");
    return
  }
  if (state.game.turn % 2 !== playerIdx) return;
  if (state.game.playerId[state.game.turn % 2] !== state.user.id) return

  sendMessage("selectScore", { selection: scoreIdx })
}
