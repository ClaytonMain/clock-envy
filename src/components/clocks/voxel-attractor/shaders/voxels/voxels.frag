uniform float uDelta;
uniform float uTime;
uniform vec3 uCameraPosition;
uniform vec2 uResolution;
uniform float uGlZ;
uniform vec3[6] uBoundingBoxCenters;
uniform vec3[6] uBoundingBoxBValues;
uniform int[42] uActiveSegments;
uniform vec3[42] uSegmentAPositions;
uniform vec3[42] uSegmentBPositions;

uniform vec3 uLightColor;
uniform vec3 uMaterialColor;
uniform vec3 uBackgroundColor;

varying mat4 vViewMatrix;

const int MAX_STEPS = 256;
const float VOXEL_SIZE = 1.0 / 32.0;
const float MAX_TRAVEL_DIST = 100.0;
// const vec3 LIGHT_COLOR = vec3(1.0, 0.95, 0.75) * 2.0;
const vec3 LIGHT_DIR = normalize(vec3(0.85, 2.2, 0.8));

#include ../../../../../shaders/includes/simplexNoise3d.glsl

// HUGE shoutout to Shadertoy user "gelami" for their
// "Hybrid SDF-Voxel Traversal" shader:
// https://www.shadertoy.com/view/dtVSzw
// This shader's raycast function is heavily based on the one from that shader.

float sdRoundBox(vec3 p, vec3 b, float r) {
  vec3 q = abs(p) - b + r;
  return length(max(q, 0.0)) + min(max(q.x, max(q.y, q.z)), 0.0) - r;
}

float sdCapsule(vec3 p, vec3 a, vec3 b, float r) {
  vec3 pa = p - a, ba = b - a;
  float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
  return length(pa - ba * h) - r;
}

float sdBox(vec3 p, vec3 b) {
  vec3 q = abs(p) - b;
  return length(max(q, 0.0)) + min(max(q.x, max(q.y, q.z)), 0.0);
}

float opSmoothUnion(float d1, float d2, float k) {
  k *= 4.0;
  float h = max(k - abs(d1 - d2), 0.0);
  return min(d1, d2) - h * h * 0.25 / k;
}

