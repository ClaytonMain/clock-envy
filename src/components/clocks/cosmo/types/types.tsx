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
  uStarMapTexture: { value: THREE.CubeTexture };
  uDiscParticleParam01: { value: number };
  uDiscParticleParam02: { value: number };
  uDiscParticleParam03: { value: number };
  uDiscParticleParam04: { value: number };
};
