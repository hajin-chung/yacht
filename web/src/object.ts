import { mat4, quat, vec3 } from "gl-matrix";
import { Shader } from "./shader";

export class Object {
  gl: WebGLRenderingContext;
  name: string;

  rotation: quat;
  translation: vec3;

  constructor(gl: WebGLRenderingContext, name: string) {
    this.name = name;
    this.gl = gl;

    this.rotation = quat.create();
    this.translation = vec3.create();
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
    console.log(`shader: ${shader} err empty object`)
  }
}

export class Cuboid extends Object {
  vertexBuffer: WebGLBuffer;
  normalBuffer: WebGLBuffer;
  indexBuffer: WebGLBuffer;
  textureCoordBuffer: WebGLBuffer;
  texture: WebGLTexture;

  constructor(
    gl: WebGLRenderingContext, name: string,
    w: number, h: number, d: number,
    image?: HTMLImageElement,
  ) {
    super(gl, name)

    const vertices = [
      -w / 2, -h / 2, d / 2,
      w / 2, -h / 2, d / 2,
      w / 2, h / 2, d / 2,
      -w / 2, h / 2, d / 2, // front

      -w / 2, -h / 2, -d / 2,
      -w / 2, h / 2, -d / 2,
      w / 2, h / 2, -d / 2,
      w / 2, -h / 2, -d / 2, // back

      -w / 2, h / 2, -d / 2,
      -w / 2, h / 2, d / 2,
      w / 2, h / 2, d / 2,
      w / 2, h / 2, -d / 2, // top

      -w / 2, -h / 2, -d / 2,
      w / 2, -h / 2, -d / 2,
      w / 2, -h / 2, d / 2,
      -w / 2, -h / 2, d / 2, // bottom

      w / 2, -h / 2, -d / 2,
      w / 2, h / 2, -d / 2,
      w / 2, h / 2, d / 2,
      w / 2, -h / 2, d / 2, // right

      -w / 2, -h / 2, -d / 2,
      -w / 2, -h / 2, d / 2,
      -w / 2, h / 2, d / 2,
      -w / 2, h / 2, -d / 2, // left
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
    ];

    const textureCoords = [
      0, 0,
      0, 1,
      1, 1,
      1, 0, // front

      0, 0,
      0, 1,
      1, 1,
      1, 0, // back

      0, 0,
      0, 1,
      1, 1,
      1, 0, //front

      0, 0,
      0, 1,
      1, 1,
      1, 0, //front

      0, 0,
      0, 1,
      1, 1,
      1, 0, //front

      0, 0,
      0, 1,
      1, 1,
      1, 0, //front
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

    const textureCoordBuffer = gl.createBuffer();
    if (textureCoordBuffer === null) throw new Error("createBuffer error");
    this.textureCoordBuffer = textureCoordBuffer;
    gl.bindBuffer(gl.ARRAY_BUFFER, this.textureCoordBuffer)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(textureCoords), gl.STATIC_DRAW);

    const texture = gl.createTexture();
    if (texture === null) throw new Error("createTexture error")
    this.texture = texture;
    gl.bindTexture(gl.TEXTURE_2D, this.texture)

    if (image) {
      gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        gl.RGBA,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        image,
      );
      gl.generateMipmap(gl.TEXTURE_2D);
    } else {
      gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        gl.RGBA,
        1,
        1,
        0,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        new Uint8Array([28, 87, 43, 255])
      );
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
    }
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

    {
      const location = this.gl.getAttribLocation(
        shader.program,
        "aTextureCoord"
      )
      if (location === null) throw new Error(`getAttribLocation error`)

      this.gl.enableVertexAttribArray(location);
      this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.textureCoordBuffer)

      const size = 2;
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
      this.gl.activeTexture(this.gl.TEXTURE0)
      this.gl.bindTexture(this.gl.TEXTURE_2D, this.texture);

      const location = this.gl.getUniformLocation(shader.program, "uTexture")
      if (location === null) throw new Error("getUniformLocation error")

      this.gl.uniform1i(location, 0);
    }

    this.gl.useProgram(shader.program);

    const rotationMatrix = mat4.create();
    mat4.fromQuat(rotationMatrix, this.rotation)

    const modelMatrix = mat4.create();
    mat4.fromTranslation(modelMatrix, this.translation);

    mat4.mul(modelMatrix, modelMatrix, rotationMatrix)

    shader.setUniformMat4fv("uModelMatrix", modelMatrix)
    this.gl.drawElements(this.gl.TRIANGLES, 36, this.gl.UNSIGNED_SHORT, 0);
  }
}

export class Dice extends Cuboid {
  image: TexImageSource;

  constructor(
    gl: WebGLRenderingContext, name: string,
    w: number, h: number, d: number,
    image: HTMLImageElement,
  ) {
    super(gl, name, w, h, d);

    const textureCoords = [
      0, 0,
      0, 1,
      1 / 8, 1,
      1 / 8, 0, // front

      1 / 8, 0,
      1 / 8, 1,
      2 / 8, 1,
      2 / 8, 0, // back

      2 / 8, 0,
      2 / 8, 1,
      3 / 8, 1,
      3 / 8, 0, //front

      3 / 8, 0,
      3 / 8, 1,
      4 / 8, 1,
      4 / 8, 0, //front

      4 / 8, 0,
      4 / 8, 1,
      5 / 8, 1,
      5 / 8, 0, //front

      5 / 8, 0,
      5 / 8, 1,
      6 / 8, 1,
      6 / 8, 0, //front
    ]
    const textureCoordBuffer = gl.createBuffer();
    if (textureCoordBuffer === null) throw new Error("createBuffer error");
    this.textureCoordBuffer = textureCoordBuffer;
    gl.bindBuffer(gl.ARRAY_BUFFER, this.textureCoordBuffer)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(textureCoords), gl.STATIC_DRAW);

    const texture = gl.createTexture();
    if (texture === null) throw new Error("createTexture error")
    this.texture = texture;
    this.image = image;
    gl.bindTexture(gl.TEXTURE_2D, this.texture)
    // gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    // gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    // gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    // gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.RGBA,
      gl.RGBA,
      gl.UNSIGNED_BYTE,
      image,
    );
    gl.generateMipmap(gl.TEXTURE_2D);
  }
}
