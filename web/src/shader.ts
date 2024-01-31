import { checkError } from "./utils";

export class Shader {
  program: WebGLProgram
  gl: WebGLRenderingContext
  vertShader: WebGLShader | null
  fragShader: WebGLShader | null

  constructor(gl: WebGLRenderingContext, vertShaderSrc: string, fragShaderSrc: string) {
    this.gl = gl;

    this.vertShader = gl.createShader(gl.VERTEX_SHADER)
    if (this.vertShader === null) {
      throw new Error("createShader(gl.VERTEX_SHADER) error")
    }

    gl.shaderSource(this.vertShader, vertShaderSrc)
    gl.compileShader(this.vertShader)

    if (!gl.getShaderParameter(this.vertShader, gl.COMPILE_STATUS)) {
      throw new Error('Shader compile error: ' + gl.getShaderInfoLog(this.vertShader));
    }

    this.fragShader = gl.createShader(gl.FRAGMENT_SHADER)
    if (this.fragShader === null) {
      throw new Error("createShader(gl.VERTEX_SHADER) error")
    }

    gl.shaderSource(this.fragShader, fragShaderSrc)
    gl.compileShader(this.fragShader)

    if (!gl.getShaderParameter(this.fragShader, gl.COMPILE_STATUS)) {
      throw new Error('Shader compile error: ' + gl.getShaderInfoLog(this.fragShader));
    }

    const program = this.gl.createProgram();
    if (program === null) throw new Error("createProgram error")
    this.gl.attachShader(program, this.vertShader)
    this.gl.attachShader(program, this.fragShader)
    this.gl.linkProgram(program)
    this.program = program;
  }

  setUniformMat4fv(name: string, value: Float32List) {
    this.gl.useProgram(this.program)
    const location = this.gl.getUniformLocation(this.program, name)
    if (location === null) throw new Error(`getUniformLocation("${name}")`)
    this.gl.uniformMatrix4fv(location, false, value)
  }

  setUniform3fv(name: string, value: Float32List) {
    this.gl.useProgram(this.program)
    const location = this.gl.getUniformLocation(this.program, name)
    if (location === null) throw new Error(`getUniformLocation("${name}")`)
    this.gl.uniform3fv(location, value)
  }
}
