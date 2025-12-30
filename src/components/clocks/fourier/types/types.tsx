import * as THREE from "three";

export type FourierData = {
  re: number;
  im: number;
  freq: number;
  amp: number;
  phase: number;
};

export type EpicycleData = {
  center: THREE.Vector2;
  outerPoint: THREE.Vector2;
  scale: number;
  rotation: number;
};
