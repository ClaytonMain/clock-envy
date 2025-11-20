// Credit to Bruno Simon's Wobbly Sphere Shader tutorial, upon
// which this shader is based.
// https://threejs-journey.com/lessons/wobbly-sphere-shader#compute-the-normal

uniform mat4 uTextureMatrix;

uniform float uTime;
uniform float uBasePosFreq;
uniform float uBaseTimeFreq;
uniform float uBaseStrength;

uniform float uHTime;
uniform float uHBasePosFreq;
uniform float uHBaseTimeFreq;
uniform float uHBaseStrength;

uniform float uMTime;
uniform float uMBasePosFreq;
uniform float uMBaseTimeFreq;
uniform float uMBaseStrength;

uniform float uSTime;
uniform float uSBasePosFreq;
uniform float uSBaseTimeFreq;
uniform float uSBaseStrength;

varying vec4 vUvTextureMatrix;
varying float vSteppedToCameraAmount;

attribute vec4 tangent;

#include ../../../../../shaders/includes/simplexNoise4d.glsl

float getWobble(vec3 pos, vec3 norm, float steppedToCameraAmount) {
  vec3 adjustedPos = pos + vec3(0.0, 0.0, uTime * 0.015);
  float wobble =
    simplexNoise4d(
      vec4(
        adjustedPos * uBasePosFreq, // XYZ
        uTime * uBaseTimeFreq // W
      )
    ) *
    uBaseStrength;
  float hWobble =
    simplexNoise4d(
      vec4(
        (adjustedPos + vec3(0.0, 0.0, uHTime * 0.01)) * uHBasePosFreq, // XYZ
        uHTime * uHBaseTimeFreq // W
      )
    ) *
    uHBaseStrength;
  float mWobble =
    simplexNoise4d(
      vec4(
        (adjustedPos + vec3(0.0, 0.0, uMTime * 0.01)) * uMBasePosFreq, // XYZ
        uMTime * uMBaseTimeFreq // W
      )
    ) *
    uMBaseStrength;
  float sWobble =
    simplexNoise4d(
      vec4(
        (adjustedPos + vec3(0.0, 0.0, uSTime * 0.01)) * uSBasePosFreq, // XYZ
        uSTime * uSBaseTimeFreq // W
      )
    ) *
    uSBaseStrength;

  float finalWobble = wobble + hWobble + mWobble + sWobble;
  finalWobble *= (steppedToCameraAmount * 0.5) + 0.5;
  return finalWobble;
}

void main() {
  vec3 biTangent = cross(normal, tangent.xyz);

  // Neighbors positions
  float shift = 0.01;
  vec3 positionA = csm_Position + tangent.xyz * shift;
  vec3 positionB = csm_Position + biTangent * shift;

  float toCameraAmount = dot(normal, vec3(0.0, 0.0, 1.0)) * 0.5 + 0.5;
  float steppedToCameraAmount = smoothstep(0.98, 0.89, toCameraAmount * toCameraAmount);
  vSteppedToCameraAmount = steppedToCameraAmount;

  // Wobble
  float wobble = getWobble(csm_Position, normal, steppedToCameraAmount);
  // wobble *= smoothstep(0.0, 1.0, pow(dot(normal, vec3(0.0, 0.0, -1.0)) * 0.5 + 0.5, 0.5));
  csm_Position += wobble * normal;
  positionA += getWobble(positionA, normal, steppedToCameraAmount) * normal;
  positionB += getWobble(positionB, normal, steppedToCameraAmount) * normal;
  // Compute normal
  vec3 toA = normalize(positionA - csm_Position);
  vec3 toB = normalize(positionB - csm_Position);
  csm_Normal = cross(toA, toB);

  vUvTextureMatrix = uTextureMatrix * vec4(csm_Position, 1.0);
}
