uniform mat4 uTextureMatrix;
varying vec4 vUv;

#include ../../../../../shaders/includes/simplexNoise4d.glsl

void main() {
  // Wobble
  float wobble = simplexNoise4d(
    vec4(
      csm_Position, // XYZ
      0.0 // W
    ) * 0.3
  );
  csm_Position += wobble * normal;

  vUv = uTextureMatrix * vec4(csm_Position, 1.0);
}
