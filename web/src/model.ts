import { UserState, GameState, UserStatus, DiceResult } from "./types";
import {
  showDiceResult,
  showLockedDice,
  showPlayerIds,
  showScoreSheet,
  showUnlockedDice,
  showUserId,
  showUserStatus,
} from "./view";
import { sendMessage } from "./websocket";

class StateSingleton {
  game: GameState | undefined;
  user: UserState | undefined;

  setUserState(userState: UserState) {
    this.user = userState;
    showUserId(userState.id);
    showUserStatus(userState.status);
  }

  setUserStatus(status: UserStatus) {
    if (!this.user) {
      sendMessage("me");
      return;
    }

    this.user.status = status;
    showUserStatus(status);
  }

  setUserGameId(gameId: string) {
    if (!this.user) {
      sendMessage("me");
      return;
    }

    this.user.gameId = gameId;
  }

  setGameState(gameState: GameState) {
    if (!this.user) {
      sendMessage("me");
      return;
    }
    this.game = gameState;
    showPlayerIds(gameState.playerId);
    showScoreSheet(gameState.scores);
    showDiceResult(gameState.dice);
    for (let i = 0; i < 5; i++) {
      if (this.game.isLocked[i]) showLockedDice(i);
      else showUnlockedDice(i);
    }
  }

  setDiceResult(result: DiceResult) {
    showDiceResult(result);
  }

  setDiceLock(idx: number) {
    if (!this.user) {
      sendMessage("me");
      return;
    }

    if (!this.game) {
      sendMessage("gameState");
      return;
    }

    this.game.isLocked[idx] = true;
    showLockedDice(idx);
  }

  setDiceUnlock(idx: number) {
    if (!this.user) {
      sendMessage("me");
      return;
    }

    if (!this.game) {
      sendMessage("gameState");
      return;
    }

    this.game.isLocked[idx] = false;
    showUnlockedDice(idx);
  }

  setScore(playerId: string, scoreIdx: number, score: number) {
    if (!this.user) {
      sendMessage("me");
      return;
    }

    if (!this.game) {
      sendMessage("gameState");
      return;
    }

    const playerIdx = playerId === this.game?.playerId[0] ? 0 : 1;
    this.game.scores[playerIdx][scoreIdx] = score;
    showScoreSheet(this.game.scores);
  }
}

export const state = new StateSingleton();
