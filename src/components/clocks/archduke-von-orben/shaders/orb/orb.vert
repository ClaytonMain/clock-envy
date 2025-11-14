// Credit to Bruno Simon's Wobbly Sphere Shader tutorial, upon
// which this shader is based.
// https://threejs-journey.com/lessons/wobbly-sphere-shader#compute-the-normal

uniform mat4 uTextureMatrix;

uniform float uTime;
uniform float uBasePosFreq;
uniform float uBaseTimeFreq;
uniform float uBaseStrength;

uniform float uHTime;
uniform float uHSpringVelocity;
uniform float uHBasePosFreq;
uniform float uHBaseTimeFreq;
uniform float uHBaseStrength;

uniform float uMTime;
uniform float uMSpringVelocity;
uniform float uMBasePosFreq;
uniform float uMBaseTimeFreq;
uniform float uMBaseStrength;

uniform float uSTime;
uniform float uSSpringVelocity;
uniform float uSBasePosFreq;
uniform float uSBaseTimeFreq;
uniform float uSBaseStrength;

varying vec4 vUv;

attribute vec4 tangent;

#include ../../../../../shaders/includes/simplexNoise4d.glsl

float getWobble(vec3 position) {
  vec3 adjustedPosition = position + vec3(0.0, 0.0, uTime * 0.015);
  float wobble = simplexNoise4d(
    vec4(
      adjustedPosition * uBasePosFreq, // XYZ
      uTime * uBaseTimeFreq // W
    )
  ) * uBaseStrength;
  float hWobble = simplexNoise4d(
    vec4(
      adjustedPosition * uHBasePosFreq, // XYZ
      uHTime * uHBaseTimeFreq // W
    )
  ) * uHBaseStrength;
  float mWobble = simplexNoise4d(
    vec4(
      adjustedPosition * uMBasePosFreq, // XYZ
      uMTime * uMBaseTimeFreq // W
    )
  ) * uMBaseStrength;
  float sWobble = simplexNoise4d(
    vec4(
      adjustedPosition * uSBasePosFreq, // XYZ
      uSTime * uSBaseTimeFreq // W
    )
  ) * uSBaseStrength;
  return wobble + hWobble + mWobble + sWobble;
}

void main() {
  vec3 biTangent = cross(normal, tangent.xyz);

  // Neighbors positions
  float shift = 0.01;
  vec3 positionA = csm_Position + tangent.xyz * shift;
  vec3 positionB = csm_Position + biTangent * shift;

  // Wobble
  float wobble = getWobble(csm_Position);
  csm_Position += wobble * normal;
  positionA += getWobble(positionA) * normal;
  positionB += getWobble(positionB) * normal;

  // Compute normal
  vec3 toA = normalize(positionA - csm_Position);
  vec3 toB = normalize(positionB - csm_Position);
  csm_Normal = cross(toA, toB);

  vUv = uTextureMatrix * vec4(csm_Position, 1.0);
}
