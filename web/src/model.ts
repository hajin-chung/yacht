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

  next() {
    if (!this.game) {
      sendMessage("gameState");
      return;
    }

    const nextGameState = structuredClone(this.game);
    for (let i = 0; i < 5; i++) {
      nextGameState.isLocked[i] = false;
      nextGameState.dice[i] = 0;
    }
    nextGameState.leftRolls = 3;
    nextGameState.turn++;
    nextGameState.inCup = true;

    this.setGameState(nextGameState);
  }

  setInCup(inCup: boolean) {
    if (!this.game) {
      sendMessage("gameState");
      return;
    }

    this.game.inCup = inCup;
    if (inCup) showEncup(this.game.isLocked);
    else
      showResult(this.game.isLocked, this.game.dice, this.game.leftRolls === 0);
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
    this.game.selected[playerIdx][scoreIdx] = true;
    this.game.scores[playerIdx][scoreIdx] = score;
    showScoreSheet(this.game.scores, this.game.selected);
  }

  didWin() {
    if (!this.user) {
      sendMessage("me");
      return false;
    }

    if (!this.game) {
      sendMessage("gameState");
      return false;
    }

    let maxScorePlayerIdx = 0;
    const scoreSums = this.game.scores.map((score) =>
      score.reduce((acc, s) => acc + s, 0),
    );
    for (let i = 0; i < scoreSums.length; i++) {
      if (scoreSums[i] > scoreSums[maxScorePlayerIdx]) {
        maxScorePlayerIdx = i;
      }
    }

    return (
      scoreSums[maxScorePlayerIdx] ===
      scoreSums[this.game.playerIds.indexOf(this.user.id)]
    );
  }
}

export const state = new StateSingleton();
