import { DateTime } from "luxon";
import type { RefObject } from "react";
import { create } from "zustand";
import {
  createJSONStorage,
  persist,
  subscribeWithSelector,
} from "zustand/middleware";
import type {
  BasicClockConfig,
  ClockName,
  StatsPosition,
} from "../types/types";
import * as UTILS from "../utils/utils";

interface AppStore {
  debug: boolean;
  sidebarOpen: boolean;
  availableClockNames: ClockName[];
  currentBasicClockConfig: BasicClockConfig;
  currentBasicClockConfigIndex: number;
  interactionState: "active" | "inactive";
  formatHours24: boolean;
  currentTimeValue: DateTime;
  timeOffsetMs: number;
  statsPosition: StatsPosition;
  statsContainerRef?: RefObject<HTMLDivElement>;
}

const persistList: (keyof AppStore)[] = [
  "formatHours24",
  "statsPosition",
  "timeOffsetMs",
];

const useAppStore = create<AppStore>()(
  subscribeWithSelector(
    persist(
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      (_set) => ({
        debug: false,
        sidebarOpen: false,
        availableClockNames: UTILS.getAvailableClockNames(
          window.location.hash === "#debug",
        ),
        currentBasicClockConfig:
          UTILS.getBasicClockConfigByName("Archduke Von Orben"),
        currentBasicClockConfigIndex:
          UTILS.getBasicClockConfigIndexByName("Archduke Von Orben"),
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
            Object.entries(state).filter(([key]) =>
              persistList.includes(key as keyof AppStore),
            ),
          ),
      },
    ),
  ),
);

export default useAppStore;
