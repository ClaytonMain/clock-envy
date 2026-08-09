import * as THREE from "three";

export type BlackHoleUniforms = {
  uTime: { value: number };
  uTimeDelta: { value: number };
  uCameraPosition: { value: THREE.Vector3 };
  uCameraSchwarzschildP: { value: THREE.Vector4 };
  uCameraMatrixWorld: { value: THREE.Matrix4 };
  uResolution: { value: THREE.Vector2 };
  uGlZ: { value: number };
  uDeflectionTableTexture: { value: THREE.DataTexture };
  uRayInverseRadiusTableTexture: { value: THREE.DataTexture };
};
