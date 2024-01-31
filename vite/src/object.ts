import { mat4, quat, vec3 } from "gl-matrix";
import { Shader } from "./shader";

export class Object {
  gl: WebGLRenderingContext;
  name: string;

  parent: Object | null;
  children: Object[];

  constructor(gl: WebGLRenderingContext, name: string) {
    this.name = name;
    this.gl = gl;
    this.children = [];
    this.parent = null;
  }

  add(child: Object) {
    child.parent = this;
    this.children.push(child);
  }

  draw(shader: Shader) {
    this.children.forEach((child) => child.draw(shader));
  }
}

export class Cuboid extends Object {
  gl: WebGLRenderingContext;
  vertexBuffer: WebGLBuffer | null;
  indexBuffer: WebGLBuffer | null;

  parent: Object | null;
  children: Object[];

  rotation: quat;
  translation: vec3;

  constructor(gl: WebGLRenderingContext, name: string, w: number, h: number, d: number) {
    super(gl, name)
    this.gl = gl;
    this.children = [];
    this.parent = null;

    this.rotation = quat.create();
    this.translation = vec3.create();

    const vertices = [
      w / 2, h / 2, d / 2,
      -w / 2, h / 2, d / 2,
      -w / 2, -h / 2, d / 2,
      w / 2, -h / 2, d / 2,
      w / 2, h / 2, -d / 2,
      -w / 2, h / 2, -d / 2,
      -w / 2, -h / 2, -d / 2,
      w / 2, -h / 2, -d / 2,
    ];

    const indices = [
      0, 1, 2,
      2, 3, 0,
      1, 5, 6,
      6, 2, 1,
      4, 5, 6,
      6, 7, 4,
      4, 0, 3,
      3, 7, 4,
      4, 5, 1,
      1, 0, 4,
      2, 6, 3,
      3, 6, 7,
    ];

    const vertexBuffer = gl.createBuffer();
    if (vertexBuffer === null) throw new Error("createBuffer error");
    this.vertexBuffer = vertexBuffer;
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

    const indexBuffer = gl.createBuffer();
    if (indexBuffer == null) throw new Error("createBuffer error");
    this.indexBuffer = indexBuffer;
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer)
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);
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

  add(child: Object) {
    child.parent = this;
    this.children.push(child)
  }

  draw(shader: Shader) {
    this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer)
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexBuffer)

    const size = 3;
    const type = this.gl.FLOAT;
    const normalize = false;
    const stride = 0;
    const offset = 0;

    const location = this.gl.getAttribLocation(
      shader.program,
      "aVertexPosition"
    )
    if (location === null) throw new Error(`getAttribLocation error`)

    this.gl.enableVertexAttribArray(location);
    this.gl.vertexAttribPointer(
      location,
      size,
      type,
      normalize,
      stride,
      offset,
    );

    this.gl.useProgram(shader.program);

    const rotationMatrix = mat4.create();
    mat4.fromQuat(rotationMatrix, this.rotation)

    const modelMatrix = mat4.create();
    mat4.fromTranslation(modelMatrix, this.translation);

    mat4.mul(modelMatrix, modelMatrix, rotationMatrix)

    shader.setUniformMat4fv("uModelMatrix", modelMatrix)
    this.gl.drawElements(this.gl.TRIANGLES, 36, this.gl.UNSIGNED_SHORT, 0);

    this.children.forEach((child) => child.draw(shader));
  }
}
