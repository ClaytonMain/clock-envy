uniform float uTime;
uniform float uDelta;
uniform float uMaxFadeTime;

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

  // vec4 color = vec4(uBackgroundColor, 0.0);
  vec4 color = vec4(0.0);

  // color = vec4(palette(gpgpuData.b), gpgpuData.b);

  color += vec4(palette(uTime * 0.05 * 0.01) * 3.0 * 0.009 / gpgpuData.r, 0.009 / gpgpuData.r) * 0.08;
  color += vec4(palette(uTime * 0.05 * 0.01) * 3.0 * 0.009 / gpgpuData.g, 0.009 / gpgpuData.g) * 0.08;
  color = clamp(color, 0.0, 1.0);
  color += vec4(palette((gpgpuData.b - 1.0 + uTime * 0.05) * 0.1) * gpgpuData.b * 2.0, gpgpuData.b);
  color = clamp(color, 0.0, 1.0);
  // color = mix(color, vec4(0.0), 1.0 - length(normalize(color)));
  // color = mix(color, vec4(uRadialColor * 0.002 / gpgpuData.g, 1.0), smoothstep(0.0, 1.0, clamp(0.002 / gpgpuData.g, 0.0, 1.0)));

  gl_FragColor = vec4(color);
  // gl_FragColor = vec4(vec3(gpgpuData.b), 1.0);
}
