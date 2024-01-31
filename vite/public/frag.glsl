precision mediump float;

uniform vec3 uReverseLightDirection;
uniform vec3 uColor;

varying vec3 vNormal;

void main() {
  vec3 normal = normalize(vNormal);
  vec3 lightDirection = normalize(uReverseLightDirection);

  float light = dot(normal, lightDirection);
  if (light <= 0.2) light = 0.2;

  gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0);
  gl_FragColor.rgb *= light * uColor;
}
