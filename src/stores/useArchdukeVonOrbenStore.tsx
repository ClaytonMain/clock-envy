import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";

interface ArchdukeVonOrbenStore {
  uHSpringVelocity: number;
  uHForce: number;
  uMSpringVelocity: number;
  uMForce: number;
  uSSpringVelocity: number;
  uSForce: number;
}

const useArchdukeVonOrbenStore = create<ArchdukeVonOrbenStore>()(
  subscribeWithSelector(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    (_set) => ({
      uHSpringVelocity: 0,
      uHForce: 0,
      uMSpringVelocity: 0,
      uMForce: 0,
      uSSpringVelocity: 0,
      uSForce: 0,
    }),
  ),
);

export default useArchdukeVonOrbenStore;
