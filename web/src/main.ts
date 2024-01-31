import { fetchText, fetchImage } from "./utils";
import { Shader } from "./shader";
import { Renderer } from "./renderer";
import { Cuboid, Dice } from "./object";
import { Camera } from "./camera";
import { World } from "./world";
import { vec3 } from "gl-matrix";

main();

async function main() {
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


  const shader = new Shader(gl, vertShaderSrc, fragShaderSrc)
  const renderer = new Renderer(gl)
  const camera = new Camera(gl);
  // camera.translate([0, 10, 0]);
  camera.translate([0, 4, 10]);
  camera.lookAt([0, 0, 0])

  const world = new World(gl)
  const ground = new Cuboid(gl, "ground", 8, 1, 8)
  const diceList: Dice[] = []
  for (let i = 0; i < 5; i++) {
    const dice = new Dice(gl, `dice${i}`, 1, 1, 1, diceTexture)
    dice.translate([-3.5 + 1.75 * i, 1, 0])
    diceList.push(dice)
    world.addObject(dice)
  }

  world.addObject(ground)

  ground.translate([0, 0, 0])

  // TODO: abstract!
  shader.setUniform3fv("uReverseLightDirection", [0.1, 1, 0])

  const fps = 60;
  const cameraSteps = 120;
  const dist: vec3 = [0, 6, -10];
  const step = vec3.create();
  vec3.scale(step, dist, 1 / cameraSteps);
  let i = 0
  // const lastTimestamp = performance.now();
  // const interval = 
  setInterval(() => {
    // const timestamp = performance.now();
    // const dt = timestamp - lastTimestamp;
    diceList.forEach((dice) => {
      dice.rotateX(0.01 * Math.random())
      dice.rotateY(0.02 * Math.random())
      dice.rotateZ(0.009 * Math.random())
    })

    if (i < cameraSteps) {
      camera.translate(step)
      camera.lookAt([0, 0, 0])
    }

    renderer.draw(shader, world, camera)

    // clearInterval(interval)
    i++;
  }, 1000 / fps)
}

function initCanvas(canvas: HTMLCanvasElement) {
  canvas.width = canvas.clientWidth;
  canvas.height = canvas.clientHeight;
}
