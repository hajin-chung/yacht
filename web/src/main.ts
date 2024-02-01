import { fetchText, fetchImage } from "./utils";
import { Shader } from "./shader";
import { Renderer } from "./renderer";
import { Cuboid, Dice } from "./object";
import { Camera } from "./camera";
import { World } from "./world";
import type { RigidBody } from "@dimforge/rapier3d-compat";

function getRapier() {
  return import("@dimforge/rapier3d-compat")
}

main()
async function main() {
  const rapier = await getRapier();
  await rapier.init();

  // world settings
  const fps = 30;

  // set physics
  const gravity = { x: 0, y: -9.81, z: 0.0 };
  const pWorld = new rapier.World(gravity)
  pWorld.timestep = 1 / fps;

  const groundWidth = 6.25, groundHeight = 6.25, groundDepth = 1;
  const groundColliderDesc = rapier.ColliderDesc.cuboid(groundWidth / 2, groundDepth / 2, groundHeight / 2);

  const wallWidth = groundWidth, wallHeight = 20, wallDepth = 1;
  const rightColliderDesc = rapier.ColliderDesc
    .cuboid(wallDepth / 2, wallHeight / 2, wallWidth / 2)
    .setTranslation(groundWidth / 2 + wallDepth / 2, wallHeight / 2 + groundDepth / 2, 0);
  const leftColliderDesc = rapier.ColliderDesc
    .cuboid(wallDepth / 2, wallHeight / 2, wallWidth / 2)
    .setTranslation(-groundWidth / 2 - wallDepth / 2, wallHeight / 2 + groundDepth / 2, 0);
  const topColliderDesc = rapier.ColliderDesc
    .cuboid(wallWidth / 2, wallHeight / 2, wallDepth / 2)
    .setTranslation(0, wallHeight / 2 + groundDepth / 2, -groundHeight / 2 - wallDepth / 2);
  const bottomColliderDesc = rapier.ColliderDesc
    .cuboid(wallWidth / 2, wallHeight / 2, wallDepth / 2)
    .setTranslation(0, wallHeight / 2 + groundDepth / 2, groundHeight / 2 + wallDepth / 2);
  pWorld.createCollider(groundColliderDesc)
  pWorld.createCollider(rightColliderDesc)
  pWorld.createCollider(leftColliderDesc)
  pWorld.createCollider(topColliderDesc)
  pWorld.createCollider(bottomColliderDesc)

  const pDice: RigidBody[] = [];
  for (let i = 0; i < 5; i++) {
    const rigidBodyDesc =
      rapier.RigidBodyDesc
        .dynamic()
        .setTranslation(-2.5 + 1.25 * i, 5, 0)
        .setRotation({ x: Math.random(), y: Math.random(), z: Math.random(), w: Math.random() });
    const rigidBody = pWorld.createRigidBody(rigidBodyDesc)

    const colliderDesc = rapier.ColliderDesc.cuboid(0.5, 0.5, 0.5);
    // const collider = 
    pWorld.createCollider(colliderDesc, rigidBody);

    pDice.push(rigidBody)
  }

  const canvas: HTMLCanvasElement = document.querySelector("canvas") as HTMLCanvasElement;
  initCanvas(canvas)
  const gl = canvas.getContext("webgl");

  if (gl === null) {
    alert(
      "Unable to initialize WebGL. Your browser or machine may not support it.",
    );
    return;
  }

  const vertShaderSrc = await fetchText("/vert.glsl")
  const fragShaderSrc = await fetchText("/frag.glsl")
  const diceTexture = await fetchImage("/textures/dice.png")
  const woodTexture = await fetchImage("/textures/wood.png")

  const shader = new Shader(gl, vertShaderSrc, fragShaderSrc)
  const renderer = new Renderer(gl)
  const camera = new Camera(gl);
  camera.translate([0, 20, 0]);
  camera.rotateX(Math.PI * 3/2)

  // set graphics
  const world = new World(gl)
  const ground = new Cuboid(gl, "ground", groundWidth, groundDepth, groundHeight)
  const leftWall = new Cuboid(gl, "leftWall", wallDepth, 4, wallWidth)
  const rightWall = new Cuboid(gl, "leftWall", wallDepth, 4, wallWidth)
  const topWall = new Cuboid(gl, "leftWall", wallWidth, 4, wallDepth)
  const bottomWall = new Cuboid(gl, "leftWall", wallWidth, 4, wallDepth)
  const back = new Dice(gl, "back", 100, 1, 100, woodTexture);
  back.translate([0, -1, 0]);
  world.addObject(back);

  leftWall.translate([leftColliderDesc.translation.x, 2.5, leftColliderDesc.translation.z])
  rightWall.translate([rightColliderDesc.translation.x, 2.5, rightColliderDesc.translation.z])
  topWall.translate([topColliderDesc.translation.x, 2.5, topColliderDesc.translation.z])
  bottomWall.translate([bottomColliderDesc.translation.x, 2.5, bottomColliderDesc.translation.z])

  world.addObject(leftWall);
  world.addObject(rightWall);
  world.addObject(topWall);
  world.addObject(bottomWall);

  const diceList: Dice[] = []
  for (let i = 0; i < 5; i++) {
    const dice = new Dice(gl, `dice${i}`, 1, 1, 1, diceTexture)
    diceList.push(dice)
    world.addObject(dice)
  }

  world.addObject(ground)

  // TODO: abstract!
  shader.setUniform3fv("uReverseLightDirection", [0.1, 1, 0])

  // const lastTimestamp = performance.now();
  // const interval = 
  setInterval(() => {
    // const timestamp = performance.now();
    // const dt = timestamp - lastTimestamp;
    pWorld.step();

    let status = ""
    for (let i = 0; i < 5; i++) {
      status += `dice ${i} sleeping?: ${pDice[i].isSleeping()}, moving?: ${pDice[i].isMoving()}\n`
    }
    console.log(status)

    for (let i = 0; i < 5; i++) {
      const pTranslation = pDice[i].translation();
      const pRotation = pDice[i].rotation();
      diceList[i].translation = [pTranslation.x, pTranslation.y, pTranslation.z];
      diceList[i].rotation = [pRotation.x, pRotation.y, pRotation.z, pRotation.w]
    }

    renderer.draw(shader, world, camera)

    // clearInterval(interval)
  }, 1000 / fps)
}

function initCanvas(canvas: HTMLCanvasElement) {
  canvas.width = canvas.clientWidth;
  canvas.height = canvas.clientHeight;
}
