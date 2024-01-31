import { Object } from "./object";
import { Shader } from "./shader";

// TODO: add lightes!
export class World {
  gl: WebGLRenderingContext;

  objects: Object[]

  constructor(gl: WebGLRenderingContext) {
    this.gl = gl;
    this.objects = []
  }

  addObject(object: Object) {
    this.objects.push(object);
  }

  draw(shader: Shader) {
    for (const object of this.objects) {
      object.draw(shader)
    }    
  }
}
