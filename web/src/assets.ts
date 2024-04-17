import * as THREE from "three";
import { GLTF } from "three/examples/jsm/loaders/GLTFLoader.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

export let diceModel: GLTF;
export let boardModel: GLTF;
export let cupModel: GLTF;
export let groundTexture: THREE.Texture;

export async function loadAssets() {
  const loader = new GLTFLoader();
  diceModel = await loader.loadAsync("/models/dice.glb");
  boardModel = await loader.loadAsync("/models/board.glb");
  cupModel = await loader.loadAsync("/models/cup.glb");
  groundTexture = await new THREE.TextureLoader().loadAsync(
    "/textures/wood.jpg",
  );
} 
