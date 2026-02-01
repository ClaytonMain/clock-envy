import * as THREE from "three";

export type BlackHoleUniforms = {
  uTime: { value: number };
  uCameraPosition: { value: THREE.Vector3 };
  uResolution: { value: THREE.Vector2 };
  uGlZ: { value: number };
};
