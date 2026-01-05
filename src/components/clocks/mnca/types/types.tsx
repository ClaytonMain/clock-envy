import * as THREE from "three";

export type Rules = {
  born: [number, number]; // Avg. in range [0, 1].
  stable: [number, number]; // Avg. in range [0, 1].
  size: number; // Size of the neighborhood in number of cells from center. For convenience.
  activeCount: number; // Number of active cells in the neighborhood.
  neighborhood: number[][];
};

export interface MncaStore {
  rulesUpdatedAt: number;
  rules: Rules[];
}

export type MncaRuleUniforms = {
  uNbhood01: { value: number[] };
  uNbhood02: { value: number[] };
  uNbhoodBornRange01: { value: THREE.Vector2 };
  uNbhoodBornRange02: { value: THREE.Vector2 };
  uNbhoodStableRange01: { value: THREE.Vector2 };
  uNbhoodStableRange02: { value: THREE.Vector2 };
};

export type MncaUniforms = MncaRuleUniforms & {
  uDelta: { value: number };
  uIntensityLambda: { value: number };
  uColorTimeLambda: { value: number };
  uResolution: { value: THREE.Vector2 };
  uPreviousTexture: { value: THREE.Texture };
  uClockTexture: { value: THREE.Texture };
};
