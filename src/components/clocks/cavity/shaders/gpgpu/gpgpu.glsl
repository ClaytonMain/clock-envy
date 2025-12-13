// gpgpuActualSize.glsl

uniform float uTime;
uniform float uDelta;
uniform ivec3 uCubeCounts;
uniform float uSizeSpeed;
uniform vec3 uNoiseOffsets;
uniform sampler2D uClockTexture;

#include ../../../../../shaders/includes/simplexNoise4d.glsl

void main() {
  vec2 uv = gl_FragCoord.xy / resolution.xy;
  int index = int(gl_FragCoord.x - 0.5 + (gl_FragCoord.y - 0.5) * resolution.x);

  float positionX = float(index % uCubeCounts.x);
  float positionY = floor(float(index) / float(uCubeCounts.x * uCubeCounts.z));
  float positionZ = float(int(floor(float(index) / float(uCubeCounts.x))) % int(uCubeCounts.z));

  vec3 position = vec3(positionX, positionY, 0.0);
  position = position / float(uCubeCounts.x);
  vec3 flowField = vec3(simplexNoise4d(vec4(position.xyz + uNoiseOffsets.x, uTime)), simplexNoise4d(vec4(position.xyz + uNoiseOffsets.y, uTime)), simplexNoise4d(vec4(position.xyz + uNoiseOffsets.z, uTime)));
  flowField = normalize(flowField);

  vec4 targetSizeInfo = vec4(step((positionZ - 1.5) / float(uCubeCounts.z), smoothstep(-1.0, 1.0, flowField)), 1.0);

  #ifdef USE_CLOCK_TEXTURE
  vec2 clockUV = (vec2(positionX, positionY) + 0.5) / vec2(float(uCubeCounts.x), float(uCubeCounts.y));
  vec4 clockInfo = texture(uClockTexture, clockUV);
  targetSizeInfo.xyz *= 1.0 - step(0.5, clockInfo.xyz);
  #endif

  vec4 actualSizeInfo = texture(sizeTexture, uv);

  actualSizeInfo = mix(actualSizeInfo, targetSizeInfo, 1.0 - pow(uSizeSpeed, uDelta));

  gl_FragColor = actualSizeInfo;
}
