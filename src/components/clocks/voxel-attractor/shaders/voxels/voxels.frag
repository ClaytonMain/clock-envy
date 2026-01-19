uniform float uDelta;
uniform float uTime;
uniform vec3 uCameraPosition;
uniform vec2 uResolution;
uniform float uGlZ;
uniform vec3[6] uBoundingBoxCenters;
uniform vec3[6] uBoundingBoxBValues;
uniform float[42] uActiveSegments;
uniform vec3[42] uSegmentAPositions;
uniform vec3[42] uSegmentBPositions;
uniform float[6] uDigitSpringScales;

uniform vec3 uLightColor;
uniform vec3 uMaterialColor;
uniform vec3 uMaterialSubsurfaceColor;
uniform vec3 uSubsurfaceRadius;
uniform float uRoughness;
uniform float uRefractionIndex;
uniform vec3 uFogColor;
uniform vec3 uSkyLowColor;
uniform vec3 uSkyHighColor;
uniform vec3 uPlatformColor;
uniform vec3 uSeaLowColor;
uniform vec3 uSeaHighColor;

varying mat4 vViewMatrix;

const int MAX_STEPS = 128;
const float VOXEL_SIZE = 1.0 / 32.0;
const float MAX_TRAVEL_DIST = 100.0;
// const vec3 LIGHT_COLOR = vec3(1.0, 0.95, 0.75) * 2.0;
// const vec3 LIGHT_DIR = normalize(vec3(0.85, 2.2, 0.8));
const vec3 LIGHT_DIR = normalize(vec3(1.0, 1.0, 1.0));
const vec3 LIGHT_DIR_02 = normalize(vec3(-0.2, 0.2, -1.0));
const vec3 LIGHT_COLOR_02 = vec3(0.25);

const vec3 BOX_CENTER = vec3(0.0, -2.25, 0.0);
const vec3 BOX_B = vec3(7.0, 0.5, 2.0);

#include ../../../../../shaders/includes/simplexNoise3d.glsl

// HUGE shoutout to Shadertoy user "gelami" for their
// "Hybrid SDF-Voxel Traversal" shader:
// https://www.shadertoy.com/view/dtVSzw
// This shader's raycast function is heavily based on the one from that shader.

// float sdRoundBox(vec3 p, vec3 b, float r) {
//   vec3 q = abs(p) - b + r;
//   return length(max(q, 0.0)) + min(max(q.x, max(q.y, q.z)), 0.0) - r;
// }

// float sdCapsule(vec3 p, vec3 a, vec3 b, float r) {
//   vec3 pa = p - a, ba = b - a;
//   float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
//   return length(pa - ba * h) - r;
// }

vec4 sdgSegment( in vec3 p, in vec3 a, in vec3 b, in float r ) {
    vec3 ba = b-a;
    vec3 pa = p-a;
    float h = clamp( dot(pa,ba)/dot(ba,ba), 0.0, 1.0 );
    vec3  q = pa-h*ba;
    float d = length(q);
    return vec4(d-r,q/d);    
}

vec4 sdgBox( in vec3 p, in vec3 b, in float r ) {
    vec3  w = abs(p)-(b-r);
    float g = max(w.x,max(w.y,w.z));
    vec3  q = max(w,0.0);
    float l = length(q);
    vec4  f = (g>0.0)?vec4(l, q/l) :
                      vec4(g, w.x==g?1.0:0.0,
                              w.y==g?1.0:0.0,
                              w.z==g?1.0:0.0);
    return vec4(f.x-r, f.yzw*sign(p));
}

vec4 sdgMin(vec4 a, vec4 b, float k) {
  k *= 4.0;
  float h = max(k-abs(a.x-b.x),0.0);
  float m = 0.25*h*h/k;
  float n = 0.50*  h/k;
  return vec4( min(a.x,  b.x) - m, 
                mix(a.yzw, b.yzw, (a.x<b.x)?n:1.0-n) );
}

// float sdBox(vec3 p, vec3 b) {
//   vec3 q = abs(p) - b;
//   return length(max(q, 0.0)) + min(max(q.x, max(q.y, q.z)), 0.0);
// }

// float sdPlane(vec3 p, vec3 n, float h) {
//   // n must be normalized
//   return dot(p, n) + h;
// }

// float opSmoothUnion(float d1, float d2, float k) {
//   k *= 4.0;
//   float h = max(k - abs(d1 - d2), 0.0);
//   return min(d1, d2) - h * h * 0.25 / k;
// }

