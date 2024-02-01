import { mat4, quat, vec3 } from "gl-matrix";

export class Camera {
  gl: WebGLRenderingContext;
  rotation: quat;
  translation: vec3;
  projectionMatrix: mat4;

  constructor(gl: WebGLRenderingContext) {
    this.rotation = quat.create();
    this.translation = vec3.create();
    this.gl = gl;

    const canvas = this.gl.canvas as HTMLCanvasElement
    const fieldOfView = (45 * Math.PI) / 180; // in radians
    const aspect = canvas.clientWidth / canvas.clientHeight;
    const zNear = 0.1;
    const zFar = 100.0;

    this.projectionMatrix = mat4.create();
    mat4.perspective(this.projectionMatrix, fieldOfView, aspect, zNear, zFar);
  }

  translate(v: vec3) {
    vec3.add(this.translation, this.translation, v)
  }

  rotateX(rad: number) {
    quat.rotateX(this.rotation, this.rotation, rad)
  }

  rotateY(rad: number) {
    quat.rotateY(this.rotation, this.rotation, rad)
  }

  rotateZ(rad: number) {
    quat.rotateZ(this.rotation, this.rotation, rad)
  }

  lookAt(eye: vec3, center: vec3, up: vec3) {
    const viewMatrix = mat4.create();
    mat4.lookAt(viewMatrix, eye, center, up)
    mat4.getTranslation(this.translation, viewMatrix);
    mat4.getRotation(this.rotation, viewMatrix);
  }
}

export class PerspectiveCamera extends Camera {
  constructor(gl: WebGLRenderingContext, fov: number, aspect: number, near: number, far: number) {
    super(gl)

    this.projectionMatrix = mat4.create();
    mat4.perspective(this.projectionMatrix, fov, aspect, near, far);
  }
}
