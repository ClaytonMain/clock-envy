import * as THREE from "three";
import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";

type EpicycleData = {
  center: THREE.Vector2;
  outerPoint: THREE.Vector2;
  scale: number;
  rotation: number;
};

interface FourierStore {
  epicycleData: EpicycleData[];
}

const useFourierStore = create<FourierStore>()(
  subscribeWithSelector(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    (_set) => ({
      epicycleData: [],
    }),
  ),
);

export default useFourierStore;
