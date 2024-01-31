uniform mat4 uModelMatrix;
uniform mat4 uProjectionMatrix;

attribute vec4 aVertexPosition;

void main() {
  gl_Position = uProjectionMatrix * uModelMatrix * aVertexPosition;
}

