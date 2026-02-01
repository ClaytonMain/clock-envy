import * as THREE from "three";
import useAppStore from "../../../../stores/useAppStore";

export function getActiveSegments(): number[] {
  const timeValue = useAppStore.getState().currentTimeValue;
  const segments: number[] = [];
  for (let i = 0; i < 6; i++) {
    const char = timeValue.toFormat("HHmmss").charAt(i);
    const segmentMap: Record<string, number[]> = {
      "0": [1, 1, 1, 1, 1, 1, 0],
      "1": [0, 1, 1, 0, 0, 0, 0],
      "2": [1, 1, 0, 1, 1, 0, 1],
      "3": [1, 1, 1, 1, 0, 0, 1],
      "4": [0, 1, 1, 0, 0, 1, 1],
      "5": [1, 0, 1, 1, 0, 1, 1],
      "6": [1, 0, 1, 1, 1, 1, 1],
      "7": [1, 1, 1, 0, 0, 0, 0],
      "8": [1, 1, 1, 1, 1, 1, 1],
      "9": [1, 1, 1, 1, 0, 1, 1],
    };
    segments.push(...(segmentMap[char] || [0, 0, 0, 0, 0, 0, 0]));
  }
  return segments;
}

export function getDisplayScaleVector(
  displayTextureWidth: number,
  displayTextureHeight: number,
): THREE.Vector2 {
  const targetAspect = displayTextureWidth / displayTextureHeight;
  const windowAspect = window.innerWidth / window.innerHeight;

  // If windowAspect > targetAspect scale x, otherwise scale y
  if (windowAspect > targetAspect) {
    return new THREE.Vector2((targetAspect * 2) / windowAspect, 1);
  } else {
    return new THREE.Vector2(1, (windowAspect * 2) / targetAspect);
  }
}
