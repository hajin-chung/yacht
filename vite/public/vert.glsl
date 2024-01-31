uniform mat4 uModelMatrix;
uniform mat4 uProjectionMatrix;

attribute vec4 aVertexPosition;
attribute vec3 aNormal;

varying vec3 vNormal;

void main() {
  gl_Position = uProjectionMatrix * uModelMatrix * aVertexPosition;
  vNormal = mat3(uModelMatrix) * aNormal;
}

