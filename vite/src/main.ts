import { fetchText } from "./utils";
import { Shader } from "./shader";
import { Renderer } from "./renderer";
import { Cuboid, Object } from "./object";

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
  const renderer = new Renderer(gl)
  const world = new Object(gl, "world")
  const box = new Cuboid(gl, "box", 100, 1, 100)
  const ground = new Cuboid(gl, "ground", 4, 4, 4)
  // const dice = new Cuboid(gl, 1, 1, 1)
  world.add(box)
  world.add(ground)
  // world.add(dice)

  box.translate([0, -0.0, -10.0])
  ground.translate([0, -10.0, -10.0])
  // dice.translate([-8.0, 0, -10])

  console.log(box, ground)

  const lastTimestamp = performance.now();
  const interval = setInterval(() => {
    const timestamp = performance.now();
    const dt = timestamp - lastTimestamp; 

    box.rotateX(0.01) 
    box.rotateZ(0.01) 

    renderer.draw(shader, world)

    clearInterval(interval)
  }, 1000 / fps)
}
