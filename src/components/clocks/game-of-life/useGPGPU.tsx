import { useFrame, useThree } from "@react-three/fiber";
import { useLayoutEffect, useMemo, useRef, type RefObject } from "react";
import * as THREE from "three";
import { GPUComputationRenderer } from "three/addons/misc/GPUComputationRenderer.js";
import gpgpuShader from "./shaders/gpgpu/gpgpu.glsl";

const gameVariables = {
  gameTextureSize: 1024,
  lifeProbability: 1.1,
  gameSpeed: 32,
};

export default function useGPGPU({
  clockTextureRef,
}: {
  clockTextureRef?: RefObject<THREE.Texture>;
}) {
  const gl = useThree((state) => state.gl);

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

    if (clockTextureRef) {
      gameStateVariable.material.uniforms.uClockTexture = {
        value: clockTextureRef.current,
      };
    }

    return {
      computation,
      gameStateVariable,
    };
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

    gpgpu.computation.compute();

    gpgpuTextureRef.current = gpgpu.computation.getCurrentRenderTarget(
      gpgpu.gameStateVariable,
    ).texture;
  });

  return {
    gpgpuTexture: gpgpuTextureRef,
  };
}