vec4 getMap(in vec3 p) {
  // Distance to the main platform box.
  vec4 minDist = sdgBox(p - BOX_CENTER, BOX_B, 0.0);

  // Distance to the 6 digit boxes and their segments.
  for (int i = 0; i < 6; i++) {
    vec3 boxCenter = uBoundingBoxCenters[i];
    vec3 boxB = uBoundingBoxBValues[i];
    vec3 localP = p - boxCenter;
    vec4 d = sdgBox(localP, boxB, 0.0);
    if (d.x < minDist.x && d.x >= 0.25) {
      minDist = d;
    }
    if (d.x < 0.25) {
      for (int j = i * 7; j < (i + 1) * 7; j++) {
        vec3 aPos = uSegmentAPositions[j] + (1.0 - uActiveSegments[j]) * vec3(0.0, 9001.0, 0.0);
        vec3 bPos = uSegmentBPositions[j] + (1.0 - uActiveSegments[j]) * vec3(0.0, 9001.0, 0.0);
        float scale = smoothstep(0.25, 0.75, uDigitSpringScales[i]) * 0.5 + 0.5;
        d = sdgMin(sdgSegment(p, aPos, bPos, 0.22 * scale), minDist, 0.07 * scale);
        minDist = minDist.x < d.x ? minDist : d;
      }
    }
  }

  return minDist;
}

struct HitInfo {
  float t;
  vec3 normal;
  vec3 sdfNormal;
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
  // vec3 iro = rayOrigin * invRayDir;
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

    if (pos.y > 2.0 && rayDir.y > 0.0) {
      return false;
    }

    vec4 d = getMap(voxel ? voxelPos : pos);

