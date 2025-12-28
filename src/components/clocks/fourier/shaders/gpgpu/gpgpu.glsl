uniform float uDelta;
uniform int uNumEpicycles;
uniform vec3[500] uEpicycleData; // x: center x, y: center y, z: radius
uniform vec2 uDrawPoint;
uniform vec2 uPrevDrawPoint;
uniform float uMaxFadeTime; // In seconds.

// Thanks (as always) to Iñigo Quilez for the SDF functions.
float sdCircle(vec2 p, float r) {
  return length(p) - r;
}

// Not sure if I want the radial lines to be boxes or segments yet.
float sdOrientedBox(vec2 p, vec2 a, vec2 b, float th) {
  float l = length(b - a);
  vec2 d = (b - a) / l;
  vec2 q = p - (a + b) * 0.5;
  q = mat2(d.x, -d.y, d.y, d.x) * q;
  q = abs(q) - vec2(l, th) * 0.5;
  return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0);
}

float sdSegment(vec2 p, vec2 a, vec2 b) {
  vec2 pa = p - a, ba = b - a;
  float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
  return length(pa - ba * h);
}

void main() {
  /*
   * vGpgpuTexture (older version)
   *  r: Distance to nearest epicycle circle
   *  g: Distance to nearest epicycle radial line
   *  b: Distance to draw point
   *  a: Draw strength history
   */

  /*
   * vGpgpuTexture (old version)
   *  r: Distance to nearest epicycle circle
   *  g: Distance to nearest epicycle radial line
   *  b: Closest distance to drawn point so far
   *  a: Time since closest drawn point, scaled to max fade time.
   */

  /*
   * vGpgpuTexture (current version)
   *  r: Distance to nearest epicycle circle
   *  g: Distance to nearest epicycle radial line
   *  b: Trail strength
   *  a: Trail color time
   */

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
  // pointDist = smoothstep(0.01, 0.0, pointDist);
  float trailStrength = texture(vGpgpuTexture, uv).b;
  float trailTime = texture(vGpgpuTexture, uv).a;

  // trailStrength = mix(trailStrength, pointDist, pointDist);
  // trailTime = mix(trailTime, 1.0, pointDist);

  // if (trailStrength < pointDist) {
  //   trailStrength = pointDist;
  //   trailTime = 1.0;
  // }
  // trailStrength += uDelta / smoothstep(0.0, 0.01, (1.0 - pointDist) * (1.0 - pointDist));
  trailStrength += smoothstep(0.0, 50.0, min(uDelta, 0.015) * (1.0 - trailStrength) / (50.0 * pow(pointDist, 1.8)));
  // trailStrength += (1.0 - trailStrength) * min(uDelta, 0.015) * 0.01 / exp(pointDist);
  trailStrength = clamp(trailStrength, 0.0, 1.0);
  trailStrength *= exp(-uDelta * 0.05);
  trailTime = max(trailTime - uDelta / uMaxFadeTime, 0.0);
  // trailStrength = clamp(trailStrength, 0.0, 1.0);
  // trailStrength = mix(trailStrength, pointDist, pointDist);
  // trailTime = mix(trailTime, 1.0, pointDist);

  gl_FragColor = vec4(minCircleDist, minRadialDist, trailStrength, trailTime);
}
