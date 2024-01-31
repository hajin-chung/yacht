import { fetchText } from "./utils";
import { Shader } from "./shader";
import { Renderer } from "./renderer";
import { Cuboid } from "./object";
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
  const shader = new Shader(gl, vertShaderSrc, fragShaderSrc)
  const renderer = new Renderer(gl)
  const camera = new Camera(gl);
  // camera.translate([0, 10, 0]);
  camera.translate([0, 4, 10]);
  camera.lookAt([0, 0, 0])

  const world = new World(gl)
  const ground = new Cuboid(gl, "ground", 8, 1, 8)
  const box1 = new Cuboid(gl, "box", 1, 1, 1)
  const box2 = new Cuboid(gl, "box", 1, 1, 1)
  const box3 = new Cuboid(gl, "box", 1, 1, 1)
  const box4 = new Cuboid(gl, "box", 1, 1, 1)
  const box5 = new Cuboid(gl, "box", 1, 1, 1)

  world.addObject(box1)
  world.addObject(box2)
  world.addObject(box3)
  world.addObject(box4)
  world.addObject(box5)
  world.addObject(ground)

  box1.translate([-3.5, 1, 0])
  box2.translate([-1.75, 1, 0])
  box3.translate([0, 1, 0])
  box4.translate([1.75, 1, 0])
  box5.translate([3.5, 1, 0])
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

    box1.rotateY(0.01)
    box1.rotateZ(0.02)

    box2.rotateX(0.01)
    box2.rotateZ(0.02)

    box3.rotateX(0.01)
    box3.rotateY(0.02)

    box4.rotateY(0.01)
    box4.rotateX(0.02)

    box5.rotateZ(0.01)
    box5.rotateX(0.02)
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
