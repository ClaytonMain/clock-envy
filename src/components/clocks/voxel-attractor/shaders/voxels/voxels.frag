uniform float uDelta;
uniform float uTime;
uniform vec3 uCameraPosition;
uniform vec2 uResolution;
uniform float uGlZ;
uniform vec3[378] uParticlePositions;

varying mat4 vViewMatrix;

const int MAX_STEPS = 32;
const float VOXEL_SIZE = 1.0 / 16.0;
const float MAX_TRAVEL_DIST = 20.0;
const vec3 LIGHT_COLOR = vec3(1.0, 0.95, 0.75) * 2.0;
const vec3 LIGHT_DIR = normalize(vec3(0.85, 1.2, 0.8));

#include ../../../../../shaders/includes/simplexNoise3d.glsl

// HUGE shoutout to Shadertoy user "gelami" for their
// "Hybrid SDF-Voxel Traversal" shader:
// https://www.shadertoy.com/view/dtVSzw
// This shader's raycast function is heavily based on the one from that shader.

float sdRoundBox(vec3 p, vec3 b, float r) {
  vec3 q = abs(p) - b + r;
  return length(max(q, 0.0)) + min(max(q.x, max(q.y, q.z)), 0.0) - r;
}

// float sdSphere(vec3 p, float r) {
//   return length(p) - r;
// }

float getMap(vec3 p, vec2 uv) {
  float minDist = 1e10;
  int startIndex = 0;
  if (uv.x < -0.55) {
    startIndex = 0;
  } else if (uv.x < -0.25) {
    startIndex = 1;
  } else if (uv.x < 0.0) {
    startIndex = 2;
  } else if (uv.x < 0.25) {
    startIndex = 3;
  } else if (uv.x < 0.55) {
    startIndex = 4;
  } else {
    startIndex = 5;
  }
  for (int i = startIndex; i < 378; i += 6) {
    vec3 particlePos = uParticlePositions[i];
    // float d = sdSphere(p - particlePos, 0.25);
    float d = sdRoundBox(p - particlePos, vec3(0.2), 0.15);
    minDist = min(minDist, d);
  }
  return minDist;
}

struct HitInfo {
  float t;
  vec3 normal;
  vec3 voxelPos;
  int voxelIndex;
};

vec3 getVoxelPosition(vec3 p, float s) {
  return (floor(p / s) + 0.5) * s;
}

bool raycast(in vec3 rayOrigin, in vec3 rayDir, out HitInfo oHitInfo, const float tMax, vec2 uv) {
  const float voxSize = VOXEL_SIZE;
  // Was called `sd` in the original.
  // Decided to rename to `voxSwitchDist`, since it's the distance
  // threshold for switching to voxel traversal mode.
  const float voxSwitchDist = voxSize * sqrt(3.0);

  vec3 invRayDir = 1.0 / rayDir;
  // TODO: What's this `iro` mean?
  vec3 iro = rayOrigin * invRayDir;
  vec3 signInvRayDir = sign(invRayDir);
  vec3 absRayDir = abs(invRayDir);

  float t = 0.0;
  vec3 voxelPos = getVoxelPosition(rayOrigin, voxSize);
  bool voxel = false;
  // Was named `vi` in the original. Renamed to `voxelIndex` for clarity.
  int voxelIndex = 0;
  vec3 prd = vec3(0.0); // TODO: Figure out what this is for.

  for (int i = 0; i < MAX_STEPS; i++) {
    vec3 pos = rayOrigin + rayDir * t;

    float d = getMap(voxel ? voxelPos : pos, uv);

    if (!voxel) {
      t += d;
      if (d < voxSwitchDist) {
        voxelPos = getVoxelPosition(rayOrigin + rayDir * max(t - voxSwitchDist, 0.0), voxSize);
        voxel = true;
        voxelIndex = 0;
      }
    } else {
      // What is `n`?
      vec3 n = (rayOrigin - voxelPos) * invRayDir;
      // What is `k`?
      vec3 k = absRayDir * voxSize * 0.5;

      vec3 t1 = -n + k;

      float tF = min(min(t1.x, t1.y), t1.z);

      vec3 nrd = signInvRayDir * step(t1, t1.yzx) * step(t1, t1.zxy);

      if (d < 0.0) {
        oHitInfo.t = t;
        oHitInfo.voxelPos = voxelPos;
        oHitInfo.normal = -prd;
        oHitInfo.voxelIndex = voxelIndex;
        return true;
      } else if (d > voxSwitchDist && voxelIndex > 2) {
        voxel = false;
        t = tF + voxSwitchDist;
        continue;
      }

      voxelPos += nrd * voxSize;
      prd = nrd;
      t = tF;
      voxelIndex += 1;
    }
    if (t >= tMax) {
      return false;
    }
  }

  return false;
}

vec3 gradient(vec3 p, vec2 uv) {
  // Why?
  const vec2 e = vec2(0.0, 0.05);
  return (getMap(p, uv) - vec3(getMap(p - e.yxx, uv), getMap(p - e.xyx, uv), getMap(p - e.xxy, uv))) / e.y;
}

vec3 shade(vec3 pos, vec3 lightDir, HitInfo hitInfo, vec2 uv) {
  vec3 voxelPos = hitInfo.voxelPos;

  vec3 grad = gradient(voxelPos, uv);
  float gradLength = length(grad);
  vec3 gradNormalized = grad / gradLength;

  vec3 normal = hitInfo.normal;

  float diffuse = max(dot(normal, lightDir), 0.0);

  if (diffuse > 0.0) {
    pos += normal * 0.001;
    HitInfo hitLight;
    bool isHitLight = raycast(pos, lightDir, hitLight, 12.0, uv);

    diffuse *= float(!isHitLight);
  }

  vec3 color = vec3(0.81, 0.16, 0.04) * exp(-0.04 * hitInfo.t);
  float ao = smoothstep(-0.1, 0.01, getMap(pos, uv) / length(gradient(pos, uv)));

  color *= (diffuse * 0.5 + 0.5) * LIGHT_COLOR;
  color *= ao * 0.5 + 0.5;

  return color;
}

vec3 render(vec3 rayOrigin, vec3 rayDirection, vec2 uv) {
  HitInfo hitInfo;
  bool isHit = raycast(rayOrigin, rayDirection, hitInfo, MAX_TRAVEL_DIST, uv);

  float t = hitInfo.t;

  vec3 pos = rayOrigin + rayDirection * t;
  vec3 voxelPos = hitInfo.voxelPos;

  vec3 color = shade(pos, LIGHT_DIR, hitInfo, uv);
  if (!isHit) {
    color = vec3(0.1, 0.05, 0.04);
  }

  // vec3 color = vec3(float(hitInfo.voxelIndex) / float(MAX_STEPS));
  // color = vec3(hitInfo.normal);

  return color;
}

void main() {
  vec2 uv = gl_FragCoord.xy / uResolution.xy;
  uv -= 0.5;
  uv.x *= uResolution.x / uResolution.y;

  vec3 rayOrigin = uCameraPosition;
  vec4 directionOffset = inverse(vViewMatrix) * vec4(uv.x, uv.y, uGlZ, 1.0);
  vec3 rayDirection = normalize(directionOffset.xyz - rayOrigin);

  vec3 color = vec3(0.1, 0.05, 0.04);
  if (uv.y < 0.2 && uv.y > -0.2) {
    color = render(rayOrigin, rayDirection, uv);
  }

  gl_FragColor = vec4(color, 1.0);
}