import { UserState, GameState, UserStatus, DiceResult } from "./types";
import {
  showResult,
  showLockedDice,
  showPlayerIds,
  showScoreSheet,
  showUnlockedDice,
  showUserId,
  showUserStatus,
  showEncup,
  showLeftRolls,
} from "./view";
import { sendMessage } from "./websocket";

class StateSingleton {
  game: GameState | undefined;
  user: UserState | undefined;

  reduceLeftRolls() {
    if (!this.game) {
      sendMessage("gameState");
      return;
    }

    this.game.leftRolls--;
    showLeftRolls(this.game.leftRolls);
  }

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
    showPlayerIds(gameState.playerIds, this.user.id, this.game.turn);
    showScoreSheet(gameState.scores, gameState.selected);
    showLeftRolls(this.game.leftRolls);
    if (this.game.leftRolls === 3) {
      showEncup(this.game.isLocked);
    } else {
      showResult(this.game.isLocked, this.game.dice, this.game.leftRolls === 0);
    }
  }

  setInCup(inCup: boolean) {
    if (!this.game) {
      sendMessage("gameState");
      return;
    }

    this.game.inCup = inCup;
    if (inCup) showEncup(this.game.isLocked);
    else showResult(this.game.isLocked, this.game.dice, this.game.leftRolls === 0);
  }

  setDiceResult(result: DiceResult) {
    if (!this.game) {
      sendMessage("gameState");
      return;
    }

    this.game.dice = result;
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
    showLockedDice(idx, this.game.dice[idx]);
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
    showUnlockedDice(idx, this.game.dice[idx]);
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

    const playerIdx = playerId === this.game?.playerIds[0] ? 0 : 1;
    this.game.scores[playerIdx][scoreIdx] = score;
    showScoreSheet(this.game.scores, this.game.selected);
  }
}

export const state = new StateSingleton();
