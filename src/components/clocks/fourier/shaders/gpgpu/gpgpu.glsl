uniform float uDelta;
uniform int uNumEpicycles;
uniform vec3[500] uEpicycleData; // x: center x, y: center y, z: radius
uniform vec2 uDrawPoint;
uniform vec2 uPrevDrawPoint;

// Thanks (as always) to Iñigo Quilez for the SDF functions.
float sdCircle(vec2 p, float r) {
  return length(p) - r;
}

float sdSegment(vec2 p, vec2 a, vec2 b) {
  vec2 pa = p - a,
    ba = b - a;
  float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
  return length(pa - ba * h);
}

void main() {
  vec2 uv = (gl_FragCoord.xy - vec2(0.5)) / resolution.xy;
  vec2 position = (uv - 0.5) * 1.05;

  float minCircleDist = 10000.0;
  float minRadialDist = 10000.0;
  vec2 prevEpicycleEnd = vec2(0.0);
  for (int i = 0; i < 500; i++) {
    if (i >= uNumEpicycles) {
      break;
    }
    vec3 epicycle = uEpicycleData[i];
    vec2 center = epicycle.xy;
    float radius = epicycle.z;

    float circleDist = sdCircle(position - center, radius);
    minCircleDist = clamp(min(minCircleDist, abs(circleDist)), 0.0, 1.0);

    float radialDist = sdSegment(position, prevEpicycleEnd, center);
    minRadialDist = clamp(min(minRadialDist, abs(radialDist)), 0.0, 1.0);
    prevEpicycleEnd = center;
  }

  float pointDist = sdSegment(position, uPrevDrawPoint, uDrawPoint);
  float trailStrength = texture(vGpgpuTexture, uv).b;
  trailStrength += smoothstep(
    0.0,
    40.0,
    min(uDelta, 0.015) * (1.0 - trailStrength) / (50.0 * pow(pointDist, 1.8))
  );
  trailStrength = clamp(trailStrength, 0.0, 1.0);
  trailStrength *= exp(-uDelta * 0.05);

  gl_FragColor = vec4(minCircleDist, minRadialDist, trailStrength, 1.0);
}
