import { Rotation, Vector } from "@dimforge/rapier3d-compat";
import * as THREE from "three";

export interface Frame {
  translation?: Vector;
  rotation?: Rotation;
}

function generateCupShake(): Frame[] {
  const dx = 0.4;
  const dy = 1.2;
  const dz = 0.0;
  const steps = 15;
  const frames: Frame[] = [];

  for (let i = 1; i <= steps; i++)
    frames.push({ translation: { x: dx / steps, y: dy / steps, z: dz / steps } });
  for (let i = 1; i <= steps; i++)
    frames.push({ translation: { x: -dx / steps, y: -dy / steps, z: -dz / steps } });
  for (let i = 1; i <= steps; i++)
    frames.push({ translation: { x: -dx / steps, y: dy / steps, z: dz / steps } });
  for (let i = 1; i <= steps; i++)
    frames.push({ translation: { x: dx / steps, y: -dy / steps, z: -dz / steps } });

  frames.reverse();
  return frames;
}

export const shakeAnimation = generateCupShake();

function generateCupRoll(): Frame[] {
  const steps = 50;
  const dt = (Math.PI * 3) / 4;

  const frames: Frame[] = [];
  for (let i = 1; i <= steps; i++) {
    const quat = new THREE.Quaternion();
    quat.setFromAxisAngle({ x: 0, y: 0, z: 1 }, (i * dt) / steps);
    frames.push({ rotation: quat });
  }

  frames.reverse();
  return frames;
}

export const rollAnimation = generateCupRoll();

function generateCupMove(): Frame[] {
  const steps = 50;
  const dz = 3;
  const frames: Frame[] = [];
  for (let i = 1; i <= steps; i++) {
    frames.push({ translation: {x: dz / steps, y: 0, z: 0} });
  }

  frames.reverse();
  return frames;
}

export const moveAnimation = generateCupMove();
