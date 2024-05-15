import { Pose } from "./animation";

export function formatJson(json: any) {
  let formattedJson = JSON.stringify(json, null, 2);

  formattedJson = formattedJson.replace(/(\[[\d,\s]+?\])/g, function(match) {
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
