uniform float uTime;

uniform sampler2D uGpgpuTexture;

// uniform vec3 uBackgroundColor;
// uniform vec3 uEpicycleColor;
// uniform vec3 uRadialColor;

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

  // vec4 color = vec4(uBackgroundColor, 0.0);
  vec4 color = vec4(0.0);

  vec4 epicycleColor = vec4(palette(uTime * 0.001 + 0.0), 1.0);
  color = mix(color, epicycleColor, smoothstep(0.004, 0.0, gpgpuData.r));

  vec4 radialColor = vec4(palette(uTime * 0.001 + 0.22), 1.0);
  color = mix(color, radialColor, smoothstep(0.004, 0.0, gpgpuData.g));

  // color = mix(color, uTrailColor, smoothstep(0.2, 0.75, gpgpuData.a + 0.2));
  vec4 trailColor = vec4(palette(uTime * 0.001 + 0.44 + gpgpuData.a), 1.0);
  color = mix(color, trailColor, smoothstep(0.2, 0.75, gpgpuData.a + 0.2));

  gl_FragColor = vec4(color);
}
