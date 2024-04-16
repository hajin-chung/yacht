import { UserState, GameState, UserStatus, DiceResult } from "./type";
import {
  showDiceResult,
  showLockedDice,
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
      sendMessage("game");
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
      sendMessage("game");
      return;
    }

    this.game.isLocked[idx] = true;
    showUnlockedDice(idx);
  }
}

export const state = new StateSingleton();
