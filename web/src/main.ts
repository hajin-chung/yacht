import { Vector, Rotation } from "@dimforge/rapier3d-compat";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { Yacht } from "./yacht";
import { fps } from "./constants";

interface Frame {
  translation?: Vector;
  rotation?: Rotation;
}

function getRapier() {
  return import("@dimforge/rapier3d-compat");
}

async function main() {
  const rapier = await getRapier();
  await rapier.init();

  const loader = new GLTFLoader();
  const diceGltf = await loader.loadAsync("/models/dice.glb");
  const boardGltf = await loader.loadAsync("/models/board.glb");
  const cupGltf = await loader.loadAsync("/models/cup.glb");
  const groundTexture = await new THREE.TextureLoader().loadAsync(
    "/textures/wood.jpg",
  );

  const canvas = document.getElementById("canvas") as HTMLCanvasElement;
  canvas.width = canvas.clientWidth;
  canvas.height = canvas.clientHeight;

  const yacht = new Yacht(
    rapier,
    canvas,
    diceGltf,
    cupGltf,
    boardGltf,
    groundTexture,
  );
  // yacht.debug();

  let shuffleCup = false,
    throwCup = false;
  const shuffleFrames = generateCupShuffle();
  const throwFrames = generateCupThrow();
  const cupFrames: Frame[] = [];

  setInterval(() => {
    if (cupFrames.length === 0 && shuffleCup) {
      cupFrames.push(...shuffleFrames);
    }
    if (throwCup) {
      cupFrames.push(...throwFrames);
      throwCup = false;
    }

    if (cupFrames.length !== 0) {
      const frame = cupFrames.pop();
      if (frame?.translation !== undefined) {
        yacht.cup.rigidBody.setTranslation(
          vectorAdd(yacht.cup.rigidBody.translation(), frame.translation),
          false,
        );
      }
      if (frame?.rotation !== undefined)
        yacht.cup.rigidBody.setRotation(frame.rotation, false);
    }

    yacht.update();
    yacht.draw();
  }, 1 / fps);

  document.addEventListener("keydown", (evt) => {
    if (evt.key === " ") {
      shuffleCup = true;
    } else if (evt.key === "t") {
      throwCup = true;
    }
  });

  document.addEventListener("keyup", (evt) => {
    if (evt.key === " ") {
      shuffleCup = false;
    }
  });

  const rollButton = document.getElementById("roll")!;
  rollButton.onmousedown = () => shuffleCup = true
  rollButton.onmouseup = () => shuffleCup = false
  rollButton.ontouchstart = () => shuffleCup = true
  rollButton.ontouchend = () => shuffleCup = false
}

main();

function generateCupShuffle(): Frame[] {
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

function generateCupThrow(): Frame[] {
  const steps = 100;
  const dt = (Math.PI * 3) / 4;

  const frames: Frame[] = [];
  for (let i = 1; i <= steps; i++) {
    const quat = new THREE.Quaternion();
    quat.setFromAxisAngle({ x: 0, y: 0, z: 1 }, (i * dt) / steps);
    frames.push({ rotation: quat });
  }
  for (let i = 1; i <= steps; i++) {
    frames.push(frames[steps - i]);
  }

  frames.reverse();
  return frames;
}

function vectorAdd(a: Vector, b: Vector): Vector {
  return { x: a.x + b.x, y: a.y + b.y, z: a.z + b.z };
}
