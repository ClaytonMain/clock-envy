uniform float uDelta;
uniform int uNumEpicycles;
uniform vec3[500] uEpicycleData; // x: center x, y: center y, z: radius
uniform vec2 uDrawPoint;
uniform vec2 uPrevDrawPoint;
uniform float uFadeSpeed;

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
  vec2 pa = p - a,
    ba = b - a;
  float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
  return length(pa - ba * h);
}

void main() {
  /*
   * vGpgpuTexture
   *  r: Distance to nearest epicycle circle
   *  g: Distance to nearest epicycle radial line
   *  b: Distance to draw point
   *  a: Draw strength history
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
  pointDist = clamp(pointDist, 0.0, 1.0);

  float trail = texture(vGpgpuTexture, uv).a;
  float smoothedPointDist = smoothstep(0.99, 1.0, 1.0 - pointDist);
  trail = -pow(log(max(trail, smoothedPointDist)), 5.0);
  trail = 1.0 / exp(pow(trail + uDelta * uFadeSpeed, 0.2));

  gl_FragColor = vec4(minCircleDist, minRadialDist, pointDist, trail);
}
