import { Shader } from "./shader";

export class Object {
  gl: WebGLRenderingContext;
  mesh: number[]
  buffer: WebGLBuffer;

  constructor(gl: WebGLRenderingContext, mesh: number[]) {
    this.gl = gl;
    this.mesh = mesh;
    const buffer = gl.createBuffer();
    if (buffer === null) throw new Error("createBuffer error");
    this.buffer = buffer;
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(mesh), gl.STATIC_DRAW);
  }

  draw(shader: Shader) {
    const numComponents = 3;
    const type = this.gl.FLOAT;
    const normalize = false;
    const stride = 0;
    const offset = 0;
    const location = this.gl.getAttribLocation(
      shader.program,
      "aVertexPosition"
    )
    if (location === null) throw new Error(`getAttribLocation error`)

    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.buffer);
    this.gl.vertexAttribPointer(
      location,
      numComponents,
      type,
      normalize,
      stride,
      offset,
    );
    this.gl.enableVertexAttribArray(location);

    this.gl.useProgram(shader.program)
    this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, 4);
  }
}
