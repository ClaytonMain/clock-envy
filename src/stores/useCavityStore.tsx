import * as THREE from "three";
import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";

interface CavityStore {
  primaryColor: THREE.Color;
  secondaryColor: THREE.Color;
}

const useCavityStore = create<CavityStore>()(
  subscribeWithSelector(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    (_set) => ({
      primaryColor: new THREE.Color("#31E981"),
      secondaryColor: new THREE.Color("#363946"),
    }),
  ),
);

export default useCavityStore;
