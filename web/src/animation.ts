import { Rotation, Vector } from "@dimforge/rapier3d-compat";
import * as THREE from "three";
import { Callback } from "./types";
import { cupX, cupY } from "./constants";
import { isQuatNaN, random } from "./utils";

export interface Animation {
  frames: Frame[];
  callback?: Callback;
};

export interface Frame {
  translation?: Vector;
  rotation?: Rotation;
}

function generateCupShake(): Frame[] {
  const dx = 0.4;
  const dy = 1.2;
  const dz = 0.0;
  const leftFrame: Frame = { translation: { x: cupX - dx, y: cupY - dy, z: -dz } }
  const rightFrame: Frame = { translation: { x: cupX + dx, y: cupY - dy, z: dz } }
  const originalFrame: Frame = { translation: { x: cupX, y: cupY, z: 0 } }
  const steps = 15;
  const frames: Frame[] = [];

  frames.push(...interpolate(originalFrame, leftFrame, steps));
  frames.push(...interpolate(leftFrame, originalFrame, steps));
  frames.push(...interpolate(originalFrame, rightFrame, steps));
  frames.push(...interpolate(rightFrame, originalFrame, steps));

  return frames;
}

export const shakeAnimation = generateCupShake();

function generateCupRoll(): Frame[] {
  const dt = (Math.PI * 3) / 4;

  const currentFrame: Frame = {
    translation: { x: cupX, y: cupY, z: 0 },
    rotation: { w: 1, x: 0, y: 0, z: 0 },
  };

  const quat = new THREE.Quaternion();
  quat.setFromAxisAngle({ x: 0, y: 0, z: 1 }, dt);
  const rotateFrame: Frame = {
    translation: { x: cupX, y: cupY, z: 0 },
    rotation: quat
  };

  return interpolate(currentFrame, rotateFrame);
}

export const rollAnimation = generateCupRoll();

export function generateCupMove(currentFrame: Frame) {
  const dx = 2;

  const movedFrame: Frame = {
    translation: { x: cupX + dx, y: cupY, z: 0 },
    rotation: { w: 1, x: 0, y: 0, z: 0 }
  };
  return interpolate(currentFrame, movedFrame);
}

export function generateCupReset(currentFrame: Frame): Frame[] {
  const resultFrame: Frame = {
    translation: { x: cupX, y: cupY, z: 0 },
    rotation: { w: 1, x: 0, y: 0, z: 0 },
  };
  return interpolate(currentFrame, resultFrame);
}

function interpolateVec(a: Vector, b: Vector, t: number): Vector {
  return {
    x: a.x * (1 - t) + b.x * t,
    y: a.y * (1 - t) + b.y * t,
    z: a.z * (1 - t) + b.z * t,
  }
}

function interpolateQuat(a: Rotation, b: Rotation, t: number): Rotation {
  if (isQuatNaN(a)) a = { w: 1, x: 0, y: 0, z: 0 };
  if (isQuatNaN(b)) b = { w: 1, x: 0, y: 0, z: 0 };
  const omega = Math.acos(a.x * b.x + a.y * b.y + a.z * b.z + a.w * b.w);
  return {
    x: a.x * Math.sin((1 - t) * omega) / Math.sin(omega) + b.x * Math.sin(t * omega) / Math.sin(omega),
    y: a.y * Math.sin((1 - t) * omega) / Math.sin(omega) + b.y * Math.sin(t * omega) / Math.sin(omega),
    z: a.z * Math.sin((1 - t) * omega) / Math.sin(omega) + b.z * Math.sin(t * omega) / Math.sin(omega),
    w: a.w * Math.sin((1 - t) * omega) / Math.sin(omega) + b.w * Math.sin(t * omega) / Math.sin(omega),
  }
}

export function interpolate(current: Frame, result: Frame, steps?: number): Frame[] {
  const frames: Frame[] = [];
  if (!steps) steps = 100;

  console.log(current);
  for (let i = 1; i <= steps; i++) {
    const t = i / steps;
    frames.push({});
    if (current.translation && result.translation) {
      frames[i - 1].translation = interpolateVec(current.translation, result.translation, t);
    }
    if (current.rotation && result.rotation) {
      frames[i - 1].rotation = interpolateQuat(current.rotation, result.rotation, t);
    }
  }
  return frames;
}

const rotations: Rotation[] = [
  { w: 1, x: 0, y: 0, z: 0 }, //
  { w: 0.707, x: -0.707, y: 0, z: 0 }, //
  { w: 0.707, x: 0, y: 0, z: -0.707 }, //
  { w: 0.707, x: 0, y: 0, z: 0.707 }, // 
  { w: 0.707, x: 0.707, y: 0, z: 0 }, //
  { w: 0, x: 0.707, y: 0, z: 0.707 }, //
]

export function generateResult(current: Frame, result: number, diceIdx: number): Frame[] {
  const resultFrame: Frame = {
    translation: {
      x: -2.2 + diceIdx * 1.1,
      y: 4,
      z: 0,
    },
    rotation: rotations[result - 1],
  };
  return interpolate(current, resultFrame);
}

export function generateLock(current: Frame, result: number, diceIdx: number): Frame[] {
  const resultFrame: Frame = {
    translation: {
      x: -2.2 + diceIdx * 1.1,
      y: 3,
      z: -3.3,
    },
    rotation: rotations[result - 1],
  };
  return interpolate(current, resultFrame);
}

export function generateEncup(current: Frame, result: number): Frame[] {
  const resultFrame: Frame = {
    translation: {
      x: cupX + 0.8 * random(),
      y: cupY + 1.5 + 0.4 * random(),
      z: 0.8 * random(),
    },
    rotation: rotations[result - 1]
  }
  return interpolate(current, resultFrame);
}

