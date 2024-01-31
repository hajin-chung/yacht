import { mat4 } from "gl-matrix";
import { Shader } from "./shader";
import { Camera } from "./camera";
import { World } from "./world";

export class Renderer {
  gl: WebGLRenderingContext
  lastTimestamp: number | null;

  constructor(gl: WebGLRenderingContext) {
    this.lastTimestamp = null;
    this.gl = gl
  }

  draw(shader: Shader, world: World, camera: Camera) {
    this.gl.clearColor(0.0, 0.0, 0.0, 1.0);
    this.gl.clearDepth(1.0);
    this.gl.enable(this.gl.DEPTH_TEST);
    this.gl.depthFunc(this.gl.LEQUAL);

    this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);

    this.gl.useProgram(shader.program)

    const projectionMatrix = mat4.create();

    const viewMatrix = mat4.create();
    mat4.translate(viewMatrix, viewMatrix, camera.translation)

    const rotationMatrix = mat4.create()
    mat4.fromQuat(rotationMatrix, camera.rotation);
    mat4.mul(viewMatrix, viewMatrix, rotationMatrix)
    mat4.invert(viewMatrix, viewMatrix)

    mat4.copy(projectionMatrix, camera.projectionMatrix)
    mat4.mul(projectionMatrix, projectionMatrix, viewMatrix)

    shader.setUniformMat4fv("uProjectionMatrix", projectionMatrix)
    world.draw(shader)
  }
}
