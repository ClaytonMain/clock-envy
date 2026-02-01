uniform vec2 uResolution;
uniform vec3 uCameraPosition;
uniform float uGlZ;

varying mat4 vViewMatrix;

#define PI 3.14159265359

const int MAX_STEPS = 128;
const float MAX_TRAVEL_DIST = 100.0;
const float MAX_REVOLUTIONS = 2.0;

const float ACCRETION_MIN_R = 1.5;
const float ACCRETION_WIDTH = 5.0;
const float ACCRETION_BRIGHTNESS = 0.9;
const float ACCRETION_TEMPERATURE = 3900.0;

const float STAR_MIN_TEMPERATURE = 4000.0;
const float STAR_MAX_TEMPERATURE = 15000.0;

const float STAR_BRIGHTNESS = 1.0;
const float GALAXY_BRIGHTNESS = 0.4;

const float PLANET_AMBIENT = 0.1;
const float PLANET_LIGHTNESS = 1.5;

// https://github.com/oseiskar/black-hole/blob/master/raytracer.glsl

vec4 sdgSphere(in vec3 p, in float r) {
  float l = length(p);
  return vec4(l - r, p / l);
}

vec4 getMap(in vec3 p) {
  vec4 minDist = vec4(1000.0);

  vec4 d;

  d = sdgSphere(p, 1.0);
  minDist = minDist.x < d.x ? minDist : d;

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

vec3 render(vec3 rayOrigin, vec3 rayDirection) {
  vec3 pos = rayOrigin;

  float rayIntensity = 1.0;
  float rayDopplerFactor = 1.0;

  // Not sure if I'll use this, but keeping it for now in case.
  vec3 cameraVelocity = vec3(0.0, 0.0, 0.0);

  float gamma = 1.0 / sqrt(1.0 - dot(cameraVelocity, cameraVelocity));
  rayDopplerFactor = gamma * (1.0 - dot(rayDirection, -cameraVelocity));

  vec4 color = vec4(0.0);

  float u = 1.0 / length(pos);
  float oldU;
  float u0 = u;

  vec3 normalVec = normalize(pos);
  vec3 tangentVec = normalize(cross(cross(normalVec, rayDirection), normalVec));
  float du = -dot(rayDirection, normalVec) / dot(rayDirection, tangentVec) * u;
  float du0 = du;

  float phi = 0.0;
  float t = uTime;
  float dt = 1.0;

  vec3 oldPos;

  float stepSize;

  for (int i = 0; i < MAX_STEPS; i++) {
    stepSize = MAX_REVOLUTIONS * 2.0 * PI / float(MAX_STEPS);

    float maxRelativeUChange = (1.0 - log(u)) * 10.0 / float(MAX_STEPS);
    if (((du > 0.0 || (du0 < 0.0 && u0 / u < 5.0)) && abs(du) > abs(maxRelativeUChange * u) / stepSize)) {
      stepSize = maxRelativeUChange * u / abs(du);
    }

    oldU = u;

    u += du * stepSize;
    float ddu = -u * (1.0 - 1.5 * u * u);
    du += ddu * stepSize;

    if (u < 0.0) {
      break;
    }

    phi += stepSize;

    oldPos = pos;
    pos = (cos(phi) * normalVec + sin(phi) * tangentVec) / u;

    rayDirection = pos - oldPos;
    float solidIsecT = 2.0;
    float rayLength = length(rayDirection);
  }

  // rayIntensity /= rayDopplerFactor * rayDopplerFactor * rayDopplerFactor;

  // HitInfo hitInfo;
  // bool isHit = raycast(rayOrigin, rayDirection, hitInfo, MAX_TRAVEL_DIST);

  // vec3 color;
  // if (isHit) {
  //   color = vec3(0.0);
  // } else {
  //   color = vec3(0.8);
  // }

  // // Tone mapping. Why tho?
  // color = 2.0 * color / (0.8 + 2.5 * color);
  // // Gamma correction. Also why tho?
  // color = pow(color, vec3(0.4545));

  // return color;
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