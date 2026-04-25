import * as THREE from "three";
import {
  BASIC_CLOCK_CONFIGS,
  DEFAULT_CLOCK_NAME,
} from "../constants/constants";
import type { ClockName } from "../types/types";

export function getDisplayScale({ targetAspect }: { targetAspect: number }) {
  const windowAspect = window.innerWidth / window.innerHeight;
  let scaleX = 1;
  let scaleY = 1;

  if (windowAspect > targetAspect) {
    scaleX = (targetAspect * 2) / windowAspect;
    scaleY = 2;
  } else {
    scaleX = 2;
    scaleY = (windowAspect * 2) / targetAspect;
  }
  return new THREE.Vector2(scaleX, scaleY);
}

export function getAvailableClockNames(debug: boolean) {
  const clockNames: ClockName[] = BASIC_CLOCK_CONFIGS.filter(
    (config) =>
      config.displayOnSite ||
      (debug && (config.displayOnDebug ?? config.displayOnSite)),
  ).map((config) => config.name);
  clockNames.sort();
  return clockNames;
}

export function getBasicClockConfigByName(name: ClockName) {
  return BASIC_CLOCK_CONFIGS.find((config) => config.name === name)!;
}

export function getBasicClockConfigIndexByName(name: ClockName) {
  return BASIC_CLOCK_CONFIGS.findIndex((config) => config.name === name);
}

export function getCurrentClockNameFromLocation() {
  const path = window.location.pathname;
  const clockNameFromPath = path.slice(1).toLowerCase().replace(/\s+/g, "");
  console.log("clockNameFromPath", clockNameFromPath, "path", path);
  const availableClockNames = getAvailableClockNames(
    window.location.hash === "#debug",
  );
  for (const clockName of availableClockNames) {
    if (clockName.toLowerCase().replace(/\s+/g, "") === clockNameFromPath) {
      return clockName;
    }
  }
  return DEFAULT_CLOCK_NAME;
}
