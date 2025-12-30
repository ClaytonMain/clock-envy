export type Rules = {
  born: [number, number]; // Avg. in range [0, 1].
  stable: [number, number]; // Avg. in range [0, 1].
  size: number; // Size of the neighborhood in number of cells from center. For convenience.
  neighborhood: number[][];
};

export interface MncaStore {
  rules: Rules[];
  gameTextureSize: number;
  gameSpeed: number;
  neighborhoodSizeRange: [number, number]; // In number of cells from center.
}
