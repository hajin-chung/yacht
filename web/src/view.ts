import {
  onCancelQueue,
  onDecup,
  onDiceClick,
  onEncup,
  onGameState,
  onQueue,
  onRoll,
  onSelectScore,
  onShake,
} from "./controller";
import { DiceResult, UserStatus } from "./types";
import { $, $$ } from "./utils";

export function initView() {
  // init button click handlers
  $("#controls > #queue").onclick = onQueue;
  $("#controls > #cancelQueue").onclick = onCancelQueue;
  $("#controls > #gameState").onclick = onGameState;
  $("#controls > #shake").onclick = onShake;
  $("#controls > #encup").onclick = onEncup;
  $("#controls > #decup").onclick = onDecup;
  $("#controls > #roll").onclick = onRoll;
  for (let i = 0; i < 5; i++) {
    $(`#dice-${i + 1}`).onclick = () => onDiceClick(i);
  }
  $$("#player1 > button").forEach((scoreButton, idx) => {
    scoreButton.onclick = () => onSelectScore(0, idx);
  });
  $$("#player2 > button").forEach((scoreButton, idx) => {
    scoreButton.onclick = () => onSelectScore(1, idx);
  });
}

export function showUserId(id: string) {
  // display user id
  $("#userId").innerText = id;
}

export function showUserStatus(status: UserStatus) {
  // remove
  $("#userStatus").innerText = status;
}

export function showPlayerIds(playerIds: string[]) {
  // show playerIds on score sheet
  $("#player1Id").innerText = playerIds[0];
  $("#player2Id").innerText = playerIds[1];
}

export function showScoreSheet(scores: [number[], number[]]) {
  // update score sheet scores
  $$("#player1 > button").forEach((elem, idx) => {
    elem.innerText = scores[0][idx].toString();
  });
  $$("#player2 > button").forEach((elem, idx) => {
    elem.innerText = scores[1][idx].toString();
  });
}

export function showShake() {
  // enable rapier and shake that cup
}

export function showEncup() {
  // move cup to shake position and move dice into the cup with position previously saved
}

// TODO: add isLocked and result to arguments
export function showDecup() {
  // save current stable dice positions
  // move cup to decup position
  // move dice to decup or lock position
}

// TODO: add isLocked to arguments
export function showDiceResult(result: DiceResult) {
  // animate dice result based on result and isLocked
  for (let i = 0; i < 5; i++) {
    $(`#dice-${i + 1}`).innerText = result[i].toString();
  }
}

export function showLockedDice(idx: number) {
  // animate dice to lock position
  $(`#dice-${idx + 1}`).classList.add("locked");
}

export function showUnlockedDice(idx: number) {
  // animate dice to unlock position
  $(`#dice-${idx + 1}`).classList.remove("locked");
}
