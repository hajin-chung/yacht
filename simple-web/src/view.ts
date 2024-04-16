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
} from "./controllers";
import { DiceResult, UserStatus } from "./type";
import { $, $$ } from "./util";

export function initView() {
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
  $("#userId").innerText = id;
}

export function showUserStatus(status: UserStatus) {
  $("#userStatus").innerText = status;
}

export function showPlayerIds(playerIds: string[]) {
  $("#player1Id").innerText = playerIds[0];
  $("#player2Id").innerText = playerIds[1];
}

export function showScoreSheet(scores: [number[], number[]]) {
  $$("#player1 > button").forEach((elem, idx) => {
    elem.innerText = scores[0][idx].toString();
  });
  $$("#player2 > button").forEach((elem, idx) => {
    elem.innerText = scores[1][idx].toString();
  });
}

export function showDiceResult(result: DiceResult) {
  for (let i = 0; i < 5; i++) {
    $(`#dice-${i + 1}`).innerText = result[i].toString();
  }
}

export function showLockedDice(idx: number) {
  $(`#dice-${idx + 1}`).classList.add("locked");
}

export function showUnlockedDice(idx: number) {
  $(`#dice-${idx + 1}`).classList.remove("locked");
}
