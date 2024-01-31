import { mat4, quat, vec3 } from "gl-matrix";
import { Shader } from "./shader";

// TODO: add textures
export class Object {
  gl: WebGLRenderingContext;
  name: string;

  constructor(gl: WebGLRenderingContext, name: string) {
    this.name = name;
    this.gl = gl;
  }

  draw(shader: Shader) {
    console.log(`shader: ${shader} err empty object`)
  }
}

export class Cuboid extends Object {
  vertexBuffer: WebGLBuffer | null;
  normalBuffer: WebGLBuffer | null;
  indexBuffer: WebGLBuffer | null;

  rotation: quat;
  translation: vec3;

  constructor(gl: WebGLRenderingContext, name: string, w: number, h: number, d: number) {
    super(gl, name)

    this.rotation = quat.create();
    this.translation = vec3.create();

    const vertices = [
      -w / 2, -h / 2, d / 2, w / 2, -h / 2, d / 2, w / 2, h / 2, d / 2, -w / 2, h / 2, d / 2, // front
      -w / 2, -h / 2, -d / 2, -w / 2, h / 2, -d / 2, w / 2, h / 2, -d / 2, w / 2, -h / 2, -d / 2, // back
      -w / 2, h / 2, -d / 2, -w / 2, h / 2, d / 2, w / 2, h / 2, d / 2, w / 2, h / 2, -d / 2, // top
      -w / 2, -h / 2, -d / 2, w / 2, -h / 2, -d / 2, w / 2, -h / 2, d / 2, -w / 2, -d / 2, h / 2, // bottom
      w / 2, -h / 2, -d / 2, w / 2, h / 2, -d / 2, w / 2, h / 2, d / 2, w / 2, -h / 2, d / 2, // right
      -w / 2, -h / 2, -d / 2, -w / 2, -h / 2, d / 2, -w / 2, h / 2, d / 2, -w / 2, h / 2, -d / 2, // left
    ];

    const indices = [
      0, 1, 2, 0, 2, 3, // front
      4, 5, 6, 4, 6, 7, // back
      8, 9, 10, 8, 10, 11, // top
      12, 13, 14, 12, 14, 15, // bottom
      16, 17, 18, 16, 18, 19, // right
      20, 21, 22, 20, 22, 23, // left
    ];

    const normals = [
      0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1,
      0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1,
      0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0,
      0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0,
      1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0,
      -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0,
    ]

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

    const normalBuffer = gl.createBuffer();
    if (normalBuffer === null) throw new Error("createBuffer error");
    this.normalBuffer = normalBuffer;
    gl.bindBuffer(gl.ARRAY_BUFFER, this.normalBuffer)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normals), gl.STATIC_DRAW);
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

  draw(shader: Shader) {
    this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer)

    {
      const location = this.gl.getAttribLocation(
        shader.program,
        "aVertexPosition"
      )
      if (location === null) throw new Error(`getAttribLocation error`)

      this.gl.enableVertexAttribArray(location);
      this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexBuffer)

      const size = 3;
      const type = this.gl.FLOAT;
      const normalize = false;
      const stride = 0;
      const offset = 0;
      this.gl.vertexAttribPointer(
        location,
        size,
        type,
        normalize,
        stride,
        offset,
      );
    }

    {
      const location = this.gl.getAttribLocation(
        shader.program,
        "aNormal"
      )
      if (location === null) throw new Error(`getAttribLocation error`)

      this.gl.enableVertexAttribArray(location);
      this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.normalBuffer)

      const size = 3;
      const type = this.gl.FLOAT;
      const normalize = false;
      const stride = 0;
      const offset = 0;
      this.gl.vertexAttribPointer(
        location,
        size,
        type,
        normalize,
        stride,
        offset,
      );
    }

    this.gl.useProgram(shader.program);

    const rotationMatrix = mat4.create();
    mat4.fromQuat(rotationMatrix, this.rotation)

    const modelMatrix = mat4.create();
    mat4.fromTranslation(modelMatrix, this.translation);

    mat4.mul(modelMatrix, modelMatrix, rotationMatrix)

    shader.setUniformMat4fv("uModelMatrix", modelMatrix)
    if (this.name === "ground") {
      shader.setUniform3fv("uColor", [0.6, 0.2, 0.2]);
    } else {
      shader.setUniform3fv("uColor", [0.15, 0.5, 0.15]);

    }
    this.gl.drawElements(this.gl.TRIANGLES, 36, this.gl.UNSIGNED_SHORT, 0);
  }
}
