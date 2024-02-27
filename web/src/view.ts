import { onRoll, onScoreSelect, onShake, onCup } from "./controller";
import { di, dq, dqs } from "./utils";
import { sendMessage } from "./websocket";

export function initView() {
  di("shake").onclick = onShake;
  di("roll").onclick = onRoll;
  di("cup").onclick = onCup;

  dqs(".scoreButton").forEach((scoreButton, i) => {
    const playerIdx = i % 2;
    const scoreIdx = Math.floor(i / 2);
    scoreButton.onclick = () => onScoreSelect(playerIdx, scoreIdx);
  })
}

let spinnerInterval: number | undefined;

export function showLoading() {
  di("loading").style.display = "null";
  spinnerInterval = setInterval(() => {
    dqs(".dice-spinner").forEach((dice) => {
      (dice as HTMLImageElement).src =
        `/images/dice_${Math.ceil(6 * Math.random())}.png`
    })
  }, 1000);
}

export async function hideLoading() {
  spinnerInterval = undefined;
  return new Promise<void>((resolve) => {
    setTimeout(() => {
      clearInterval(spinnerInterval);
      di("loading").style.display = "none";
      resolve();
    }, 1000);
  })
}

export function showUserId(userId: string) {
  di("userId").innerText = userId;
}

export function showIdle() {
  di("queueLoading").style.display = "none";
  di("queueButton").innerText = "PLAY"
  di("queueButton").onclick = () => {
    sendMessage("queue")
  }

  if (spinnerInterval !== undefined) {
    spinnerInterval = undefined;
    clearInterval(spinnerInterval);
  }
}

export function showQueue() {
  di("queueLoading").style.display = "";
  di("queueButton").innerText = "CANCEL"
  di("queueButton").onclick = () => {
    sendMessage("cancelQueue")
  }
  spinnerInterval = setInterval(() => {
    const dice = dq("#queueLoading .dice-spinner") as HTMLImageElement
    dice.src = `/images/dice_${Math.ceil(6 * Math.random())}.png`;
  }, 1000);
}

export function hideLobby() {
  if (spinnerInterval !== undefined) clearInterval(spinnerInterval);
  di("lobby").classList.add("hide")
}

export function showLobby() {
  di("lobby").classList.remove("hide")
}

export function showPlayers(playerId: string[]) {
  di("player1").innerText = playerId[0];
  di("player2").innerText = playerId[1];
}

export function showScores(
  scores: [number[], number[]], selected: [boolean[], boolean[]]) {
  dqs(".scoreButton").forEach((scoreButton, idx) => {
    const playerIdx = idx % 2;
    const scoreIdx = Math.floor(idx / 2);
    if (selected[playerIdx][scoreIdx])
      scoreButton.innerText = scores[playerIdx][scoreIdx].toString();
  })
}

export function showLeftRolls(leftRolls: number) {
  di("leftRolls").innerText = `Left Rolls: ${leftRolls}`;
}
