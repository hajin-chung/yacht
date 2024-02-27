import { Rotation, Vector } from "@dimforge/rapier3d-compat";

/** generate random number between 1.0 and -1.0 */
export function random() {
  return 2 * Math.random() - 1;
}

export function vectorAdd(a: Vector, b: Vector): Vector {
  return { x: a.x + b.x, y: a.y + b.y, z: a.z + b.z };
}

export function formatJson(json: any) {
  let formattedJson = JSON.stringify(json, null, 2);

  formattedJson = formattedJson.replace(/(\[[\d,\s]+?\])/g, function(match) {
    return match.replace(/\s+/g, ' ');
  });

  return formattedJson;
}

export function di(id: string): HTMLElement {
  return document.getElementById(id)!
}

export function dqs(query: string): HTMLElement[] {
  return [...document.querySelectorAll(query)] as HTMLElement[]
}

export function dq(query: string): HTMLElement {
  return document.querySelector(query)!
}

export function isQuatNaN(quat: Rotation) {
  return isNaN(quat.w) || isNaN(quat.x) || isNaN(quat.y) || isNaN(quat.z)
}
