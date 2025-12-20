import { useFrame, useThree } from "@react-three/fiber";
import { useControls } from "leva";
import { useLayoutEffect, useMemo, useRef, type RefObject } from "react";
import * as THREE from "three";
import { GPUComputationRenderer } from "three/addons/misc/GPUComputationRenderer.js";
import gpgpuShader from "./shaders/gpgpu/gpgpu.glsl";

const gameVariables = {
  gameTextureSize: 2048,
  lifeProbability: 0.0,
  gameSpeed: 32,
};

const initialUniforms = {
  uRho: { value: 5 },
  uBeta: { value: new THREE.Vector2(34, 45) },
  uDelta: { value: new THREE.Vector2(34, 58) },
};
// const initialUniforms = {
//   uRho: { value: 4 },
//   uBeta: { value: new THREE.Vector2(34, 45) },
//   uDelta: { value: new THREE.Vector2(34, 57) },
// };

export default function useGPGPU({
  clockTextureRef,
}: {
  clockTextureRef?: RefObject<THREE.Texture>;
}) {
  const gl = useThree((state) => state.gl);

  const uniforms = useControls({
    rho: {
      value: initialUniforms.uRho.value,
      min: 1,
      max: 10,
      step: 1,
    },
    beta: {
      value: [initialUniforms.uBeta.value.x, initialUniforms.uBeta.value.y],
      min: 0,
      max: 441,
      step: 1,
    },
    delta: {
      value: [initialUniforms.uDelta.value.x, initialUniforms.uDelta.value.y],
      min: 0,
      max: 441,
      step: 1,
    },
    growthRate: {
      value: 2.0,
      min: 0.1,
      max: 32.0,
      step: 0.1,
    },
    decayRate: {
      value: 0.5,
      min: 0.1,
      max: 32.0,
      step: 0.1,
    },
  });

  const gpgpuTextureRef = useRef<THREE.Texture>(null!);

  const gpgpu = useMemo(() => {
    if (!clockTextureRef) return;
    const computation = new GPUComputationRenderer(
      gameVariables.gameTextureSize,
      gameVariables.gameTextureSize,
      gl,
    );

    const gameStateTexture = computation.createTexture();

    const gameStateArray = gameStateTexture.image.data as Float32Array;

    for (
      let i = 0;
      i < gameVariables.gameTextureSize * gameVariables.gameTextureSize;
      i++
    ) {
      const i4 = i * 4;

      gameStateArray[i4 + 0] =
        Math.random() > gameVariables.lifeProbability ? 0 : 1; // alive or dead
      gameStateArray[i4 + 1] = 0; // unused
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

    gameStateVariable.material.uniforms.uRho = { value: uniforms.rho };
    gameStateVariable.material.uniforms.uBeta = {
      value: new THREE.Vector2(uniforms.beta[0], uniforms.beta[1]),
    };
    gameStateVariable.material.uniforms.uDelta = {
      value: new THREE.Vector2(uniforms.delta[0], uniforms.delta[1]),
    };
    gameStateVariable.material.uniforms.uGrowthRate = {
      value: uniforms.growthRate,
    };
    gameStateVariable.material.uniforms.uDecayRate = {
      value: uniforms.decayRate,
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
  }, [gpgpu]);

  const frameDurationRef = useRef(1);
  const uTimeRef = useRef(0);

  useFrame((_, delta) => {
    if (!gpgpu) return;
    uTimeRef.current += Math.min(delta, 0.1);
    frameDurationRef.current += Math.min(delta, 0.1) * gameVariables.gameSpeed;
    if (frameDurationRef.current < 1) return;
    frameDurationRef.current = 0;

    if (clockTextureRef) {
      gpgpu.gameStateVariable.material.uniforms.uClockTexture.value =
        clockTextureRef.current;
    }
    gpgpu.gameStateVariable.material.uniforms.uRho.value = uniforms.rho;
    gpgpu.gameStateVariable.material.uniforms.uBeta.value = new THREE.Vector2(
      uniforms.beta[0],
      uniforms.beta[1],
    );
    gpgpu.gameStateVariable.material.uniforms.uDelta.value = new THREE.Vector2(
      uniforms.delta[0],
      uniforms.delta[1],
    );
    gpgpu.gameStateVariable.material.uniforms.uGrowthRate.value =
      uniforms.growthRate;
    gpgpu.gameStateVariable.material.uniforms.uDecayRate.value =
      uniforms.decayRate;

    gpgpu.computation.compute();

    gpgpuTextureRef.current = gpgpu.computation.getCurrentRenderTarget(
      gpgpu.gameStateVariable,
    ).texture;
  });

  return {
    gpgpuTexture: gpgpuTextureRef,
  };
}
