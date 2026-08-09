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

float getRayDeflectionTextureUFromESquare(const float eSquare) {
  if (eSquare < kMu) {
    return 0.5 - sqrt(-log(1.0 - eSquare / kMu) * (1.0 / 50.0));
  } else {
    return 0.5 + sqrt(-log(1.0 - kMu / eSquare) * (1.0 / 50.0));
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
