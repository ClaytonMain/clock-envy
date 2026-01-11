uniform float uDelta;
uniform float uTime;
uniform vec3 uCameraPosition;
uniform vec2 uResolution;
uniform float uGlZ;

varying mat4 vViewMatrix;

int MAX_STEPS = 128;
float VOXEL_SIZE = 1.0 / 16.0;
float MAX_STEP_TRAVEL_DIST = 100.0;

#include ../../../../../shaders/includes/simplexNoise3d.glsl

// HUUUUUUUUGE shoutout to Shadertoy user "gelami" for their
// "Hybrid SDF-Voxel Traversal" shader:
// https://www.shadertoy.com/view/dtVSzw
// This shader's raycast function is heavily based on the one from that shader.

float sdRoundBox(vec3 p, vec3 b, float r) {
  vec3 q = abs(p) - b + r;
  return length(max(q, 0.0)) + min(max(q.x, max(q.y, q.z)), 0.0) - r;
}

float getMap(vec3 p) {
  float planeDistance = dot(p, vec3(0.0, 1.0, 0.0)) + simplexNoise3d(vec3(p.x * 0.5, uTime * 0.2, p.z * 0.5)) * 0.5;
  float boxDistance = sdRoundBox(p - vec3(0.0, 0.0, 0.0), vec3(5.0, 2.0, 5.0), 0.0);

  // opIntersection
  return max(planeDistance, boxDistance);
}

// TODO: Comment this or come up with more human-readable names.
struct HitInfo {
  float t;
  vec3 n;
  vec3 id;
  int i;
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

    float d = map(voxel ? voxelPos : pos);

    if (!voxel) {
      t += d;
      if (d < voxSwitchDist) {
        voxelPos = getVoxelPosition(rayOrigin + rayDir * max(t - voxSwitchDist, 0.0), voxSize);
        voxel = true;
        voxelIndex = 0;
      }
    } else
      {
    vec3 n = () }
}
}

vec3 render(vec3 rayOrigin, vec3 rayDirection) {
vec3 color = vec3(0.0);

  // Raymarching
vec3 voxPosition;
vec3 voxDirection;
float t = raycast(rayOrigin, rayDirection, voxPosition, voxDirection);

if (t > 0.0) {
vec3 normal = - voxDirection * sign(rayDirection);
    // vec3 pos = newRayOrigin + rayDirection * t;
    // // TODO: Figure out what uvw is used for and what it means.
    // vec3 uvw = pos - voxPosition;

    // // TODO: Figure out why he separated all this out so much,
    // // and what all this is doing.
    // vec3 v1 = voxPosition + normal + voxDirection.yzx;
    // vec3 v2 = voxPosition + normal - voxDirection.yzx;
    // vec3 v3 = voxPosition + normal + voxDirection.zxy;
    // vec3 v4 = voxPosition + normal - voxDirection.zxy;
    // vec3 v5 = voxPosition + normal + voxDirection.yzx + voxDirection.zxy;
    // vec3 v6 = voxPosition + normal - voxDirection.yzx + voxDirection.zxy;
    // vec3 v7 = voxPosition + normal - voxDirection.yzx - voxDirection.zxy;
    // vec3 v8 = voxPosition + normal + voxDirection.yzx - voxDirection.zxy;
    // vec3 v9 = voxPosition + voxDirection.yzx;
    // vec3 v10 = voxPosition - voxDirection.yzx;
    // vec3 v11 = voxPosition + voxDirection.zxy;
    // vec3 v12 = voxPosition - voxDirection.zxy;
    // vec3 v13 = voxPosition + voxDirection.yzx + voxDirection.zxy;
    // vec3 v14 = voxPosition - voxDirection.yzx + voxDirection.zxy;
    // vec3 v15 = voxPosition - voxDirection.yzx - voxDirection.zxy;
    // vec3 v16 = voxPosition + voxDirection.yzx - voxDirection.zxy;

    // // Ok, but seriously, why this particular order?
    // vec4 vc = vec4(getMap(v1), getMap(v2), getMap(v3), getMap(v4));
    // vec4 vd = vec4(getMap(v5), getMap(v6), getMap(v7), getMap(v8));
    // vec4 va = vec4(getMap(v9), getMap(v10), getMap(v11), getMap(v12));
    // vec4 vb = vec4(getMap(v13), getMap(v14), getMap(v15), getMap(v16));

    // Ight, skipping a bunch of stuff wherein the above values are used to compute
    // lighting, "wireframe" effects, and ambient occlusion.
    // Just going to set color based on normal and distance for now.
color = (normal * 0.5 + 0.5) * exp(- 0.04 * t);
}

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