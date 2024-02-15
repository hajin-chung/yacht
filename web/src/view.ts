import { di, dq, dqs } from "./utils";
import { sendMessage } from "./websocket";

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
    console.log(dice.src)
  }, 1000);
}

export function hideLobby() {
  di("lobby").classList.add("hide")
}
