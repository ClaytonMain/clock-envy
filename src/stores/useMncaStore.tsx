import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";
import type { MncaStore } from "../components/clocks/mnca/types/types";

const useMncaStore = create<MncaStore>()(
  subscribeWithSelector(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    (_set) => ({
      rules: [
        {
          born: [0.3, 0.4],
          stable: [0.4, 0.6],
          size: 3,
          neighborhood: [
            [0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 1, 0, 0, 0],
            [0, 0, 1, 1, 1, 0, 0],
            [0, 1, 1, 0, 1, 1, 0],
            [0, 0, 1, 1, 1, 0, 0],
            [0, 0, 0, 1, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0],
          ],
        },
        {
          born: [0.3, 0.4],
          stable: [0.4, 0.6],
          size: 3,
          neighborhood: [
            [0, 0, 1, 1, 1, 0, 0],
            [0, 1, 1, 1, 1, 1, 0],
            [1, 1, 1, 0, 1, 1, 1],
            [1, 1, 0, 0, 0, 1, 1],
            [1, 1, 1, 0, 1, 1, 1],
            [0, 1, 1, 1, 1, 1, 0],
            [0, 0, 1, 1, 1, 0, 0],
          ],
        },
      ],
      gameTextureSize: 2048,
      gameSpeed: 32,
      neighborhoodSizeRange: [1, 7],
    }),
  ),
);

export default useMncaStore;
