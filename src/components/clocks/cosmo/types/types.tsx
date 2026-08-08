import * as THREE from "three";

export type BlackHoleUniforms = {
  uTime: { value: number };
  uDelta: { value: number };
  uCameraPosition: { value: THREE.Vector3 };
  uCameraSchwarzschildP: { value: THREE.Vector4 };
  uResolution: { value: THREE.Vector2 };
  uGlZ: { value: number };
  uDeflectionTableTexture: { value: THREE.DataTexture };
  uRayInverseRadiusTableTexture: { value: THREE.DataTexture };
  uU: { value: number };
  uUDot: { value: number };
  uE: { value: number };
  uESquare: { value: number };
};