    if (!voxel) {
      t += d.x;
      if (d.x < voxSwitchDist) {
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

      if (d.x < 0.0) {
        oHitInfo.t = t;
        oHitInfo.voxelPos = voxelPos;
        oHitInfo.normal = -prd;
        oHitInfo.sdfNormal = d.yzw;
        oHitInfo.voxelIndex = voxelIndex;
        return true;
      } else if (d.x > voxSwitchDist && voxelIndex > 2) {
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

// TODO: Just collect the hit info in `getMap` instead of using bounds to determine
// what we hit.
vec3 getBaseColor(in vec3 p, out int matId) {
  vec3 color = vec3(0.1);
  int matIdLocal = 0;
  if (p.y > BOX_CENTER.y + BOX_B.y + VOXEL_SIZE * 0.5) {
    color = mix(uPlatformColor, uMaterialColor, pow(smoothstep(BOX_CENTER.y + BOX_B.y, BOX_CENTER.y + BOX_B.y + 0.94, p.y), 2.0));
    matIdLocal = 1;
  } else if (p.x <= BOX_CENTER.x + BOX_B.x + VOXEL_SIZE && p.x >= BOX_CENTER.x - BOX_B.x - VOXEL_SIZE &&
    p.y <= BOX_CENTER.y + BOX_B.y + VOXEL_SIZE && p.y >= BOX_CENTER.y - BOX_B.y - VOXEL_SIZE &&
    p.z <= BOX_CENTER.z + BOX_B.z + VOXEL_SIZE && p.z >= BOX_CENTER.z - BOX_B.z - VOXEL_SIZE) {
    color = uPlatformColor;
  } else {
    color = mix(uSeaLowColor, uSeaHighColor, pow(smoothstep(-2.75, -2.1, p.y), 2.0));
    // color = mix(color, uPlatformColor, smoothstep(1.0, 0.0, sdBox(p - BOX_CENTER, BOX_B)));
  }
  matId = matIdLocal;
  return color;
}

// vec3 shade(vec3 pos, vec3 lightDir, HitInfo hitInfo) {
//   vec3 voxelPos = hitInfo.voxelPos;

//   vec3 grad = hitInfo.sdfNormal;
//   // float gradLength = length(grad);
//   // vec3 gradNormalized = grad / gradLength;

//   vec3 normal = hitInfo.normal;

//   float diffuse = max(dot(normal, lightDir), 0.0);

//   if (diffuse > 0.0) {
//     pos += normal * 0.001;
//     HitInfo hitLight;
//     bool isHitLight = raycast(pos, lightDir, hitLight, 12.0);

//     diffuse *= float(!isHitLight);
//   }

//   int matId;
//   vec3 color = getBaseColor(pos, matId);
//   float ao = smoothstep(-0.1, 0.01, getMap(pos).x / length(hitInfo.sdfNormal));
//   // ao += dot(grad, normalize(1.0 / LIGHT_DIR)) * 0.5 + 0.5;

//   color *= (diffuse * 0.6 + 0.4) * uLightColor;
//   color *= ao * 0.6 + 0.4;

//   // color = mix(color, vec3(0.0, 0.0, 1.0), dot(grad, normalize(1.0 / -LIGHT_DIR)) * 0.1);

//   // color = cross(grad, LIGHT_DIR) * 0.5 + 0.5;
//   // color = cross(normalize(grad - uCameraPosition), LIGHT_DIR);
//   if (matId == 1) {
//     color *= (vec3(smoothstep(0.0, 1.0, -dot(normalize(uCameraPosition), grad) * 0.7 + 0.3)) * uMaterialSubsurfaceColor * 1.2) + 1.0;
//     // color = mix(color, uMaterialSubsurfaceColor, -dot(normalize(uCameraPosition), grad)) + 0.2;
//     color += pow(1.0 - diffuse, 3.0) * uMaterialSubsurfaceColor * 0.2;
//   }

//   return color;
// }

// https://www.shadertoy.com/view/dltGWl
vec3 lighting(
  int sssType, // 0 = Exponential, 1 = Gaussian
  HitInfo hitInfo,
  vec3 rayDirection,
  vec3 lightDir,
  vec3 lightColor
) {
  vec3 normal = hitInfo.normal;
  vec3 sdfNormal = hitInfo.sdfNormal;
  normal = mix(normal, sdfNormal, 0.5);

  float diffuseLambert = dot(normal, lightDir);

  // if (diffuseLambert > 0.0) {
  //   vec3 offsetPos = hitInfo.voxelPos + normal * 0.001;
  //   HitInfo hitLight;
  //   bool isHitLight = raycast(offsetPos, lightDir, hitLight, 12.0);
  //   diffuseLambert *= float(!isHitLight);
  // }

  float posDiffuseLambert = clamp(diffuseLambert, 0.0, 1.0);
  float negDiffuseLambert = clamp(-diffuseLambert, 0.0, 1.0);

  // Subsurface scattering
  vec3 ssRadius = 2.0 / 3.0 * uSubsurfaceRadius;
  vec3 sss;
  if (sssType == 0) {
    sss = 0.2 * pow(vec3(1.0 - posDiffuseLambert), 3.0 / (ssRadius + 0.001)) * pow(vec3(1.0 - negDiffuseLambert), 3.0 / (ssRadius + 0.001));
  } else {
    sss = 0.2 * exp(-3.0 * abs(diffuseLambert) / (ssRadius + 0.001));
  }

  vec3 halfVector = normalize(lightDir - rayDirection);
  float normalDotHalf = dot(normal, halfVector);

  // ggx / Trowbridge and Reitz specular model approximation.
  // TODO: Learn what this ^ is.
  float g = normalDotHalf * normalDotHalf * (uRoughness * uRoughness - 1.0) + 1.0;
  float ggx = (uRoughness * uRoughness) / (3.14159265 * g * g);

  // Shlick approximation.
  // TODO: Learn what this ^ is.
  float fresnel = 1.0 + dot(rayDirection, normal);
  // Fresnel amount.
  float f0 = (uRefractionIndex - 1.0) / (uRefractionIndex + 1.0);
  f0 = f0 * f0;
  float reflectivity = f0 + (1.0 - f0) * (1.0 - uRoughness) * (1.0 - uRoughness) * pow(fresnel, 5.0);

  vec3 color = vec3(0.0);
  int matId;
  vec3 diffuseColor = getBaseColor(hitInfo.voxelPos, matId);
  
  vec3 returnColor = vec3(0.0);
  // Diffuse + sss + specular.
  returnColor = lightColor * (
    posDiffuseLambert * (
      diffuseColor + reflectivity * ggx
    )
    + diffuseColor * uMaterialSubsurfaceColor * ssRadius * sss
  );

  // // Apply fog.
  // float fogAmount = 1.0 - exp(-0.02 * hitInfo.t * hitInfo.t);
  // returnColor = mix(returnColor, uFogColor, fogAmount);

  return returnColor;
}

vec3 render(vec3 rayOrigin, vec3 rayDirection) {
  HitInfo hitInfo;
  bool isHit = raycast(rayOrigin, rayDirection, hitInfo, MAX_TRAVEL_DIST);

  float t = hitInfo.t;

  // vec3 pos = rayOrigin + rayDirection * t;
  // vec3 voxelPos = hitInfo.voxelPos;

  // vec3 color = shade(pos, LIGHT_DIR, hitInfo);
  // vec3 color = lighting(1, hitInfo, rayDirection, LIGHT_DIR, uLightColor) + lighting(1, hitInfo, rayDirection, LIGHT_DIR_02, LIGHT_COLOR_02);
  vec3 color = lighting(0, hitInfo, rayDirection, LIGHT_DIR, uLightColor);
  // Tone mapping. Why tho?
  color = 2.0 * color / (0.8 + 2.5 * color);
  // Gamma correction. Also why tho?
  color = pow(color, vec3(0.4545));
  if (!isHit) {
    // color = vec3(0.76, 0.14, 0.14);
    // color = vec3(0.22, 0.01, 0.13);
    color = mix(uSkyLowColor, uSkyHighColor, smoothstep(0.0, 0.2, rayDirection.y));
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