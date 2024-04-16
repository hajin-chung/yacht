import {
  onCancelQueue,
  onDecup,
  onEncup,
  onGameState,
  onLockDice,
  onQueue,
  onRoll,
  onShake,
} from "./controllers";
import { DiceResult, UserStatus } from "./type";
import { $ } from "./util";

export function initView() {
  $("#controls > #queue").onclick = onQueue;
  $("#controls > #cancelQueue").onclick = onCancelQueue;
  $("#controls > #gameState").onclick = onGameState;
  $("#controls > #shake").onclick = onShake;
  $("#controls > #encup").onclick = onEncup;
  $("#controls > #decup").onclick = onDecup;
  $("#controls > #roll").onclick = onRoll;
  for (let i = 0; i < 5; i++) {
    $(`#dice-${i+1}`).onclick = () => onLockDice(i);
  }
}

export function showUserId(id: string) {
  $("#userId").innerText = id;
}

export function showUserStatus(status: UserStatus) {
  $("#userStatus").innerText = status;
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
