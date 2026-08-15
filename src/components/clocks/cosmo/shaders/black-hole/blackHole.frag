uniform float uTime;
uniform float uTimeDelta;
uniform vec3 uCameraPosition;
uniform vec4 uCameraSchwarzschildP;
uniform mat4 uCameraMatrixWorld;
uniform vec2 uResolution;
uniform float uGlZ;
uniform sampler2D uDeflectionTableTexture;
uniform sampler2D uRayInverseRadiusTableTexture;

#define PI 3.14159265359

// https://arxiv.org/pdf/2010.08735
// https://ebruneton.github.io/black_hole_shader/black_hole/functions.glsl.html

const float kMu = 4.0 / 27.0;
const float INNER_RADIUS = 1.0;
const float OUTER_RADIUS = 3.0;

const float TWO_THIRDS = 2.0 / 3.0;

const int DEFLECTION_TABLE_SIZE = 512;

float getTextureCoordFromUnitRange(float u) {
  return 0.5 / float(DEFLECTION_TABLE_SIZE) + u * (1.0 - 1.0 / float(DEFLECTION_TABLE_SIZE));
}

float getUApsisFromESquare(float eSquare) {
  float x = (2.0 / kMu) * eSquare - 1.0;
  return 1.0 / 3.0 + TWO_THIRDS * sin(asin(x) * (1.0 - TWO_THIRDS));
}

float getRayDeflectionTextureVFromESquareAndU(float eSquare, float u) {
  if (eSquare > kMu) {
    float x = u < TWO_THIRDS ? -sqrt(TWO_THIRDS - u) : sqrt(u - TWO_THIRDS);
    return (sqrt(TWO_THIRDS) + x) / (sqrt(TWO_THIRDS) + sqrt(1.0 - TWO_THIRDS));
  } else {
    return 1.0 - sqrt(max(1.0 - u / getUApsisFromESquare(eSquare), 0.0));
  }
}

vec2 LookupRayDeflection(
  const float eSquare,
  const float u,
  out vec2 deflectionApsis
) {
  float texU = getTextureCoordFromUnitRange(
    getRayDeflectionTextureUFromESquare(eSquare)
  );
  float texV = getTextureCoordFromUnitRange(
    getRayDeflectionTextureVFromESquareAndU(eSquare, u)
  );
  float texVApsis = getTextureCoordFromUnitRange(
    1.0);
  deflectionApsis = 
}

float TraceRay(
  const float u,
  const float uDot,
  const float eSquare,
  const float delta,
  const float alpha,
  const float uIc,
  const float uOc,
  out float u0,
  out float phi0,
  out float t0,
  out float alpha0,
  out float u1,
  out float phi1,
  out float t1,
  out float alpha1
) {
  // Compute the ray deflection.
  u0 = -1.0;
  u1 = -1.0;

  if (eSquare < kMu && u > 2.0 / 3.0) {
    return -1.0;
  }
}

vec3 render(vec3 rayOrigin, vec3 rayDirection) {
  // I'm working under the assumption that my `rayDirection` matches their `d` and we're just
  // going to ignore `e_tau`.

  vec3 eXPrime = normalize(uCameraPosition);
  vec3 eZPrime = normalize(cross(eXPrime, rayDirection));
  vec3 eYPrime = normalize(cross(eZPrime, eXPrime));

  const vec3 eZ = vec3(0.0, 0.0, 1.0);
  vec3 t = normalize(cross(eZ, eXPrime));

  // Why?
  if (dot(t, eYPrime) < 0.0) {
    t = -t;
  }

  float alpha = acos(clamp(dot(eXPrime, t), -1.0, 1.0));
  float delta = acos(clamp(dot(eXPrime, normalize(rayDirection)), -1.0, 1.0));

  float u = 1.0 / uCameraSchwarzschildP.y;
  float uDot = -u / tan(delta);
  float eSquare = uDot * uDot + u * u * (1.0 - u);
  float e = -sqrt(eSquare);

  const float U_IC = 1.0 / INNER_RADIUS;
  const float U_OC = 1.0 / OUTER_RADIUS;

  float u0, phi0, t0, alpha0, u1, phi1, t1, alpha1;
  float deflection = TraceRay(
    u,
    uDot,
    eSquare,
    delta,
    alpha,
    U_IC,
    U_OC,
    u0,
    phi0,
    t0,
    alpha0,
    u1,
    phi1,
    t1,
    alpha1
  );

  vec3 color = vec3(0.0);
  return rayDirection;
}

void main() {
  vec2 uv = gl_FragCoord.xy / uResolution.xy;
  uv -= 0.5;
  uv.x *= uResolution.x / uResolution.y;

  vec3 rayOrigin = uCameraPosition;
  vec4 directionOffset = uCameraMatrixWorld * vec4(uv.x, uv.y, uGlZ, 1.0);
  vec3 rayDirection = normalize(directionOffset.xyz - rayOrigin);

  vec3 color = render(rayOrigin, rayDirection);

  gl_FragColor = vec4(color, 1.0);

  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
