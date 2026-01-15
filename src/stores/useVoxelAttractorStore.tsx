import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";
import type { VoxelAttractorStore } from "../components/clocks/voxel-attractor/types/types";

const useVoxelAttractorStore = create<VoxelAttractorStore>()(
  subscribeWithSelector(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    (_set) => ({
      activeSegments: Array.from({ length: 6 * 7 }, () => 1),
    }),
  ),
);

export default useVoxelAttractorStore;
