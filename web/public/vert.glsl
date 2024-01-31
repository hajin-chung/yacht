uniform mat4 uModelMatrix;
uniform mat4 uProjectionMatrix;

attribute vec4 aVertexPosition;
attribute vec3 aNormal;
attribute vec2 aTextureCoord;

varying vec3 vNormal;
varying vec2 vTextureCoord;

void main() {
  gl_Position = uProjectionMatrix * uModelMatrix * aVertexPosition;
  vNormal = mat3(uModelMatrix) * aNormal;
  vTextureCoord = aTextureCoord;
}

