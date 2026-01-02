import { useFrame, useThree } from "@react-three/fiber";
import { useLayoutEffect, useMemo, useRef, type RefObject } from "react";
import * as THREE from "three";
import { GPUComputationRenderer } from "three/addons/misc/GPUComputationRenderer.js";
import useMncaStore from "../../../stores/useMncaStore";
import {
  GAME_SPEED,
  GAME_TEXTURE_SIZE,
  NEIGHBORHOOD_SIZE_RANGE,
} from "./constants/constants";
import gpgpuShader from "./shaders/gpgpu/gpgpu.glsl";

const LIFE_PROBABILITY = 0.0; // All dead initially, may change later.

export default function useGPGPU({
  clockTextureRef,
}: {
  clockTextureRef?: RefObject<THREE.Texture>;
}) {
  const gl = useThree((state) => state.gl);

  const gpgpuTextureRef = useRef<THREE.Texture>(null!);

  function getRuleUniforms() {
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
      uNbhood01,
      uNbhood02,
      uNbhoodBornRange01: new THREE.Vector2(rules[0].born[0], rules[0].born[1]),
      uNbhoodBornRange02: new THREE.Vector2(rules[1].born[0], rules[1].born[1]),
      uNbhoodStableRange01: new THREE.Vector2(
        rules[0].stable[0],
        rules[0].stable[1],
      ),
      uNbhoodStableRange02: new THREE.Vector2(
        rules[1].stable[0],
        rules[1].stable[1],
      ),
    };
  }

  const uniforms = useMemo(() => {
    const ruleUniforms = getRuleUniforms();
    const uniforms = {
      uDelta: { value: 0 },
      uDecayRate: { value: 0.1 },
      uNbhood01: { value: ruleUniforms.uNbhood01 },
      uNbhood02: { value: ruleUniforms.uNbhood02 },
      uNbhoodBornRange01: {
        value: new THREE.Vector2(
          ruleUniforms.uNbhoodBornRange01.x,
          ruleUniforms.uNbhoodBornRange01.y,
        ),
      },
      uNbhoodBornRange02: {
        value: new THREE.Vector2(
          ruleUniforms.uNbhoodBornRange02.x,
          ruleUniforms.uNbhoodBornRange02.y,
        ),
      },
      uNbhoodStableRange01: {
        value: new THREE.Vector2(
          ruleUniforms.uNbhoodStableRange01.x,
          ruleUniforms.uNbhoodStableRange01.y,
        ),
      },
      uNbhoodStableRange02: {
        value: new THREE.Vector2(
          ruleUniforms.uNbhoodStableRange02.x,
          ruleUniforms.uNbhoodStableRange02.y,
        ),
      },
    };
    return uniforms;
  }, []);

  const gpgpu = useMemo(() => {
    if (!clockTextureRef) return;
    const computation = new GPUComputationRenderer(
      GAME_TEXTURE_SIZE,
      GAME_TEXTURE_SIZE,
      gl,
    );

    const gameStateTexture = computation.createTexture();

    const gameStateArray = gameStateTexture.image.data as Float32Array;

    for (let i = 0; i < GAME_TEXTURE_SIZE * GAME_TEXTURE_SIZE; i++) {
      const i4 = i * 4;

      gameStateArray[i4 + 0] = Math.random() > LIFE_PROBABILITY ? 0 : 1; // State
      gameStateArray[i4 + 1] = 0; // Intensity
      gameStateArray[i4 + 2] = 0; // unused
      gameStateArray[i4 + 3] = 1; // unused
    }

    const gameStateVariable = computation.addVariable(
      "vGameState",
      gpgpuShader,
      gameStateTexture,
    );

    computation.setVariableDependencies(gameStateVariable, [gameStateVariable]);

    gpgpuTextureRef.current = gameStateTexture;

    gameStateVariable.material.uniforms.uDelta = { value: uniforms.uDelta };
    gameStateVariable.material.uniforms.uDecayRate = {
      value: uniforms.uDecayRate,
    };

    const ruleUniforms = getRuleUniforms();
    gameStateVariable.material.uniforms.uNbhood01 = {
      value: ruleUniforms.uNbhood01,
    };
    gameStateVariable.material.uniforms.uNbhood02 = {
      value: ruleUniforms.uNbhood02,
    };
    gameStateVariable.material.uniforms.uNbhoodBornRange01 = {
      value: ruleUniforms.uNbhoodBornRange01,
    };
    gameStateVariable.material.uniforms.uNbhoodBornRange02 = {
      value: ruleUniforms.uNbhoodBornRange02,
    };
    gameStateVariable.material.uniforms.uNbhoodStableRange01 = {
      value: ruleUniforms.uNbhoodStableRange01,
    };
    gameStateVariable.material.uniforms.uNbhoodStableRange02 = {
      value: ruleUniforms.uNbhoodStableRange02,
    };

    if (clockTextureRef) {
      gameStateVariable.material.uniforms.uClockTexture = {
        value: clockTextureRef.current,
      };
    }

    return {
      computation,
      gameStateVariable,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gl, clockTextureRef]);

  useLayoutEffect(() => {
    if (!gpgpu) return;
    const error = gpgpu.computation.init();
    if (error !== error) {
      console.error("GPUComputationRenderer initialization error:", error);
    }
    const unsubRulesUpdatedAt = useMncaStore.subscribe(
      (state) => state.rulesUpdatedAt,
      () => {
        const ruleUniforms = getRuleUniforms();
        uniforms.uNbhood01.value = ruleUniforms.uNbhood01;
        uniforms.uNbhood02.value = ruleUniforms.uNbhood02;
        uniforms.uNbhoodBornRange01.value = ruleUniforms.uNbhoodBornRange01;
        uniforms.uNbhoodBornRange02.value = ruleUniforms.uNbhoodBornRange02;
        uniforms.uNbhoodStableRange01.value = ruleUniforms.uNbhoodStableRange01;
        uniforms.uNbhoodStableRange02.value = ruleUniforms.uNbhoodStableRange02;
      },
    );
    return () => {
      unsubRulesUpdatedAt();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gpgpu]);

  const frameDurationRef = useRef(1);
  const uDeltaRef = useRef(0);
  useFrame((_, delta) => {
    if (!gpgpu) return;
    uDeltaRef.current = Math.min(delta, 0.1);
    frameDurationRef.current += uDeltaRef.current * GAME_SPEED;
    if (frameDurationRef.current < 1) return;
    frameDurationRef.current = 0;

    if (clockTextureRef) {
      gpgpu.gameStateVariable.material.uniforms.uClockTexture.value =
        clockTextureRef.current;
    }
    gpgpu.gameStateVariable.material.uniforms.uDelta.value = uDeltaRef.current;

    gpgpu.gameStateVariable.material.uniforms.uDecayRate.value = 0.1;
    gpgpu.gameStateVariable.material.uniforms.uNbhood01.value =
      uniforms.uNbhood01.value;
    gpgpu.gameStateVariable.material.uniforms.uNbhood02.value =
      uniforms.uNbhood02.value;
    gpgpu.gameStateVariable.material.uniforms.uNbhoodBornRange01.value =
      uniforms.uNbhoodBornRange01.value;
    gpgpu.gameStateVariable.material.uniforms.uNbhoodBornRange02.value =
      uniforms.uNbhoodBornRange02.value;
    gpgpu.gameStateVariable.material.uniforms.uNbhoodStableRange01.value =
      uniforms.uNbhoodStableRange01.value;
    gpgpu.gameStateVariable.material.uniforms.uNbhoodStableRange02.value =
      uniforms.uNbhoodStableRange02.value;

    gpgpu.computation.compute();

    gpgpuTextureRef.current = gpgpu.computation.getCurrentRenderTarget(
      gpgpu.gameStateVariable,
    ).texture;
  });

  return {
    gpgpuTexture: gpgpuTextureRef,
  };
}
