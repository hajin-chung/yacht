import { fetchText } from "./utils";
import { Shader } from "./shader";
import { Renderer } from "./renderer";
import { Object } from "./object";

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

  const shader = new Shader(gl, vertShaderSrc, fragShaderSrc)
  const renderer = new Renderer(gl)
  const world = new Object(gl, [
    1.0, 1.0, 0.0,
    1.0, -1.0, 0.0,
    -1.0, 1.0, 0.0,
    -1.0, -1.0, 0.0,
  ])
  renderer.draw(shader, world)
}
