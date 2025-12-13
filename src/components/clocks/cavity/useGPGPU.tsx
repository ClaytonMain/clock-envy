/**
 * Props to wtshm for the original useGPGPU hook that this is based on.
 * https://codesandbox.io/p/sandbox/admiring-christian-nnxq97
 */

import { useFrame, useThree } from "@react-three/fiber";
import { useLayoutEffect, useMemo, useRef, type RefObject } from "react";
import * as THREE from "three";
import { GPUComputationRenderer } from "three/examples/jsm/misc/GPUComputationRenderer.js";
import gpgpuShader from "./shaders/gpgpu/gpgpu.glsl";

export default function useGPGPU({
  cubeCounts,
  clockTextureRef,
  sizeSpeed = 0.01,
  timeFactor = 0.1,
  noiseOffsets = [0, 1, 2],
}: {
  cubeCounts: [number, number, number];
  clockTextureRef?: RefObject<THREE.Texture>;
  sizeSpeed?: number;
  timeFactor?: number;
  noiseOffsets?: [number, number, number];
}) {
  const gl = useThree((state) => state.gl);

  const { totalCubes, textureSize } = useMemo(() => {
    const totalCubes = cubeCounts[0] * cubeCounts[1] * cubeCounts[2];
    const textureSize = Math.ceil(Math.sqrt(totalCubes));
    return { totalCubes, textureSize };
  }, [cubeCounts]);

  const gpgpuTextureRef = useRef<THREE.Texture>(null!);

  const gpgpu = useMemo(() => {
    const computation = new GPUComputationRenderer(
      textureSize,
      textureSize,
      gl,
    );

    const gpgpuTexture = computation.createTexture();

    const sizeArray = gpgpuTexture.image.data as Float32Array;

    for (let i = 0; i < totalCubes; i++) {
      const i4 = i * 4;
      sizeArray[i4 + 0] = 1;
      sizeArray[i4 + 1] = 1;
      sizeArray[i4 + 2] = 1;
      sizeArray[i4 + 3] = 1;
    }

    const sizeVariable = computation.addVariable(
      "sizeTexture",
      gpgpuShader,
      gpgpuTexture,
    );
    if (clockTextureRef) {
      sizeVariable.material.defines.USE_CLOCK_TEXTURE = true;
    }

    computation.setVariableDependencies(sizeVariable, [sizeVariable]);

    gpgpuTextureRef.current = gpgpuTexture;

    sizeVariable.material.uniforms.uTime = { value: 0.0 };
    sizeVariable.material.uniforms.uDelta = { value: 0.0 };
    sizeVariable.material.uniforms.uCubeCounts = {
      value: new THREE.Vector3(...cubeCounts),
    };
    sizeVariable.material.uniforms.uSizeSpeed = { value: sizeSpeed };
    sizeVariable.material.uniforms.uNoiseOffsets = {
      value: new THREE.Vector3(...noiseOffsets),
    };
    if (clockTextureRef) {
      sizeVariable.material.uniforms.uClockTexture = {
        value: clockTextureRef.current,
      };
    }

    return {
      computation,
      sizeVariable,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useLayoutEffect(() => {
    const error = gpgpu.computation.init();
    if (error !== null) {
      console.error(error);
    }
  });

  const uTimeRef = useRef(0);
  useFrame((_, delta) => {
    const uDelta = Math.min(delta, 0.1);
    uTimeRef.current += uDelta * timeFactor;

    gpgpu.sizeVariable.material.uniforms.uTime.value = uTimeRef.current;
    gpgpu.sizeVariable.material.uniforms.uDelta.value = uDelta;
    if (clockTextureRef) {
      gpgpu.sizeVariable.material.uniforms.uClockTexture.value =
        clockTextureRef.current;
    }

    gpgpu.computation.compute();

    gpgpuTextureRef.current = gpgpu.computation.getCurrentRenderTarget(
      gpgpu.sizeVariable,
    ).texture;
  });

  return {
    gpgpuTexture: gpgpuTextureRef,
  };
}
