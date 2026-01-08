uniform float uDelta;
uniform float uTime;
uniform vec3 uCameraPosition;
uniform vec2 uResolution;
uniform float uGlZ;

varying mat4 vViewMatrix;

int MAX_STEPS = 64;
float VOXEL_SIZE = 1.0 / 32.0;

#include ../../../../../shaders/includes/simplexNoise4d.glsl

float sdRoundBox(vec3 p, vec3 b, float r) {
  vec3 q = abs(p) - b + r;
  return length(max(q, 0.0)) + min(max(q.x, max(q.y, q.z)), 0.0) - r;
}

float getRawMap(vec3 p) {
  // mat4 rotationX = mat4(1.0, 0.0, 0.0, 0.0, 0.0, cos(uTime * 0.2), -sin(uTime * 0.2), 0.0, 0.0, sin(uTime * 0.2), cos(uTime * 0.2), 0.0, 0.0, 0.0, 0.0, 1.0);
  // mat4 rotationY = mat4(cos(uTime * 0.3), 0.0, sin(uTime * 0.3), 0.0, 0.0, 1.0, 0.0, 0.0, -sin(uTime * 0.3), 0.0, cos(uTime * 0.3), 0.0, 0.0, 0.0, 0.0, 1.0);
  // mat4 rotation = rotationX * rotationY;
  // p = (inverse(rotation) * vec4(p, 1.0)).xyz;

  // float boxDist = sdRoundBox(p - vec3(0.0, 0.0, 0.0), vec3(10.0, 0.5, 8.0), 0.2);
  // return boxDist;

  return length(p - vec3(clamp(p.x, -5.0, 5.0), simplexNoise4d(vec4(p.x, 0.0, p.z, uTime * 0.1)) * 0.2, clamp(p.z, -5.0, 5.0)));
}

float getMapAndDistance(in vec3 p, out float rawDistance) {
  float d = getRawMap(p + 0.5 * VOXEL_SIZE);
  rawDistance = getRawMap(p);
  return step(d, 0.5 * VOXEL_SIZE);
}

// I think this is returning 1.0 if inside a voxel, 0.0 if outside.
float getMap(in vec3 p) {
  return step(getRawMap(p + 0.5 * VOXEL_SIZE), 0.5 * VOXEL_SIZE);
}

float raycast(in vec3 rayOrigin, in vec3 rayDirection, out vec3 oVoxelIntersectionPosition, out vec3 oVoxelFaceDirection, out vec3 oNewRayOrigin) {
  vec3 newRayOrigin = rayOrigin;

  vec3 pos = floor(newRayOrigin / VOXEL_SIZE) * VOXEL_SIZE;
  vec3 rayInverse = vec3(
    rayDirection.x != 0.0 ? 1.0 / rayDirection.x : 0.0,
    rayDirection.y != 0.0 ? 1.0 / rayDirection.y : 0.0,
    rayDirection.z != 0.0 ? 1.0 / rayDirection.z : 0.0
  );
  vec3 raySign = sign(rayDirection);
  vec3 distanceVector = (pos - newRayOrigin + 0.5 * VOXEL_SIZE + raySign * 0.5 * VOXEL_SIZE) * rayInverse;

  // Was called "res" before. Maybe stands for "result"?
  // Possibly indicates whether a hit was detected (-1.0 for no hit).
  float result = -1.0;
  vec3 mask = vec3(0.0);
  float rawDistance = 0.0;
  float totalDistance = 0.0;
  float minDistance = 99999.0;
  for (int i = 0; i < MAX_STEPS; i++) {
    if (getMapAndDistance(pos, rawDistance) > 0.5) {
      result = 1.0;
      break;
    }

    // if (rawDistance > 1000.0) {
    //   mask = step(distanceVector.xyz, distanceVector.yzx) * step(distanceVector.xyz, distanceVector.zxy);
    //   distanceVector += mask * raySign * VOXEL_SIZE * rayInverse;
    //   pos += mask * raySign * VOXEL_SIZE;
    //   break;
    // }

    minDistance = min(minDistance, rawDistance);
    // minDistance = rawDistance;
    if (minDistance > VOXEL_SIZE) {
      totalDistance += rawDistance;
      newRayOrigin = rayOrigin + rayDirection * (totalDistance - VOXEL_SIZE * 1.5);
      pos = floor(newRayOrigin / VOXEL_SIZE) * VOXEL_SIZE;
      distanceVector = (pos - newRayOrigin + 0.5 * VOXEL_SIZE + raySign * 0.5 * VOXEL_SIZE) * rayInverse;
    } else {
      // DDA implemented here.
      // Since this is DDA, this step() * step() thing is probably figuring out
      // which axis we step along next, but...
      // TODO: Understand why this step() * step() thing works.
      mask = step(distanceVector.xyz, distanceVector.yzx) * step(distanceVector.xyz, distanceVector.zxy);
      distanceVector += mask * raySign * VOXEL_SIZE * rayInverse;
      pos += mask * raySign * VOXEL_SIZE;
    }
  }

  oNewRayOrigin = newRayOrigin;

  // I think this bit calculates the exact intersection point along the ray.
  // Not 100% sure though.
  vec3 mini = (pos - newRayOrigin + 0.5 * VOXEL_SIZE - 0.5 * VOXEL_SIZE * vec3(raySign)) * rayInverse;
  float t = max(mini.x, max(mini.y, mini.z));

  oVoxelFaceDirection = mask;
  oVoxelIntersectionPosition = pos;

  return t * result;
}

