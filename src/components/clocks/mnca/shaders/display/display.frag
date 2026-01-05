uniform sampler2D uGameTexture;

varying vec2 vUv;

#include ../../../../../shaders/includes/palette.glsl

vec3 paletteA = vec3(0.5, 0.5, 0.5);
vec3 paletteB = vec3(0.5, 0.5, 0.5);
vec3 paletteC = vec3(1.0, 1.0, 1.0);
vec3 paletteD = vec3(0.00, 0.333, 0.666);

void main() {
  vec4 gameState = texture(uGameTexture, vUv);

  vec3 color = palette(gameState.b, paletteA, paletteB, paletteC, paletteD) * gameState.b;
  // color = mix(color, vec3(2.0), smoothstep(0.2, 1.0, gameState.g));
  // color = mix(color, vec3(0.8), gameState.b);
  color = mix(color, vec3(2.0), gameState.g);
  color = mix(clamp(color, 0.0, 1.0), vec3(1.3), gameState.a * gameState.a);

  // color *= 0.5 + gameState.g;

  gl_FragColor = vec4(color, 1.0);
}