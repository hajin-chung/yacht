import { fetchText } from "./utils";
import { Shader } from "./shader";
import { Renderer } from "./renderer";
import { Cuboid, Object } from "./object";
import { Camera } from "./camera";

main();

async function main() {
  const vertShaderSrc = await fetchText("/vert.glsl")
  const fragShaderSrc = await fetchText("/frag.glsl")

  const canvas: HTMLCanvasElement = document.querySelector("#glcanvas") as HTMLCanvasElement;
  const gl = canvas.getContext("webgl");

  if (gl === null) {
    alert(
      "Unable to initialize WebGL. Your browser or machine may not support it.",
    );
    return;
  }

  const fps = 60;

  const shader = new Shader(gl, vertShaderSrc, fragShaderSrc)

  const camera = new Camera(gl);
  camera.translate([0, 0, 10])

  const world = new Object(gl, "world")
  const ground = new Cuboid(gl, "ground", 10, 1, 10)
  const box = new Cuboid(gl, "box", 4, 4, 4)

  world.add(box)
  world.add(ground)

  box.translate([0, 1.0, -10.0])
  ground.translate([0, -5, -10.0])

  const renderer = new Renderer(gl)

  // const lastTimestamp = performance.now();
  const interval = setInterval(() => {
    // const timestamp = performance.now();
    // const dt = timestamp - lastTimestamp;

    box.rotateY(0.01)
    box.rotateZ(0.02)
    ground.rotateY(0.01)

    renderer.draw(shader, world, camera)

    // clearInterval(interval)
  }, 1000 / fps)
}
