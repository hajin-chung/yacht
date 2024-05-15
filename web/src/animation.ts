import * as THREE from "three";
import { cupX, cupY, generateRandomDicePose } from "./utils";

export type Translation = {
  x: number;
  y: number;
  z: number;
};

export type Rotation = {
  x: number;
  y: number;
  z: number;
  w: number;
};

export type Pose = {
  rotation: Rotation;
  translation: Translation;
};

type Callback = () => void;

export type AnimateKeyframe = {
  type: "animate";
  start: Pose;
  end: Pose;
  steps: number;
  callback?: Callback;
};

export type ContinuedKeyframe = {
  type: "continue";
  end: Pose;
  steps: number;
  callback?: Callback;
};

export type WaitKeyframe = {
  type: "wait";
  steps: number;
  callback?: Callback;
};

export type PoseKeyframe = {
  type: "pose";
  pose: Pose;
  callback?: Callback;
};

export type Keyframe =
  | AnimateKeyframe
  | WaitKeyframe
  | PoseKeyframe
  | ContinuedKeyframe;

export function interpolate(keyframe: AnimateKeyframe, step: number): Pose {
  const t = step / keyframe.steps;
  const startTranslation = keyframe.start.translation;
  const endTranslation = keyframe.end.translation;
  const startRotation = keyframe.start.rotation;
  const endRotation = keyframe.end.rotation;

  const interpolatedTranslation: Translation = {
    x: startTranslation.x + (endTranslation.x - startTranslation.x) * t,
    y: startTranslation.y + (endTranslation.y - startTranslation.y) * t,
    z: startTranslation.z + (endTranslation.z - startTranslation.z) * t,
  };

  const interpolatedRotation: Rotation = slerp(startRotation, endRotation, t);

  return {
    rotation: interpolatedRotation,
    translation: interpolatedTranslation,
  };
}

function slerp(start: Rotation, end: Rotation, t: number): Rotation {
  let dot =
    start.x * end.x + start.y * end.y + start.z * end.z + start.w * end.w;

  const theta_0 = Math.acos(dot);
  const sin_theta_0 = Math.sin(theta_0);

  if (sin_theta_0 < 0.0001) {
    return {
      x: start.x + t * (end.x - start.x),
      y: start.y + t * (end.y - start.y),
      z: start.z + t * (end.z - start.z),
      w: start.w + t * (end.w - start.w),
    };
  }

  const theta = theta_0 * t;
  const sin_theta = Math.sin(theta);
  const sin_theta_1 = Math.sin(theta_0 - theta);

  const s0 = sin_theta_1 / sin_theta_0;
  const s1 = sin_theta / sin_theta_0;

  return {
    x: start.x * s0 + end.x * s1,
    y: start.y * s0 + end.y * s1,
    z: start.z * s0 + end.z * s1,
    w: start.w * s0 + end.w * s1,
  };
}

export function generateShake(): Keyframe[] {
  const dx = 0.4;
  const dy = 1.2;
  const steps = 4;

  const start = {
    translation: { x: cupX, y: cupY, z: 0 },
    rotation: { w: 1, x: 0, y: 0, z: 0 },
  };
  const left = {
    translation: { x: cupX - dx, y: cupY - dy, z: 0 },
    rotation: { w: 1, x: 0, y: 0, z: 0 },
  };
  const right = {
    translation: { x: cupX + dx, y: cupY - dy, z: 0 },
    rotation: { w: 1, x: 0, y: 0, z: 0 },
  };

  return [
    {
      type: "animate",
      start: start,
      end: right,
      steps,
    },
    {
      type: "animate",
      start: right,
      end: start,
      steps,
    },
    {
      type: "animate",
      start: start,
      end: left,
      steps,
    },
    {
      type: "animate",
      start: left,
      end: start,
      steps,
    },
  ];
}

export function generateEncupDice(idx: number): Keyframe[] {
  // check if dice is locked if locked return []
  // if dice is not locked get current dice pose (start pose)
  // then generate random pose in cup from dice init code (end pose)
  // prepend keyframes with 8 steps (dice comming back to place)

  const pose: Pose = generateRandomDicePose(idx);
  return [
    { type: "wait", steps: 8 },
    { type: "pose", pose },
  ];
}

export function generateCupRoll(): Keyframe[] {
  const dt = (Math.PI * 3) / 4;

  const start: Pose = {
    translation: { x: cupX, y: cupY, z: 0 },
    rotation: { w: 1, x: 0, y: 0, z: 0 },
  };

  const quat = new THREE.Quaternion();
  quat.setFromAxisAngle({ x: 0, y: 0, z: 1 }, dt);
  const rotated: Pose = {
    translation: { x: cupX, y: cupY, z: 0 },
    rotation: quat,
  };

  const end: Pose = {
    translation: { x: cupX + 2, y: cupY, z: 0 },
    rotation: { w: 1, x: 0, y: 0, z: 0 },
  };

  return [
    { type: "animate", start, end: rotated, steps: 16 },
    { type: "animate", start: rotated, end, steps: 8 },
  ];
}

export function generateCupOut(): Keyframe[] {
  const start: Pose = {
    translation: { x: cupX, y: cupY, z: 0 },
    rotation: { w: 1, x: 0, y: 0, z: 0 },
  };
  const end: Pose = {
    translation: { x: cupX + 2, y: cupY, z: 0 },
    rotation: { w: 1, x: 0, y: 0, z: 0 },
  };
  return [{ type: "animate", start, end, steps: 16 }];
}

export function generateCupIn(): Keyframe[] {
  const end: Pose = {
    translation: { x: cupX, y: cupY, z: 0 },
    rotation: { w: 1, x: 0, y: 0, z: 0 },
  };
  return [{ type: "continue", end, steps: 16 }];
}

const diceRotations: Rotation[] = [
  { w: 1, x: 0, y: 0, z: 0 },
  { w: 0.707, x: -0.707, y: 0, z: 0 },
  { w: 0.707, x: 0, y: 0, z: -0.707 },
  { w: 0.707, x: 0, y: 0, z: 0.707 },
  { w: 0.707, x: 0.707, y: 0, z: 0 },
  { w: 0, x: 0.707, y: 0, z: 0.707 },
];

export function generateDiceLock(idx: number, result: number): Keyframe[] {
  const end: Pose = {
    translation: {
      x: -2.2 + idx * 1.1,
      y: 3,
      z: -3.3,
    },
    rotation: diceRotations[result - 1],
  };

  return [{ type: "continue", end, steps: 16 }];
}

export function generateDiceResult(idx: number, result: number): Keyframe[] {
  const end: Pose = {
    translation: {
      x: -2.2 + idx * 1.1,
      y: 4,
      z: 0,
    },
    rotation: diceRotations[result - 1],
  };

  return [{ type: "continue", end, steps: 16 }];
}
