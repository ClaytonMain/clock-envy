uniform float uDelta;
uniform int uNumEpicycles;
uniform vec3[600] uEpicycleData; // x: center x, y: center y, z: radius
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
  vec2 position = uv - 0.5;

  float minCircleDist = 10000.0;
  float minRadialDist = 10000.0;
  float pointDist = 10000.0;
  vec2 prevEpicycleEnd = vec2(0.0);
  for (int i = 0; i < 600; i++) {
    if (i >= uNumEpicycles) {
      break;
    }
    vec3 epicycle = uEpicycleData[i];
    vec2 center = epicycle.xy;
    float radius = epicycle.z;

    float circleDist = sdCircle(position - center, radius);
    minCircleDist = min(minCircleDist, abs(circleDist));

  }

  gl_FragColor = vec4(vec3(minCircleDist), 1.0);
}
