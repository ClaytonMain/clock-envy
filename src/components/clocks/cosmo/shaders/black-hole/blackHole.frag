uniform float uTime;
uniform vec2 uResolution;
uniform vec3 uCameraPosition;
uniform float uGlZ;

varying mat4 vViewMatrix;

#define PI 3.14159265359

// https://arxiv.org/pdf/2010.08735
// https://ebruneton.github.io/black_hole_shader/black_hole/functions.glsl.html

const float kMu = 4.0 / 27.0;

float getRayDeflectionTextureUFromESquare(const float eSquare) {
  if (eSquare < kMu) {
    return 0.5 - sqrt(-log(1.0 - eSquare / kMu) * (1.0 / 50.0));
  } else {
    return 0.5 + sqrt(-log(1.0 - kMu / eSquare) * (1.0 / 50.0));
  }
}

vec3 render(vec3 rayOrigin, vec3 rayDirection) {
  vec3 color = vec3(0.0);
  return rayDirection;
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
