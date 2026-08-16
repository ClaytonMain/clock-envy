uniform float uTime;
uniform float uTimeDelta;
uniform vec3 uCameraPosition;
uniform vec4 uCameraSchwarzschildP;
uniform mat4 uCameraMatrixWorld;
uniform vec2 uResolution;
uniform float uGlZ;
uniform sampler2D uDeflectionTableTexture;
uniform sampler2D uRayInverseRadiusTableTexture;
uniform samplerCube uStarMapTexture;
uniform float uDiscParticleParam01;
uniform float uDiscParticleParam02;
uniform float uDiscParticleParam03;
uniform float uDiscParticleParam04;

#define PI 3.14159265359

// https://arxiv.org/pdf/2010.08735
// https://ebruneton.github.io/black_hole_shader/black_hole/functions.glsl.html

// https://science.nasa.gov/3d-resources/hipparcos-star-map/

const float kMu = 4.0 / 27.0;
const float INNER_RADIUS = 3.0;
const float OUTER_RADIUS = 8.0;

const float TWO_THIRDS = 2.0 / 3.0;

const int DEFLECTION_TABLE_SIZE = 512;
const int RAY_INVERSE_RADIUS_TABLE_SIZE = 64;

const float STARS_CUBE_MAP_SIZE = 720.0;
const float MAX_FOOTPRINT_SIZE = 8.0;
const float MAX_FOOTPRINT_LOD = 4.0;

float getTextureCoordFromUnitRange(float u, int size) {
  return 0.5 / float(size) + u * (1.0 - 1.0 / float(size));
}

