import { Vector, type RigidBody, Rotation } from "@dimforge/rapier3d-compat";
import * as THREE from "three";
// import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

interface Frame {
  translation?: Vector
  rotation?: Rotation
}

function getRapier() {
  return import("@dimforge/rapier3d-compat")
}

function random() {
  return 2 * Math.random() - 1
}

async function main() {
  const fps = 60;

  const rapier = await getRapier();
  await rapier.init();

  const loader = new GLTFLoader();
  const diceGltf = await loader.loadAsync("/models/dice.glb");
  const boardGltf = await loader.loadAsync("/models/board.glb");
  const cupGltf = await loader.loadAsync("/models/cup.glb");

  const cupX = 3;
  const cupY = 5;

  const pWorld = new rapier.World({ x: 0, y: -8, z: 0 });
  const cupGeometry: any = (cupGltf.scene.children[0].children[0] as any).geometry
  const cupVertex: Float32Array = cupGeometry.attributes.position.array
  const cupIndex: Uint32Array = Uint32Array.from(cupGeometry.index.array)
  const pCupRigidBodyDesc = rapier
    .RigidBodyDesc
    .dynamic()
    .lockTranslations()
    .lockRotations()
    .setTranslation(cupX, cupY, 0)
  const pCup = pWorld
    .createRigidBody(pCupRigidBodyDesc)
  const pCupColliderDesc = rapier.ColliderDesc
    .trimesh(cupVertex.map((f, i) => {
      if (i % 3 == 1 && f > 0) return 20;
      return f
    }), cupIndex)
  pWorld.createCollider(pCupColliderDesc, pCup);

  const pGround = rapier.ColliderDesc.cuboid(10, 1, 10).setTranslation(0, -1, 0)
  pWorld.createCollider(pGround)

  const pDice: RigidBody[] = [];
  for (let i = 0; i < 5; i++) {
    const rigidBodyDesc =
      rapier.RigidBodyDesc
        .dynamic()
        .setTranslation(cupX + random(), 3 * cupY + i * 6, 0)
    const rigidBody = pWorld.createRigidBody(rigidBodyDesc)

    const colliderDesc = rapier.ColliderDesc.cuboid(0.4, 0.4, 0.4);
    pWorld.createCollider(colliderDesc, rigidBody);

    pDice.push(rigidBody)
  }

  const canvas = document.getElementById("canvas") as HTMLCanvasElement;
  canvas.width = canvas.clientWidth;
  canvas.height = canvas.clientHeight;

  const renderer = new THREE.WebGLRenderer({ canvas: canvas });
  renderer.setSize(canvas.width, canvas.height);

  const scene = new THREE.Scene();

  const camera = new THREE.PerspectiveCamera(
    30,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  camera.position.set(0, 20, 0);
  camera.rotateX(Math.PI * 3 / 2)

  const board = boardGltf.scene;
  scene.add(board);

  const diceModel = diceGltf.scene;
  const diceList: THREE.Group<THREE.Object3DEventMap>[] = [];
  for (let i = 0; i < 5; i++) {
    const dice = diceModel.clone();

    diceList.push(dice);
    scene.add(dice);
  }

  const cup = cupGltf.scene;
  cup.position.set(cupX, cupY, 0);
  scene.add(cup);

  const groundTexture = await new THREE.TextureLoader().loadAsync("/textures/wood.jpg");
  groundTexture.wrapS = groundTexture.wrapT = THREE.RepeatWrapping;
  groundTexture.repeat.set(10, 10);
  const groundMaterial = new THREE.MeshStandardMaterial({ map: groundTexture });
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(100, 100), groundMaterial)
  ground.rotateX(Math.PI * 3 / 2)
  ground.position.set(0, -2, 0);
  scene.add(ground)

  const light = new THREE.AmbientLight(0xeeeeff); // soft white light
  scene.add(light);
  const directionalLight = new THREE.DirectionalLight(0xffffee, 2);
  directionalLight.position.set(1, 1, 1);
  scene.add(directionalLight);
  const hemisphereLight = new THREE.HemisphereLight(0xffffff, 0x080820, 0.8);
  scene.add(hemisphereLight);

  let material = new THREE.LineBasicMaterial({
    color: 0xffffff,
    vertexColors: true
  });
  let _geometry = new THREE.BufferGeometry();
  const lines = new THREE.LineSegments(_geometry, material);
  scene.add(lines);

  // cup shuffling
  let shuffleCup = false, throwCup = false;
  const shuffleFrames = generateCupShuffle()
  const throwFrames = generateCupThrow();
  const cupFrames: Frame[] = [];

  // const controls = new OrbitControls(camera, renderer.domElement);
  setInterval(() => {
    // controls.update()
    // let buffers = pWorld.debugRender();
    // lines.geometry.setAttribute('position', new THREE.BufferAttribute(buffers.vertices, 3));
    // lines.geometry.setAttribute('color', new THREE.BufferAttribute(buffers.colors, 4));

    pWorld.step();

    if (cupFrames.length === 0 && shuffleCup) {
      cupFrames.push(...shuffleFrames)
    }
    if (throwCup) {
      cupFrames.push(...throwFrames);
      throwCup = false;
    }

    if (cupFrames.length !== 0) {
      const frame = cupFrames.pop();
      if (frame?.translation !== undefined) {
        pCup.setTranslation(vectorAdd(pCup.translation(), frame.translation), false);
      }
      if (frame?.rotation !== undefined)
        pCup.setRotation(frame.rotation, false);
    }

    for (let i = 0; i < 5; i++) {
      const translation = pDice[i].translation();
      const rotation = pDice[i].rotation();
      diceList[i].position.set(translation.x, translation.y, translation.z);
      diceList[i].quaternion.set(rotation.x, rotation.y, rotation.z, rotation.w)
    }

    {
      const translation = pCup.translation();
      const rotation = pCup.rotation();
      cup.position.set(translation.x, translation.y, translation.z);
      cup.quaternion.set(rotation.x, rotation.y, rotation.z, rotation.w)
    }

    renderer.render(scene, camera);
  }, 1 / fps)

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
}

main();

function generateCupShuffle(): Frame[] {
  const dx = 0.05;
  const dy = 0.075;
  const steps = 15;
  const frames: Frame[] = [];

  for (let i = 1; i <= steps; i++) {
    frames.push({ translation: { x: i * dx / steps, y: i * dy / steps, z: 0 } });
  }

  for (let i = 1; i <= 2 * steps; i++) {
    frames.push({ translation: { x: dx - i * dx / steps, y: dy - i * dy / steps, z: 0 } });
  }

  for (let i = 1; i <= steps; i++) {
    frames.push({ translation: { x: -dx + i * dx / steps, y: -dy + i * dy / steps, z: 0 } });
  }

  frames.reverse();
  return frames;
}

function generateCupThrow(): Frame[] {
  const steps = 100;
  const dt = Math.PI * 3 / 4;

  const frames: Frame[] = [];
  for (let i = 1; i <= steps; i++) {
    const quat = new THREE.Quaternion();
    quat.setFromAxisAngle({ x: 0, y: 0, z: 1 }, i * dt / steps)
    frames.push({ rotation: quat })
  }
  for (let i = 1; i <= steps; i++) {
    frames.push(frames[steps - i]);
  }

  frames.reverse()
  return frames;
}

function vectorAdd(a: Vector, b: Vector): Vector {
  return { x: a.x + b.x, y: a.y + b.y, z: a.z + b.z }
}
