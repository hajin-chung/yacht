import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { Yacht } from "./yacht";
import { fps } from "./constants";

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

  setInterval(() => {
    yacht.update();
    yacht.draw();
  }, 1 / fps);

  document.addEventListener("keydown", (evt) => {
    if (evt.key === " ") yacht.cup.startShake();
  });

  document.addEventListener("keyup", (evt) => {
    if (evt.key === " ") yacht.cup.stopShake();
  });

  const shakeButton = document.getElementById("shake")!;
  shakeButton.onmousedown = () => yacht.cup.startShake();
  shakeButton.onmouseup = () => yacht.cup.stopShake();
  shakeButton.ontouchstart = () => yacht.cup.startShake();
  shakeButton.ontouchend = () => yacht.cup.stopShake();

  const rollButton = document.getElementById("roll")!;
  rollButton.onclick = () => yacht.cup.roll(); 
  rollButton.ontouchstart = () => yacht.cup.roll(); 
}

main();
