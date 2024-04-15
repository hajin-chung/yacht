import {
  onCancelQueue,
  onEncup,
  onGameState,
  onQueue,
  onRoll,
  onShake,
} from "./controllers";
import { UserStatus } from "./type";
import { $ } from "./util";

export function initView() {
  $("#controls > #queue").onclick = onQueue;
  $("#controls > #cancelQueue").onclick = onCancelQueue;
  $("#controls > #gameState").onclick = onGameState;
  $("#controls > #shake").onclick = onShake;
  $("#controls > #encup").onclick = onEncup;
  $("#controls > #decup").onclick = onEncup;
  $("#controls > #roll").onclick = onRoll;
}

export function showUserId(id: string) {
  $("#userId").innerText = id;
}

export function showUserStatus(status: UserStatus) {
  $("#userStatus").innerText = status;
}