vec3 render(vec3 rayOrigin, vec3 rayDirection) {
  vec3 color = vec3(0.0);

  // Raymarching
  vec3 voxPosition; // The point where we intersected the voxel (probably).
  vec3 voxDirection;  // The direction of the face of the voxel we hit (probably).
  vec3 newRayOrigin;
  float t = raycast(rayOrigin, rayDirection, voxPosition, voxDirection, newRayOrigin);

  // If we hit a voxel (I think is what this means)
  if (t > 0.0) {
    // 
    vec3 normal = -voxDirection * sign(rayDirection);
    vec3 pos = newRayOrigin + rayDirection * t;
    // TODO: Figure out what uvw is used for and what it means.
    vec3 uvw = pos - voxPosition;

    // TODO: Figure out why he separated all this out so much,
    // and what all this is doing.
    vec3 v1 = voxPosition + normal + voxDirection.yzx;
    vec3 v2 = voxPosition + normal - voxDirection.yzx;
    vec3 v3 = voxPosition + normal + voxDirection.zxy;
    vec3 v4 = voxPosition + normal - voxDirection.zxy;
    vec3 v5 = voxPosition + normal + voxDirection.yzx + voxDirection.zxy;
    vec3 v6 = voxPosition + normal - voxDirection.yzx + voxDirection.zxy;
    vec3 v7 = voxPosition + normal - voxDirection.yzx - voxDirection.zxy;
    vec3 v8 = voxPosition + normal + voxDirection.yzx - voxDirection.zxy;
    vec3 v9 = voxPosition + voxDirection.yzx;
    vec3 v10 = voxPosition - voxDirection.yzx;
    vec3 v11 = voxPosition + voxDirection.zxy;
    vec3 v12 = voxPosition - voxDirection.zxy;
    vec3 v13 = voxPosition + voxDirection.yzx + voxDirection.zxy;
    vec3 v14 = voxPosition - voxDirection.yzx + voxDirection.zxy;
    vec3 v15 = voxPosition - voxDirection.yzx - voxDirection.zxy;
    vec3 v16 = voxPosition + voxDirection.yzx - voxDirection.zxy;

    // Ok, but seriously, why this particular order?
    vec4 vc = vec4(getMap(v1), getMap(v2), getMap(v3), getMap(v4));
    vec4 vd = vec4(getMap(v5), getMap(v6), getMap(v7), getMap(v8));
    vec4 va = vec4(getMap(v9), getMap(v10), getMap(v11), getMap(v12));
    vec4 vb = vec4(getMap(v13), getMap(v14), getMap(v15), getMap(v16));

    // Ight, skipping a bunch of stuff wherein the above values are used to compute
    // lighting, "wireframe" effects, and ambient occlusion.
    // Just going to set color based on normal and distance for now.
    color = (normal * 0.5 + 0.5) * exp(-0.04 * t);
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