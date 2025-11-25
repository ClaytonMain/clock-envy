import { DateTime } from "luxon";
import type { RefObject } from "react";
import { create } from "zustand";
import {
  createJSONStorage,
  persist,
  subscribeWithSelector,
} from "zustand/middleware";
import type { CLOCK_NAMES } from "../constants/constants";
import type { StatsPosition } from "../types/types";

interface AppStore {
  debug: boolean;
  sidebarOpen: boolean;
  currentClockName: (typeof CLOCK_NAMES)[number];
  interactionState: "active" | "inactive";
  formatHours24: boolean;
  currentTimeValue: DateTime;
  timeOffsetMs: number;
  statsPosition: StatsPosition;
  statsContainerRef?: RefObject<HTMLDivElement>;
}

const persistOmit: (keyof AppStore)[] = ["statsContainerRef"];

const useAppStore = create<AppStore>()(
  subscribeWithSelector(
    persist(
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      (_set) => ({
        debug: true,
        sidebarOpen: false,
        currentClockName: "Archduke Von Orben",
        interactionState: "active",
        formatHours24: true,
        currentTimeValue: DateTime.now(),
        timeOffsetMs: 0,
        statsPosition: "bl",
        statsContainerRef: undefined,
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
