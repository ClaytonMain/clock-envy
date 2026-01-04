vec3 palette(float t, vec3 paletteA, vec3 paletteB, vec3 paletteC, vec3 paletteD) {
  return paletteA + paletteB * cos(6.28318 * (paletteC * t + paletteD));
}