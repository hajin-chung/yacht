import { mat4 } from "gl-matrix";
import { Shader } from "./shader";
import { Object } from "./object";

export class Renderer {
  gl: WebGLRenderingContext
  lastTimestamp: number | null;

  constructor(gl: WebGLRenderingContext) {
    this.lastTimestamp = null;
    this.gl = gl
  }

  draw(shader: Shader, world: Object) {
    this.gl.clearColor(0.0, 0.0, 0.0, 1.0);
    this.gl.clearDepth(1.0);
    this.gl.enable(this.gl.DEPTH_TEST);
    this.gl.depthFunc(this.gl.LEQUAL);

    this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);

    this.gl.useProgram(shader.program)

    const canvas = this.gl.canvas as HTMLCanvasElement
    const fieldOfView = (45 * Math.PI) / 180; // in radians
    const aspect = canvas.clientWidth / canvas.clientHeight;
    const zNear = 0.1;
    const zFar = 100.0;
    const projectionMatrix = mat4.create();

    mat4.perspective(projectionMatrix, fieldOfView, aspect, zNear, zFar);

    const modelViewMatrix = mat4.create();

    mat4.translate(
      modelViewMatrix,
      modelViewMatrix,
      [-0.0, 0.0, -10.0],
    );

    shader.setUniformMat4fv("uProjectionMatrix", projectionMatrix)
    shader.setUniformMat4fv("uModelViewMatrix", modelViewMatrix)
    world.draw(shader)
  }
}
