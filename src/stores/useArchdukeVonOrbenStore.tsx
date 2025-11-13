import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";

interface ArchdukeVonOrbenStore {
  uHSpringVelocity: number;
  uMSpringVelocity: number;
  uSSpringVelocity: number;
}

const useArchdukeVonOrbenStore = create<ArchdukeVonOrbenStore>()(
  subscribeWithSelector(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    (_set) => ({
      uHSpringVelocity: 0,
      uMSpringVelocity: 0,
      uSSpringVelocity: 0,
    }),
  ),
);

export default useArchdukeVonOrbenStore;
