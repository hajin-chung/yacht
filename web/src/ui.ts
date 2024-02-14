import { di, dq, dqs } from "./utils";
import { sendMessage } from "./websocket";

let spinnerInterval: number;

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
  return new Promise<void>((resolve) => {
    setTimeout(() => {
      clearInterval(spinnerInterval);
      di("loading").style.display = "none";
      resolve();
    }, 1000);
  })
}

export function setUserId(userId: string) {
  di("userId").innerText = userId;
}

let spinnerId: number;

export function showIdle() {
  di("queueLoading").style.display = "none";
  di("queueButton").innerText = "PLAY"
  di("queueButton").onclick = () => {
    sendMessage("queue")
  }

  if (spinnerId !== undefined) clearInterval(spinnerId);
}

export function showQueue() {
  di("queueLoading").style.display = "";
  di("queueButton").innerText = "CANCEL"
  di("queueButton").onclick = () => {
    sendMessage("cancelQueue")
  }
  spinnerId = setInterval(() => {
    const dice = dq("#queueLoading .dice-spinner") as HTMLImageElement
    dice.src = `/images/dice_${Math.ceil(6 * Math.random())}.png`;
    console.log(dice.src)
  }, 1000);
}

export function hideLobby() {
  di("lobby").classList.add("hide")
}
