import { Vector } from "@dimforge/rapier3d-compat";

export function random() {
  return 2 * Math.random() - 1;
}

export function vectorAdd(a: Vector, b: Vector): Vector {
  return { x: a.x + b.x, y: a.y + b.y, z: a.z + b.z };
}