float getMap(vec3 p) {
  // Using bounding boxes.
  // float minDist = sdRoundBox(p - vec3(0.0, 0.0, -2.25), vec3(8.0, 2.5, 2.0), 0.25);
  float minDist = sdRoundBox(p - vec3(0.0, -2.5, 0.0), vec3(7.0, 0.5, 2.0), 0.25);
  for (int i = 0; i < 6; i++) {
    vec3 boxCenter = uBoundingBoxCenters[i];
    vec3 boxB = uBoundingBoxBValues[i];
    vec3 localP = p - boxCenter;
    float d = sdBox(localP, boxB);
    if (d < minDist && d >= 0.5) {
      minDist = d;
    }
    if (d < 0.5) {
      for (int j = i * 7; j < (i + 1) * 7; j++) {
        if (uActiveSegments[j] == 0) {
          continue;
        }
        vec3 aPos = uSegmentAPositions[j];
        vec3 bPos = uSegmentBPositions[j];
        float d = opSmoothUnion(sdCapsule(p, aPos, bPos, 0.22), minDist, 0.07);
        if (d < minDist) {
          minDist = d;
        }
      }
    }
  }

  // // Using bounding boxes.
  // float minDist = sdRoundBox(p - vec3(0.0, -2.5, 0.0), vec3(7.0, 0.5, 2.0), 0.25);
  // float minBBoxDist = 1e10;
  // int bBoxIndex = -1;
  // for (int i = 0; i < 6; i++) {
  //   vec3 boxCenter = uBoundingBoxCenters[i];
  //   vec3 boxB = uBoundingBoxBValues[i];
  //   vec3 localP = p - boxCenter;
  //   float d = sdBox(localP, boxB);
  //   if (d < minBBoxDist) {
  //     minBBoxDist = d;
  //     bBoxIndex = i;
  //   }
  // }
  // for (int i = bBoxIndex * 7; i < (bBoxIndex + 1) * 7; i++) {
  //   if (uActiveSegments[i] == 0) {
  //     continue;
  //   }
  //   vec3 aPos = uSegmentAPositions[i];
  //   vec3 bPos = uSegmentBPositions[i];
  //   float d = opSmoothUnion(sdCapsule(p, aPos, bPos, 0.22), minDist, 0.07);
  //   if (d < minDist) {
  //     minDist = d;
  //   }
  // }

  // // Using bounding boxes.
  // float minBBoxDist = 1e10;
  // int bBoxIndex = -1;
  // for (int i = 0; i < 6; i++) {
  //   vec3 boxCenter = uBoundingBoxCenters[i];
  //   vec3 boxB = uBoundingBoxBValues[i];
  //   vec3 localP = p - boxCenter;
  //   float d = sdBox(localP, boxB);
  //   if (d < minBBoxDist) {
  //     minBBoxDist = d;
  //     bBoxIndex = i;
  //   }
  // }
  // if (minBBoxDist > VOXEL_SIZE * sqrt(3.0) * 2.0) {
  //   // return sdRoundBox(p - vec3(0.0, -4.0, 0.0), vec3(7.0, 0.5, 2.0), 0.25);
  //   return minBBoxDist;
  // }

  // float minDist = 1e10;
  // for (int i = bBoxIndex * 7; i < (bBoxIndex + 1) * 7; i++) {
  //   if (uActiveSegments[i] == 0) {
  //     continue;
  //   }
  //   vec3 aPos = uSegmentAPositions[i];
  //   vec3 bPos = uSegmentBPositions[i];
  //   float d = opSmoothUnion(sdCapsule(p, aPos, bPos, 0.22), minDist, 0.07);
  //   if (d < minDist) {
  //     minDist = d;
  //   }
  // }

  // // Without using bounding boxes.
  // float minDist = 1e10;
  // for (int i = 0; i < 42; i++) {
  //   if (uActiveSegments[i] == 0) {
  //     continue;
  //   }
  //   vec3 aPos = uSegmentAPositions[i];
  //   vec3 bPos = uSegmentBPositions[i];
  //   float d = opSmoothUnion(sdCapsule(p, aPos, bPos, 0.22), minDist, 0.075);
  //   if (d < minDist) {
  //     minDist = d;
  //   }
  // }

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

bool raycast(in vec3 rayOrigin, in vec3 rayDir, out HitInfo oHitInfo, const float tMax) {
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

    float d = getMap(voxel ? voxelPos : pos);

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

vec3 gradient(vec3 p) {
  // Why?
  const vec2 e = vec2(0.0, 0.05);
  return (getMap(p) - vec3(getMap(p - e.yxx), getMap(p - e.xyx), getMap(p - e.xxy))) / e.y;
}

vec3 shade(vec3 pos, vec3 lightDir, HitInfo hitInfo) {
  vec3 voxelPos = hitInfo.voxelPos;

  vec3 grad = gradient(voxelPos);
  float gradLength = length(grad);
  vec3 gradNormalized = grad / gradLength;

  vec3 normal = hitInfo.normal;

  float diffuse = max(dot(normal, lightDir), 0.0);

  if (diffuse > 0.0) {
    pos += normal * 0.001;
    HitInfo hitLight;
    bool isHitLight = raycast(pos, lightDir, hitLight, 12.0);

    diffuse *= float(!isHitLight);
  }

  // vec3 color = vec3(0.81, 0.16, 0.04) * exp(-0.004 * hitInfo.t);
  // vec3 color = vec3(0.22, 0.01, 0.13) * exp(-0.004 * hitInfo.t);
  // vec3 color = vec3(0.76, 0.14, 0.14) * exp(-0.004 * hitInfo.t);
  vec3 color = uMaterialColor * exp(-0.004 * hitInfo.t);
  float ao = smoothstep(-0.1, 0.01, getMap(pos) / length(gradient(pos)));

  color *= (diffuse * 0.3 + 0.7) * uLightColor;
  color *= ao * 0.6 + 0.4;

  return color;
}

vec3 render(vec3 rayOrigin, vec3 rayDirection) {
  HitInfo hitInfo;
  bool isHit = raycast(rayOrigin, rayDirection, hitInfo, MAX_TRAVEL_DIST);

  float t = hitInfo.t;

  vec3 pos = rayOrigin + rayDirection * t;
  vec3 voxelPos = hitInfo.voxelPos;

  vec3 color = shade(pos, LIGHT_DIR, hitInfo);
  if (!isHit) {
    // color = vec3(0.76, 0.14, 0.14);
    // color = vec3(0.22, 0.01, 0.13);
    color = uBackgroundColor;
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

  vec3 color = render(rayOrigin, rayDirection);

  gl_FragColor = vec4(color, 1.0);
}