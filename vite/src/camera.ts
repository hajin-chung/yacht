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

  lookAt(center: vec3) {
    const v1: vec3 = [0, 0, 1]
    const v2 = vec3.create();
    vec3.sub(v2, this.translation, center);
    vec3.normalize(v2, v2);

    const axis = vec3.create();
    vec3.cross(axis, v1, v2)

    const theta = Math.acos(vec3.dot(v1, v2))
    const w = Math.cos(theta / 2)
    const xyz = vec3.create()
    vec3.copy(xyz, axis)
    vec3.scale(xyz, xyz, Math.sin(theta / 2))

    quat.set(this.rotation, xyz[0], xyz[1], xyz[2], w)
  }
}

export class PerspectiveCamera extends Camera {
  constructor(gl: WebGLRenderingContext, fov: number, aspect: number, near: number, far: number) {
    super(gl)

    this.projectionMatrix = mat4.create();
    mat4.perspective(this.projectionMatrix, fov, aspect, near, far);
  }
}
