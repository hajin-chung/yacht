uniform mat4 uModelViewMatrix;
uniform mat4 uProjectionMatrix;

attribute vec4 aVertexPosition;

void main() {
  gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;
}

