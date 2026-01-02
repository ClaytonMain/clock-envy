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
