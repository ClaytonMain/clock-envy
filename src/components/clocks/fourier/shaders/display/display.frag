uniform float uTime;

uniform sampler2D uGpgpuTexture;

uniform vec3 uEpicycleColor;
uniform vec3 uRadialColor;

uniform vec3 uPaletteA;
uniform vec3 uPaletteB;
uniform vec3 uPaletteC;
uniform vec3 uPaletteD;

varying vec2 vUv;

#define PI2 6.28318530718

vec3 palette(float t) {
  return uPaletteA + uPaletteB * cos(PI2 * (uPaletteC * t + uPaletteD));
}

void main() {
  vec4 gpgpuData = texture(uGpgpuTexture, vUv);

  vec4 color = vec4(0.0);

  color +=
    vec4(
      palette(uTime * 0.05 * 0.05) * 1.5 * 0.011 / gpgpuData.r,
      0.011 / gpgpuData.r
    ) *
    0.1;
  color +=
    vec4(
      palette(uTime * 0.05 * 0.05) * 1.5 * 0.011 / gpgpuData.g,
      0.011 / gpgpuData.g
    ) *
    0.1;
  color = clamp(color, 0.0, 1.0);
  color += vec4(
    palette(gpgpuData.b * 0.1 - 0.1 + 0.5 + uTime * 0.05 * 0.05) * 2.0 +
      gpgpuData.b * 0.5,
    gpgpuData.b - 0.05
  );
  color = clamp(color, 0.0, 1.0);

  gl_FragColor = vec4(color);
}
