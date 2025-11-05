import { create } from "zustand";
import {
  createJSONStorage,
  persist,
  subscribeWithSelector,
} from "zustand/middleware";
import type { CLOCK_NAMES } from "../constants/constants";

interface AppStore {
  sidebarOpen: boolean;
  currentClockName: (typeof CLOCK_NAMES)[number];
  interactionState: "active" | "inactive";
  formatHours24: boolean;
}

const persistOmit: (keyof AppStore)[] = [];

const useAppStore = create<AppStore>()(
  subscribeWithSelector(
    persist(
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      (_set) => ({
        sidebarOpen: false,
        currentClockName: "Archduke Von Orben",
        interactionState: "active",
        formatHours24: true,
      }),
      {
        name: "app-store",
        version: 0,
        storage: createJSONStorage(() => localStorage),
        partialize: (state) =>
          Object.fromEntries(
            Object.entries(state).filter(
              ([key]) => !persistOmit.includes(key as keyof AppStore),
            ),
          ),
      },
    ),
  ),
);

export default useAppStore;
