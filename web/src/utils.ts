import { Vector } from "@dimforge/rapier3d-compat";
import { Pose } from "./animation";
import { DiceResult } from "./types";

export function formatJson(json: any) {
  let formattedJson = JSON.stringify(json, null, 2);

  formattedJson = formattedJson.replace(/(\[[\d,\s]+?\])/g, function (match) {
    return match.replace(/\s+/g, " ");
  });

  return formattedJson;
}

export function $(query: string): HTMLElement {
  return document.querySelector(query)!;
}

export function $$(query: string): HTMLElement[] {
  return [...document.querySelectorAll(query)]! as HTMLElement[];
}

export const cupX = 3;
export const cupY = 5;
export const fps = 30;

export function random() {
  return 2 * Math.random() - 1;
}

export function generateRandomDicePose(idx: number): Pose {
  return {
    translation: {
      x: cupX + 0.5 * random(),
      y: cupY + 2 * idx + 4,
      z: 0.5 * random(),
    },
    rotation: { w: 1, x: 0, y: 0, z: 0 },
  };
}

export function getMagnitude(v: Vector): number {
  return Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z);
}

export function minClamp(value: number, min: number): number {
  if (value < min) return min;
  else return value;
}

export function maxClamp(value: number, max: number): number {
  if (value < max) return value;
  else return max;
}

// returns combination name
// Four of a Kind, Full House, Small Straight, Large Straight, Yacht
export function getCombination(result: DiceResult): string | undefined {
  const countEyes = [0, 0, 0, 0, 0, 0];
  const countCount = [0, 0, 0, 0, 0, 0];
  result.forEach((eye) => countEyes[eye - 1]++);
  countEyes.forEach((count) => countCount[count]++);
  const maxEyeCount = countEyes.reduce(
    (max, cnt) => (cnt > max ? cnt : max),
    0,
  );
  if (maxEyeCount === 5) return "Yacht";
  else if (maxEyeCount === 4) return "Four of a Kind";
  else if (countCount[2] === 1 && countCount[3] === 1) return "Full House";

  let increase = countEyes[0] > 0 ? 1 : 0;
  let maxIncrease = increase;
  for (let i = 1; i < 6; i++) {
    if (countEyes[i] > 0) increase++;
    else increase = 0;

    if (increase > maxIncrease) maxIncrease = increase;
  }

  if (maxIncrease === 5) return "Large Straight";
  else if (maxIncrease === 4) return "Small Straight";

  return;
}
