uniform float uDelta;
uniform float uTime;
uniform vec3 uCameraPosition;
uniform vec2 uResolution;
uniform float uGlZ;
uniform vec3[4] uBoundingBoxCenters;
uniform vec3[4] uBoundingBoxBValues;
uniform float[28] uActiveSegments;
uniform vec3[28] uSegmentPositions;
uniform vec3[28] uSegmentBValues;
uniform vec3[2] uColonCenters;
uniform float[2] uColonScales;

varying mat4 vViewMatrix;

const int MAX_STEPS = 128;
const float MAX_TRAVEL_DIST = 100.0;

// #include ../../../../../shaders/includes/simplexNoise4d.glsl
#include ../../../../../shaders/includes/simplexNoise3d.glsl
#include ../../../../../shaders/includes/rand2d.glsl

vec4 sdgSphere(in vec3 p, in float r) {
  float l = length(p);
  return vec4(l - r, p / l);
}

vec4 sdgSegment(in vec3 p, in vec3 a, in vec3 b, in float r) {
  vec3 ba = b - a;
  vec3 pa = p - a;
  float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
  vec3 q = pa - h * ba;
  float d = length(q);
  return vec4(d - r, q / d);
}

vec4 sdgBox(in vec3 p, in vec3 b, in float r) {
  vec3 w = abs(p) - (b - r);
  float g = max(w.x, max(w.y, w.z));
  vec3 q = max(w, 0.0);
  float l = length(q);
  vec4 f = (g > 0.0) ? vec4(l, q / l) : vec4(g, w.x == g ? 1.0 : 0.0, w.y == g ? 1.0 : 0.0, w.z == g ? 1.0 : 0.0);
  return vec4(f.x - r, f.yzw * sign(p));
}

vec4 sdgTorus(in vec3 p, in float ra, in float rb) {
  float h = length(p.xz);
  return vec4(length(vec2(h - ra, p.y)) - rb, normalize(p * vec3(h - ra, h, h - ra)));
}

vec4 sdgMin(vec4 a, vec4 b, float k) {
  k *= 4.0;
  float h = max(k - abs(a.x - b.x), 0.0);
  float m = 0.25 * h * h / k;
  float n = 0.50 * h / k;
  return vec4(min(a.x, b.x) - m, mix(a.yzw, b.yzw, (a.x < b.x) ? n : 1.0 - n));
}

vec4 getMap(in vec3 p) {
  vec4 minDist = vec4(1000.0);

  // Distance to the 6 digit boxes and their segments.
  vec4 d;
  for (int i = 0; i < 4; i++) {
    vec3 boxCenter = uBoundingBoxCenters[i];
    vec3 boxB = uBoundingBoxBValues[i];
    vec3 localP = p - boxCenter;
    d = sdgBox(localP, boxB, 0.0);
    if (d.x < minDist.x && d.x >= 0.15) {
      minDist = d;
    }
    if (d.x < 0.15) {
      for (int j = i * 7; j < (i + 1) * 7; j++) {
        vec3 pos = uSegmentPositions[j] + (1.0 - uActiveSegments[j]) * vec3(0.0, 9001.0, 0.0);
        vec3 b = uSegmentBValues[j];
        d = sdgMin(sdgBox(p - pos, b, 0.12), minDist, 0.00000001);
        if (d.x < minDist.x) {
          minDist = d;
        }
      }
    }
  }

  // Distance to colons.
  for (int i = 0; i < 2; i++) {
    vec3 colonCenter = uColonCenters[i];
    d = sdgMin(sdgBox(p - colonCenter, vec3(0.25, 0.55, 0.1), 0.12), minDist, 0.07);
    if (d.x < minDist.x) {
      minDist = d;
    }
  }

  return minDist;
}

struct HitInfo {
  float t;
  vec3 normal;
  vec3 pos;
  int steps;
};

bool raycast(in vec3 rayOrigin, in vec3 rayDir, out HitInfo oHitInfo, const float tMax) {
  float t = 0.0;
  int i;

  for (i = 0; i < MAX_STEPS; i++) {
    vec3 pos = rayOrigin + rayDir * t;
    vec4 d = getMap(pos);

    if (d.x < 0.01) {
      oHitInfo.t = t;
      oHitInfo.pos = pos;
      oHitInfo.normal = normalize(d.yzw);
      oHitInfo.steps = i;
      return true;
    } else {
      t += d.x;
    }

    if (t >= tMax) {
      return false;
    }
  }

  return false;
}

vec3 grad(vec3 p) {
  const vec2 e = vec2(0, 0.1);
  return (getMap(p).x - vec3(getMap(p - e.yxx).x, getMap(p - e.xyx).x, getMap(p - e.xxy).x)) / e.y;
}

vec3 render(vec3 rayOrigin, vec3 rayDirection) {
  HitInfo hitInfo;
  bool isHit = raycast(rayOrigin, rayDirection, hitInfo, MAX_TRAVEL_DIST);

  vec3 color;
  if (isHit) {
    color = vec3(0.0);
  } else {
    color = vec3(0.8);
  }

  // Tone mapping. Why tho?
  color = 2.0 * color / (0.8 + 2.5 * color);
  // Gamma correction. Also why tho?
  color = pow(color, vec3(0.4545));

  return color;
}

void main() {
  vec2 uv = gl_FragCoord.xy / uResolution.xy;
  uv -= 0.5;
  uv.x *= uResolution.x / uResolution.y;

  vec3 rayOrigin = uCameraPosition;
  vec4 directionOffset = inverse(vViewMatrix) * vec4(uv.x, uv.y, uGlZ, 1.0);
  vec3 rayDirection = normalize(directionOffset.xyz - rayOrigin);

  vec3 color = render(rayOrigin, rayDirection);

  gl_FragColor = vec4(color, 1.0);

  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}