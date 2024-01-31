precision mediump float;

uniform vec3 uReverseLightDirection;
uniform sampler2D uTexture;

varying vec3 vNormal;
varying vec2 vTextureCoord;

void main() {
  vec3 normal = normalize(vNormal);
  vec3 lightDirection = normalize(uReverseLightDirection);

  float light = dot(normal, lightDirection);
  if (light <= 0.5) light = 0.5;

  gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0);
  gl_FragColor.rgb *= light;
  gl_FragColor *= texture2D(uTexture, vTextureCoord);
}
