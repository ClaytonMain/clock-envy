uniform float uDelta;
uniform float uTime;
uniform vec3 uCameraPosition;
uniform vec2 uResolution;
uniform float uGlZ;
uniform vec3[4] uBoundingBoxCenters;
uniform vec3[4] uBoundingBoxBValues;
uniform float[28] uActiveSegments;
uniform vec3[28] uSegmentAPositions;
uniform vec3[28] uSegmentBPositions;
uniform vec3[2] uColonCenters;

uniform vec3 uLightColor01;
uniform vec3 uLightColor02;
uniform vec3 uMaterialColor;
uniform vec3 uMaterialSubsurfaceColor;
uniform float uSubsurfaceRadius;
uniform float uRoughness;
uniform float uRefractionIndex;
uniform vec3 uFogColor;
uniform vec3 uSkyLowColor;
uniform vec3 uSkyHighColor;
uniform vec3 uPlatformColor;
uniform vec3 uSeaLowColor;
uniform vec3 uSeaHighColor;
uniform float uNormalMix;
uniform float uSkyRangeMin;
uniform float uSkyRangeMax;

varying mat4 vViewMatrix;

const int MAX_STEPS = 128;
const float VOXEL_SIZE = 1.0 / 16.0;
const float MAX_TRAVEL_DIST = 100.0;
// const vec3 LIGHT_DIR = normalize(vec3(1.0, 1.0, 1.0));
const vec3 LIGHT_DIR = normalize(vec3(0.1, -0.28, -2.0));
const vec3 LIGHT_DIR_02 = normalize(vec3(-0.1, -0.3, -2.0));
// const vec3 LIGHT_COLOR_02 = vec3(0.25);

const vec3 BOX_CENTER = vec3(0.0, -12.2, 0.0);
const vec3 BOX_B = vec3(6.0, 10.5, 1.25);

const vec3 SEA_HEIGHT = vec3(0.0, -2.2, 0.0);

#include ../../../../../shaders/includes/simplexNoise4d.glsl

// HUGE shoutout to Shadertoy user "gelami" for their
// "Hybrid SDF-Voxel Traversal" shader:
// https://www.shadertoy.com/view/dtVSzw
// This shader's raycast function is heavily based on the one from that shader.

