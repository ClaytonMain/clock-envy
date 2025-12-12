/**
 * Props to wtshm for the original useGPGPU hook that this is based on.
 * https://codesandbox.io/p/sandbox/admiring-christian-nnxq97
 */

import { useFrame, useThree } from "@react-three/fiber";
import { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { GPUComputationRenderer } from "three/examples/jsm/misc/GPUComputationRenderer.js";
import gpgpuActualSizeShader from "./shaders/gpgpu/gpgpuActualSize.glsl";

export default function useGPGPU({
  cubeCounts,
  threshold = 0.5,
  sizeSpeed = 0.1,
  timeFactor = 0.1,
  noiseOffsets = [0, 10, 20],
}: {
  cubeCounts: [number, number, number];
  threshold?: number;
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

  // const gpgpuTargetTextureRef = useRef<THREE.Texture>(null!);
  const gpgpuActualTextureRef = useRef<THREE.Texture>(null!);

  const gpgpu = useMemo(() => {
    const computation = new GPUComputationRenderer(
      textureSize,
      textureSize,
      gl,
    );

    // const gpgpuTargetSizeTexture = computation.createTexture();
    const gpgpuActualSizeTexture = computation.createTexture();

    // const targetSizeArray = gpgpuTargetSizeTexture.image.data as Float32Array;
    const actualSizeArray = gpgpuActualSizeTexture.image.data as Float32Array;

    for (let i = 0; i < totalCubes; i++) {
      const i4 = i * 4;
      // targetSizeArray[i4 + 0] = 1;
      // targetSizeArray[i4 + 1] = 1;
      // targetSizeArray[i4 + 2] = 1;
      // targetSizeArray[i4 + 3] = 1;

      actualSizeArray[i4 + 0] = 1;
      actualSizeArray[i4 + 1] = 1;
      actualSizeArray[i4 + 2] = 1;
      actualSizeArray[i4 + 3] = 1;
    }

    // const targetSizeVariable = computation.addVariable(
    //   "targetSizeTexture",
    //   gpgpuTargetSizeShader,
    //   gpgpuTargetSizeTexture,
    // );
    const actualSizeVariable = computation.addVariable(
      "actualSizeTexture",
      gpgpuActualSizeShader,
      gpgpuActualSizeTexture,
    );

    // computation.setVariableDependencies(targetSizeVariable, [
    //   targetSizeVariable,
    // ]);
    computation.setVariableDependencies(actualSizeVariable, [
      // targetSizeVariable,
      actualSizeVariable,
    ]);

    // gpgpuTargetTextureRef.current = gpgpuTargetSizeTexture;
    gpgpuActualTextureRef.current = gpgpuActualSizeTexture;

    // targetSizeVariable.material.uniforms.uTime = { value: 0.0 };
    // targetSizeVariable.material.uniforms.uCubeCounts = {
    //   value: new THREE.Vector3(...cubeCounts),
    // };
    // targetSizeVariable.material.uniforms.uThreshold = { value: threshold };

    actualSizeVariable.material.uniforms.uTime = { value: 0.0 };
    actualSizeVariable.material.uniforms.uDelta = { value: 0.0 };
    actualSizeVariable.material.uniforms.uCubeCounts = {
      value: new THREE.Vector3(...cubeCounts),
    };
    actualSizeVariable.material.uniforms.uThreshold = { value: threshold };
    actualSizeVariable.material.uniforms.uSizeSpeed = { value: sizeSpeed };
    actualSizeVariable.material.uniforms.uNoiseOffsets = {
      value: new THREE.Vector3(...noiseOffsets),
    };

    return {
      computation,
      // targetSizeVariable,
      actualSizeVariable,
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

    // gpgpu.targetSizeVariable.material.uniforms.uTime.value = uTimeRef.current;

    gpgpu.actualSizeVariable.material.uniforms.uTime.value = uTimeRef.current;
    gpgpu.actualSizeVariable.material.uniforms.uDelta.value = uDelta;

    gpgpu.computation.compute();

    // gpgpuTargetTextureRef.current = gpgpu.computation.getCurrentRenderTarget(
    //   gpgpu.targetSizeVariable,
    // ).texture;
    gpgpuActualTextureRef.current = gpgpu.computation.getCurrentRenderTarget(
      gpgpu.actualSizeVariable,
    ).texture;
  });

  return {
    // gpgpuTargetTexture: gpgpuTargetTextureRef,
    gpgpuActualTexture: gpgpuActualTextureRef,
  };
}