float getRayDeflectionTextureUFromESquare(float eSquare) {
  if (eSquare < kMu) {
    return 0.5 - sqrt(-log(1.0 - eSquare / kMu) * (1.0 / 50.0));
  } else {
    return 0.5 + sqrt(-log(1.0 - kMu / eSquare) * (1.0 / 50.0));
  }
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

vec2 lookupRayDeflection(
  const float eSquare,
  const float u,
  out vec2 deflectionApsis
) {
  float texU = getTextureCoordFromUnitRange(getRayDeflectionTextureUFromESquare(eSquare), DEFLECTION_TABLE_SIZE);
  float texV = getTextureCoordFromUnitRange(getRayDeflectionTextureVFromESquareAndU(eSquare, u), DEFLECTION_TABLE_SIZE);
  float texVApsis = getTextureCoordFromUnitRange(1.0, DEFLECTION_TABLE_SIZE);
  deflectionApsis = texture2D(uDeflectionTableTexture, vec2(texU, texVApsis)).xy;
  return texture2D(uDeflectionTableTexture, vec2(texU, texV)).xy;
}

float getRayInverseRadiusTextureUFromESquare(float eSquare) {
  return 1.0 / (1.0 + 6.0 * eSquare);
}

float getPhiUbFromESquare(float eSquare) {
  return (1.0 + eSquare) / (1.0 / 3.0 + 2.0 * eSquare * sqrt(eSquare));
}

vec2 lookupRayInverseRadius(
  const float eSquare,
  const float phi
) {
  float texU = getTextureCoordFromUnitRange(getRayInverseRadiusTextureUFromESquare(eSquare), RAY_INVERSE_RADIUS_TABLE_SIZE);
  float texV = getTextureCoordFromUnitRange(phi / getPhiUbFromESquare(eSquare), RAY_INVERSE_RADIUS_TABLE_SIZE);
  return texture2D(uRayInverseRadiusTableTexture, vec2(texU, texV)).xy;
}

float filteredPulse(float edge0, float edge1, float x, float fw) {
  fw = max(fw, 1e-6);
  float x0 = x - fw * 0.5;
  float x1 = x0 + fw;
  return max(0.0, (min(x1, edge1) - max(x0, edge0)) / fw);
}

float traceRay(
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

  vec2 deflectionApsis;
  vec2 deflection = lookupRayDeflection(eSquare, u, deflectionApsis);

  float rayDeflection = deflection.x;

  if (uDot > 0.0) {
    rayDeflection = eSquare < kMu ? 2.0 * deflectionApsis.x - rayDeflection : -1.0;
  }

  float s = sign(uDot);
  float phi = deflection.x + (s == 1.0 ? PI - delta : delta) + s * alpha;
  float phiApsis = deflectionApsis.x + PI / 2.0;
  phi0 = mod(phi, PI);
  vec2 ui0 = lookupRayInverseRadius(eSquare, phi0);
  if (phi0 < phiApsis) {
    float side = s * (ui0.x - u);
    if (side > 1e-3 || (side > -1e-3 && alpha < delta)) {
      u0 = ui0.x;
      phi0 = alpha + phi - phi0;
      t0 = s * (ui0.y - deflection.y);
    }
  }
  phi = 2.0 * phiApsis - phi;
  phi1 = mod(phi, PI);
  vec2 ui1 = lookupRayInverseRadius(eSquare, phi1);
  if (eSquare < kMu && s == 1.0 && phi1 < phiApsis) {
    u1 = ui1.x;
    phi1 = alpha + phi - phi1;
    t1 = 2.0 * deflectionApsis.y - ui1.y - deflection.y;
  }

  float fw0 = min(fwidth(ui0.x), fwidth(u0 == -1.0 ? u1 : u0));
  float fw1 = min(fwidth(ui1.x), fwidth(u1 == -1.0 ? u0 : u1));
  alpha0 = filteredPulse(uOc, uIc, u0, fw0);
  alpha1 = filteredPulse(uOc, uIc, u1, fw1);
  if (s == 1.0 && abs(eSquare - kMu) < min(fwidth(eSquare), kMu)) {
    if (alpha0 < 0.99)
      u0 = 2.0 / (1.0 / uIc + 1.0 / uOc);
    if (alpha1 < 0.99)
      u1 = 2.0 / (1.0 / uIc + 1.0 / uOc);
  }

  return rayDeflection;
}

vec3 galaxyColor(vec3 rayDirection) {
  return textureCube(uStarMapTexture, rayDirection).rgb * 6.78494e-5;
}

vec3 starColor(vec3 rayDirection, float lensingAmplificationFactor) {
  vec3 dxDir = dFdx(rayDirection);
  vec3 dyDir = dFdy(rayDirection);

  vec3 absDir = abs(rayDirection);
  float maxAbsDirComp = max(absDir.x, max(absDir.y, absDir.z));
  if (maxAbsDirComp == absDir.x) {
    rayDirection = rayDirection.zyx;
    dxDir = dxDir.zyx;
    dyDir = dyDir.zyx;
  } else if (maxAbsDirComp == absDir.y) {
    rayDirection = rayDirection.xzy;
    dxDir = dxDir.xzy;
    dyDir = dyDir.xzy;
  }

  float invDirZ = 1.0 / rayDirection.z;
  // vec2 uv = rayDirection.xy * invDirZ * 0.5 + 0.5;
  vec2 uv = rayDirection.xy * invDirZ;
  vec2 dxUv = (dxDir.xy - uv * dxDir.z) * invDirZ;
  vec2 dyUv = (dyDir.xy - uv * dyDir.z) * invDirZ;

  vec2 dUv = max(abs(dxUv + dyUv), abs(dxUv - dyUv));
  vec2 fWidth = (0.5 * STARS_CUBE_MAP_SIZE / MAX_FOOTPRINT_SIZE) * dUv;
  float lod = max(ceil(max(log2(fWidth.x), log2(fWidth.y))), 0.1);
  float lodWidth = (0.5 * STARS_CUBE_MAP_SIZE) / pow(2.0, lod);
  if (lod > MAX_FOOTPRINT_LOD) {
    return textureCube(uStarMapTexture, rayDirection).xyz;
  }

  mat2 toScreenPixelCoords = inverse(mat2(dxUv, dyUv));
  ivec2 ij0 = ivec2(floor((uv - dUv) * lodWidth));
  ivec2 ij1 = ivec2(floor((uv + dUv) * lodWidth));
  vec3 colorSum = vec3(0.0);
  for (int j = ij0.y; j <= ij1.y; ++j) {
    for (int i = ij0.x; i <= ij1.x; ++i) {
      vec2 texelUv = (vec2(i, j) + vec2(0.5)) / lodWidth;
      vec3 texelDir = vec3(texelUv * rayDirection.z, rayDirection.z);
      if (maxAbsDirComp == absDir.x) {
        texelDir = texelDir.zyx;
      } else if (maxAbsDirComp == absDir.y) {
        texelDir = texelDir.xzy;
      }
      vec2 deltaUv;
      vec3 starColor = textureCube(uStarMapTexture, texelDir, lod).rgb;
      // vec3 starColor = textureCube(uStarMapTexture, texelDir).rgb;
      vec2 starUv = uv - texelUv + deltaUv / lodWidth;
      vec2 starPixelCoords = toScreenPixelCoords * starUv;
      vec2 overlap = max(vec2(1.0) - abs(starPixelCoords), 0.0);
      colorSum += starColor * overlap.x * overlap.y;
    }
  }
  return colorSum * lensingAmplificationFactor;
}

// (inverse max and min radius, initial azimuth angle, precession 'ratio')
const vec4 DISC_PARTICLE_PARAMS[5] = vec4[](vec4(0.5000, 0.4747, 0.0010, 1.31), vec4(1.8289, 0.4170, 1.2694, 0.83), vec4(1.7071, 0.3536, 2.3562, 0.67), vec4(1.5773, 0.2887, 3.1416, 0.50), vec4(1.5000, 0.2500, 4.7124, 0.42));

float random(vec2 st) {
  return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
}
float valueNoise(vec2 st) {
  vec2 i = floor(st);
  vec2 f = fract(st);
  float a = random(i);
  float b = random(i + vec2(1.0, 0.0));
  float c = random(i + vec2(0.0, 1.0));
  float d = random(i + vec2(1.0, 1.0));
  vec2 u = smoothstep(0.0, 1.0, f);
  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}

vec4 getDiscColor(vec2 p, float pT, bool topSide, float DopplerFactor) {
  float pR = length(p);
  float pPhi = atan(p.y, p.x);

  float density = 0.0;
  for (int i = 0; i < 5; ++i) {
    // vec4 params = DISC_PARTICLE_PARAMS[i];
    vec4 params = vec4(uDiscParticleParam01, uDiscParticleParam02, uDiscParticleParam03, uDiscParticleParam04);
    float u1 = params.x;
    float u2 = params.y;
    float phi0 = params.z;
    float dThetaDPhi = params.w;
    float uAvg = (u1 + u2) * 0.5;
    float dPhiDt = uAvg * sqrt(0.5 * uAvg);
    float phi = dPhiDt * pT + phi0;
    float a = mod(pPhi - phi, 2.0 * PI);
    float s = sin(dThetaDPhi * (a + phi));
    float r = 1.0 / (u1 + (u2 - u1) * s * s);
    vec2 d = vec2(a - PI, r - pR) * vec2(1.0 / PI, 0.5);
    // float noise = valueNoise(d * vec2(pR / OUTER_RADIUS, 1.0));
    float noise = valueNoise(d * vec2(pR / OUTER_RADIUS, 1.0) * 20.0);
    density += smoothstep(1.0, 0.0, length(d)) * noise;
  }

  vec3 color = max(density, 0.0) * vec3(1.0, 0.5, 0.2) * DopplerFactor * 2.0;
  float alpha = smoothstep(INNER_RADIUS, INNER_RADIUS * 1.2, pR) * smoothstep(OUTER_RADIUS, OUTER_RADIUS / 1.2, pR);
  return vec4(color * alpha, alpha);
  // return vec4(vec3(1.0, 0.5, 0.2) * DopplerFactor, 1.0);
}

vec3 render(vec3 rayOrigin, vec3 rayDirection) {
  // I'm working under the assumption that my `rayDirection` matches their `d` and we're just
  // going to set `eTau` to `vec3(0.0, 0.0, 0.0)`.

  vec3 eXPrime = normalize(uCameraPosition);
  vec3 eZPrime = normalize(cross(eXPrime, rayDirection));
  vec3 eYPrime = normalize(cross(eZPrime, eXPrime));

  // const vec3 eZ = vec3(0.0, 0.0, 1.0);
  const vec3 eZ = vec3(0.0, 0.0, 1.0);
  vec3 t = normalize(cross(eZ, eZPrime));
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
  float deflection = traceRay(u, uDot, eSquare, delta, alpha, U_IC, U_OC, u0, phi0, t0, alpha0, u1, phi1, t1, alpha1);

  vec4 kS = vec4(1.0, 0.0, 0.0, 0.0);
  vec3 eTau = vec3(0.0, 0.0, 0.0);
  vec4 l = vec4(e / (1.0 - u), -uDot, 0.0, u * u);
  float gklReceiver = kS.x * l.x * (1.0 - u) - kS.y * l.y / (1.0 - u) - u * dot(eTau, eYPrime) * l.w / (u * u);

  float deltaPrime = delta + max(deflection, 0.0);
  vec3 dPrime = cos(deltaPrime) * eXPrime + sin(deltaPrime) * eYPrime;

  // vec3 color = dPrime;
  // vec3 color = textureCube(uStarMapTexture, dPrime).rgb;
  vec3 color = vec3(0.0, 0.0, 0.0);

  if (deflection >= 0.0) {
    float gklSource = e;
    float dopplerFactor = gklReceiver / gklSource;

    float omega = length(cross(dFdx(rayDirection), dFdy(rayDirection)));
    float omegaPrime = length(cross(dFdx(dPrime), dFdy(dPrime)));

    float lensingAmplificationFactor = min(omega / omegaPrime, 1e6);

    float pixelArea = max(omega * (360.0 * 360.0), 1.0);

    // color += galaxyColor(dPrime);
    // color += starColor(dPrime, lensingAmplificationFactor / pixelArea);
    // color += smoothstep(0.0, 0.5, textureCube(uStarMapTexture, dPrime).rgb);
    color += textureCube(uStarMapTexture, dPrime).rgb * smoothstep(0.0, 1.0, lensingAmplificationFactor / pixelArea);
    // color = dPrime;
  }

  if (u1 >= 0.0 && alpha1 > 0.0) {
    float gklSource = e * sqrt(2.0 / (2.0 - 3.0 * u1)) - u1 * sqrt(u1 / (2.0 - 3.0 * u1)) * dot(eZ, eZPrime);
    // float gklSource = e * sqrt(2.0 / (2.0 - 3.0 * u1)) - u1 * sqrt(u1 / (2.0 - 3.0 * u1)) * dot(eY, eYPrime);
    float dopplerFactor = gklReceiver / gklSource;
    bool topSide = (mod(abs(phi1 - alpha), 2.0 * PI) < 1e-3) == (eXPrime.z > 0.0);
    vec3 i1 = (eXPrime * cos(phi1) + eYPrime * sin(phi1)) / u1;
    vec4 discColor = getDiscColor(i1.xy, uCameraSchwarzschildP.x - t1, topSide, dopplerFactor);
    color = color * (1.0 - discColor.a) + alpha1 * discColor.rgb;
  }
  if (u0 >= 0.0 && alpha0 > 0.0) {
    float gklSource = e * sqrt(2.0 / (2.0 - 3.0 * u0)) - u0 * sqrt(u0 / (2.0 - 3.0 * u0)) * dot(eZ, eZPrime);
    // float gklSource = e * sqrt(2.0 / (2.0 - 3.0 * u0)) - u0 * sqrt(u0 / (2.0 - 3.0 * u0)) * dot(eY, eYPrime);
    float dopplerFactor = gklReceiver / gklSource;
    bool topSide = (mod(abs(phi0 - alpha), 2.0 * PI) < 1e-3) == (eXPrime.z > 0.0);
    vec3 i0 = (eXPrime * cos(phi0) + eYPrime * sin(phi0)) / u0;
    vec4 discColor0 = getDiscColor(i0.xy, uCameraSchwarzschildP.x - t0, topSide, dopplerFactor);
    color = color * (1.0 - discColor0.a) + alpha0 * discColor0.rgb;
  }

  return color;
  // return rayDirection;
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