vec4 sdgSphere( in vec3 p, in float r ) {
  float l = length(p);
  return vec4(l-r, p/l);
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

vec4 sdgMin(vec4 a, vec4 b, float k) {
  k *= 4.0;
  float h = max(k - abs(a.x - b.x), 0.0);
  float m = 0.25 * h * h / k;
  float n = 0.50 * h / k;
  return vec4(min(a.x, b.x) - m, mix(a.yzw, b.yzw, (a.x < b.x) ? n : 1.0 - n));
}

vec4 getMap(in vec3 p, out int closestMatId) {
  vec4 minDist = vec4(1000.0);
  closestMatId = -1;

  // Distance to the 6 digit boxes and their segments.
  vec4 d;
  for (int i = 0; i < 4; i++) {
    vec3 boxCenter = uBoundingBoxCenters[i];
    vec3 boxB = uBoundingBoxBValues[i];
    vec3 localP = p - boxCenter;
    d = sdgBox(localP, boxB, 0.0);
    if (d.x < minDist.x && d.x >= 0.25) {
      minDist = d;
      closestMatId = 1;
    }
    if (d.x < 0.25) {
      for (int j = i * 7; j < (i + 1) * 7; j++) {
        vec3 aPos = uSegmentAPositions[j] + (1.0 - uActiveSegments[j]) * vec3(0.0, 9001.0, 0.0);
        vec3 bPos = uSegmentBPositions[j] + (1.0 - uActiveSegments[j]) * vec3(0.0, 9001.0, 0.0);
        d = sdgMin(sdgSegment(p, aPos, bPos, 0.22), minDist, 0.07);
        if (d.x < minDist.x) {
          minDist = d;
          closestMatId = 1;
        }
      }
    }
  }

  // Distance to the main platform box.
  d = sdgMin(minDist, sdgBox(p - BOX_CENTER, BOX_B, 0.3), 0.07);
  if (d.x < minDist.x) {
    minDist = d;
    closestMatId = 0;
  }

  // Distance to colons.
  for (int i = 0; i < 2; i++) {
    vec3 colonCenter = uColonCenters[i];
    d = sdgMin(sdgSphere(p - colonCenter, 0.28), minDist, 0.07);
    if (d.x < minDist.x) {
      minDist = d;
      closestMatId = 1;
    }
  }

  return minDist;
}

struct HitInfo {
  float t;
  vec3 normal;
  vec3 sdfNormal;
  vec3 voxelPos;
  vec3 pos;
  int voxelIndex;
  int matId;
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
  // TODO: What's this `iro` mean / used for?
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

    int matId;
    vec4 d = getMap(voxel ? voxelPos : pos, matId);

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
        int unusedMatId;
        vec4 sdfData = getMap(pos, unusedMatId);
        oHitInfo.t = t;
        oHitInfo.voxelPos = voxelPos;
        oHitInfo.pos = rayOrigin + rayDir * t;
        oHitInfo.normal = -prd;
        oHitInfo.sdfNormal = normalize(sdfData.yzw);
        oHitInfo.voxelIndex = voxelIndex;
        oHitInfo.matId = matId;
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

vec3 grad(vec3 p) {
  int ignoreDisId;
  const vec2 e = vec2(0, 0.1);
  return (getMap(p, ignoreDisId).x - vec3(getMap(p - e.yxx, ignoreDisId).x, getMap(p - e.xyx, ignoreDisId).x, getMap(p - e.xxy, ignoreDisId).x)) / e.y;
}

// https://www.shadertoy.com/view/dltGWl
vec3 lighting(
  int sssType, // 0 = Exponential, 1 = Gaussian
  HitInfo hitInfo,
  vec3 lightDir,
  vec3 rayDirection,
  vec3 lightColor,
  vec3 diffuseColor,
  vec3 subsurfaceColor,
  float subsurfaceRadius,
  float roughness,
  float refractionIndex
) {
  vec3 normal = hitInfo.normal;
  vec3 sdfNormal = hitInfo.sdfNormal;
  vec3 mixedNormal = normalize(mix(normal, sdfNormal, uNormalMix));
  // normal = mixedNormal;

  float normalDotLight = dot(normal, lightDir); // Lambertian diffuse.
  float posNormalDotLight = clamp(normalDotLight, 0.0, 1.0);
  float negNormalDotLight = clamp(-normalDotLight, 0.0, 1.0);

  float mixedNormalDotLight = dot(mixedNormal, lightDir);
  float posMixedNormalDotLight = clamp(mixedNormalDotLight, 0.0, 1.0);
  float negMixedNormalDotLight = clamp(-mixedNormalDotLight, 0.0, 1.0);

  // Subsurface scattering
  vec3 sss;
  vec3 ssRadiusVec3 = vec3(subsurfaceRadius);
  if (sssType == 0) {
    // Exponential
    sss = 0.2 * pow(vec3(1.0 - posMixedNormalDotLight), 3.0 / (ssRadiusVec3 + 0.001)) *
      pow(vec3(1.0 - negMixedNormalDotLight), 3.0 / (ssRadiusVec3 + 0.001));
  } else {
    // Gaussian
    sss = 0.2 * exp(-3.0 * abs(mixedNormalDotLight) / (ssRadiusVec3 + 0.001));
  }

  if (normalDotLight > 0.0) {
    vec3 offsetPos = hitInfo.pos + normal * 0.001;
    HitInfo hitLight;
    bool isHitLight = raycast(offsetPos, lightDir, hitLight, 12.0);
    normalDotLight *= float(!isHitLight);
    posNormalDotLight = clamp(normalDotLight, 0.0, 1.0);
  }

  vec3 halfVector = normalize(lightDir - rayDirection);
  float normalDotHalf = dot(normal, halfVector);

  // ggx / Trowbridge and Reitz specular model approximation.
  // TODO: Learn what this ^ is.
  float g = normalDotHalf * normalDotHalf * (roughness * roughness - 1.0) + 1.0;
  float ggx = (roughness * roughness) / (3.14159265 * g * g);

  // Shlick approximation.
  // TODO: Learn what this ^ is.
  float fresnel = 1.0 + dot(rayDirection, normal);
  // Fresnel amount.
  float f0 = (refractionIndex - 1.0) / (refractionIndex + 1.0);
  f0 = f0 * f0;
  float reflectivity = f0 + (1.0 - f0) * (1.0 - roughness) * (1.0 - roughness) * pow(fresnel, 5.0);

  vec3 returnColor = vec3(0.0);
  // Diffuse + sss + specular.
  returnColor = lightColor * (posNormalDotLight * (diffuseColor + reflectivity * ggx) + diffuseColor * subsurfaceColor * ssRadiusVec3 * sss);

  int unusedMatId;
  float ao = smoothstep(-0.08, 0.04, getMap(hitInfo.pos, unusedMatId).x / length(grad(hitInfo.pos)));
  returnColor *= ao * 0.7 + 0.3;

  // // Apply fog.
  // float fogAmount = 1.0 - exp(-0.02 * hitInfo.t * hitInfo.t);
  // returnColor = mix(returnColor, uFogColor, fogAmount);

  return returnColor;
}

vec3 render(vec3 rayOrigin, vec3 rayDirection) {
  HitInfo hitInfo;
  bool isHit = raycast(rayOrigin, rayDirection, hitInfo, MAX_TRAVEL_DIST);

  int hitMatId = hitInfo.matId;

  float t = hitInfo.t;

  vec3 color = vec3(0.0);
  if (isHit) {
    color = lighting(0, // SSS type
    hitInfo, LIGHT_DIR, // Light direction
    rayDirection, // Ray direction
    uLightColor01, // Light color
    uMaterialColor, // Diffuse color
    uMaterialSubsurfaceColor, // Subsurface color
    uSubsurfaceRadius, // Subsurface radius
    uRoughness, // Roughness
    uRefractionIndex // Refraction index
    );
    color += lighting(0, // SSS type
    hitInfo, LIGHT_DIR_02, // Light direction
    rayDirection, // Ray direction
    uLightColor02, // Light color
    uMaterialColor, // Diffuse color
    uMaterialSubsurfaceColor, // Subsurface color
    uSubsurfaceRadius, // Subsurface radius
    uRoughness, // Roughness
    uRefractionIndex // Refraction index
    );
  } else {
    color = mix(uSkyLowColor, uSkyHighColor, smoothstep(uSkyRangeMin, uSkyRangeMax, rayDirection.y));
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