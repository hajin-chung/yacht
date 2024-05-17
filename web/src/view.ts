import {
  Keyframe,
  Pose,
  generateCupIn,
  generateCupOut,
  generateCupRoll,
  generateDiceLock,
  generateDiceResult,
  generateEncupDice,
  generateShake,
} from "./animation";
import {
  onCancelQueue,
  onQueue,
  onRoll,
  onSelectScore,
  onShake,
} from "./controller";
import { scene } from "./scene";
import { DiceResult, IsLocked, UserStatus } from "./types";
import { $, $$ } from "./utils";
import * as THREE from "three";

export const pointer: THREE.Vector2 = new THREE.Vector2();
export let isMouseDown = false;

export function initView() {
  // init button click handlers
  $("#queue").onclick = onQueue;
  $("#cancelQueue").onclick = onCancelQueue;
  $("#controls #shake").onclick = onShake;
  $("#controls #roll").onclick = onRoll;

  $$("#player1 > button").forEach((scoreButton, idx) => {
    scoreButton.onclick = () => onSelectScore(0, idx);
  });
  $$("#player2 > button").forEach((scoreButton, idx) => {
    scoreButton.onclick = () => onSelectScore(1, idx);
  });

  window.addEventListener("pointermove", (e) => {
    pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
    pointer.y = -(e.clientY / window.innerHeight) * 2 + 1;
  });

  window.addEventListener("mousedown", () => (isMouseDown = true));
  window.addEventListener("mouseup", () => (isMouseDown = false));
  window.addEventListener("mouseout", () => (isMouseDown = false));
}

export function showLoading() {
  $("#loading").style.display = "";
}

export function hideLoading() {
  $("#loading").style.display = "none";
}

export function showIdle() {
  showLobby();
  $("#queueLoading").style.display = "none";
  $("#queue").style.display = "";
}

export function showQueue() {
  showLobby();
  $("#queueLoading").style.display = "";
  $("#queue").style.display = "none";
}

export function showLobby() {
  $("#lobby").style.display = "";
}

export function hideLobby() {
  $("#lobby").style.display = "none";
}

export function showUserId(id: string) {
  // display user id
  $("#userId").innerText = id;
}

export function showUserStatus(status: UserStatus) {
  if (status === "IDLE") showIdle();
  else if (status === "QUEUE") showQueue();
  else if (status === "PLAYING") hideLobby();
}

export function showPlayerIds(playerIds: string[]) {
  // show playerIds on score sheet
  $("#player1Id").innerText = playerIds[0];
  $("#player2Id").innerText = playerIds[1];
}

export function showScoreSheet(
  scores: [number[], number[]],
  selected: [boolean[], boolean[]],
) {
  // update score sheet scores
  $$("#player1 > button").forEach((elem, idx) => {
    if (selected[0][idx]) {
      elem.innerText = scores[0][idx].toString();
      elem.classList.add("selected");
    }
  });
  $$("#player2 > button").forEach((elem, idx) => {
    if (selected[1][idx]) {
      elem.innerText = scores[1][idx].toString();
      elem.classList.add("selected");
    }
  });
}

export function showShake() {
  scene.cup.keyframes.push(...generateShake());
}

export function showEncup(isLocked: IsLocked) {
  scene.cup.keyframes.push(...generateCupIn());
  scene.diceList.forEach((dice, idx) => {
    if (!isLocked[idx]) {
      dice.keyframes.push(...generateEncupDice(idx));
      dice.keyframes.push({
        type: "wait",
        steps: 0,
        callback: () => (dice.simulate = true),
      });
    }
  });
}

export function showRoll(isLocked: IsLocked, buffer: Float32Array) {
  // cup roll animation
  scene.cup.keyframes.push(...generateCupRoll());

  // dice roll animation
  const freeDice = isLocked.reduce((acc, v) => (v ? acc : acc + 1), 0);
  if (buffer.length % (7 * freeDice) !== 0) return;

  const blockLength = buffer.length / (7 * freeDice);

  for (let i = 0; i < 5; i++) {
    if (isLocked[i]) {
      scene.diceList[i].keyframes.push({
        type: "wait",
        steps: 16 + blockLength,
      });
      continue;
    }

    scene.diceList[i].keyframes.push({
      type: "wait",
      steps: 0,
      callback: () => (scene.diceList[i].simulate = true),
    });
    scene.diceList[i].keyframes.push({
      type: "wait",
      steps: 16,
      callback: () => (scene.diceList[i].simulate = false),
    });
  }

  for (let i = 0; i < blockLength; i++) {
    for (let j = 0, idx = 0; j < 5; j++) {
      if (isLocked[j]) continue;

      const offset = i * (7 * freeDice) + idx * 7;
      const pose: Pose = {
        translation: {
          x: buffer[offset],
          y: buffer[offset + 1],
          z: buffer[offset + 2],
        },
        rotation: {
          x: buffer[offset + 3],
          y: buffer[offset + 4],
          z: buffer[offset + 5],
          w: buffer[offset + 6],
        },
      };
      const keyframe: Keyframe = { pose, type: "pose" };
      scene.diceList[j].keyframes.push(keyframe);
      idx++;
    }
  }
}

export function showResult(
  isLocked: IsLocked,
  result: DiceResult,
  isLastRoll: boolean,
) {
  scene.cup.keyframes.push(...generateCupOut());

  scene.diceList.forEach((dice) =>
    dice.keyframes.push({
      type: "wait",
      steps: 0,
      callback: () => (dice.simulate = false),
    }),
  );
  for (let i = 0; i < 5; i++) {
    if (isLastRoll) {
      showUnlockedDice(i, result[i]);
    } else {
      if (isLocked[i]) showLockedDice(i, result[i]);
      else showUnlockedDice(i, result[i]);
    }
  }
}

export function showLockedDice(idx: number, result: number) {
  // animate dice to lock position
  scene.diceList[idx].keyframes.push(...generateDiceLock(idx, result));
}

export function showUnlockedDice(idx: number, result: number) {
  // animate dice to unlock position
  scene.diceList[idx].keyframes.push(...generateDiceResult(idx, result));
}
