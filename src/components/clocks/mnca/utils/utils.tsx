import * as THREE from "three";
import useMncaStore from "../../../../stores/useMncaStore";
import { NEIGHBORHOOD_SIZE_RANGE } from "../constants/constants";
import type { MncaRuleUniforms } from "../types/types";

export function getRuleUniforms(): MncaRuleUniforms {
  const rules = [...useMncaStore.getState().rules];
  const uNbhood01 = rules[0].neighborhood
    .map((row) => {
      const newRow = [...row];
      while (newRow.length < NEIGHBORHOOD_SIZE_RANGE[1] * 2 + 1) {
        newRow.push(0);
        newRow.unshift(0);
      }
      return newRow;
    })
    .flat();
  while (uNbhood01.length < (NEIGHBORHOOD_SIZE_RANGE[1] * 2 + 1) ** 2) {
    uNbhood01.push(0);
    uNbhood01.unshift(0);
  }
  const uNbhood02 = rules[1].neighborhood
    .map((row) => {
      const newRow = [...row];
      while (newRow.length < NEIGHBORHOOD_SIZE_RANGE[1] * 2 + 1) {
        newRow.push(0);
        newRow.unshift(0);
      }
      return newRow;
    })
    .flat();
  while (uNbhood02.length < (NEIGHBORHOOD_SIZE_RANGE[1] * 2 + 1) ** 2) {
    uNbhood02.push(0);
    uNbhood02.unshift(0);
  }
  return {
    uNbhood01: { value: uNbhood01 },
    uNbhood02: { value: uNbhood02 },
    uNbhoodBornRange01: {
      value: new THREE.Vector2(rules[0].born[0], rules[0].born[1]),
    },
    uNbhoodBornRange02: {
      value: new THREE.Vector2(rules[1].born[0], rules[1].born[1]),
    },
    uNbhoodStableRange01: {
      value: new THREE.Vector2(rules[0].stable[0], rules[0].stable[1]),
    },
    uNbhoodStableRange02: {
      value: new THREE.Vector2(rules[1].stable[0], rules[1].stable[1]),
    },
  };
}
