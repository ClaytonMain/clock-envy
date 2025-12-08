/**
 * Props to wtshm for the original useGPGPU hook that this is based on.
 * https://codesandbox.io/p/sandbox/admiring-christian-nnxq97
 */

import { useFrame, useThree } from "@react-three/fiber";
import { useLayoutEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { GPUComputationRenderer } from "three/examples/jsm/misc/GPUComputationRenderer.js";
import {
  CUBES_PER_SIDE,
  CUBE_SIZE,
  TEXTURE_SIZE,
  TOTAL_CUBES,
} from "./constants";
import gpgpuShader from "./shaders/gpgpu/gpgpu.glsl";

export default function useGPGPU() {
  const gl = useThree((state) => state.gl);

  const gpgpuTextureRef = useRef<THREE.Texture>(null!);

  const gpgpu = useMemo(() => {
    const computation = new GPUComputationRenderer(
      TEXTURE_SIZE,
      TEXTURE_SIZE,
      gl,
    );

    const gpgpuTexture = computation.createTexture();

    const sizeArray = gpgpuTexture.image.data as Float32Array;

    for (let i = 0; i < TOTAL_CUBES; i++) {
      const i4 = i * 4;
      sizeArray[i4 + 0] = CUBE_SIZE;
      sizeArray[i4 + 1] = CUBE_SIZE;
      sizeArray[i4 + 2] = CUBE_SIZE;
      sizeArray[i4 + 3] = 1.0;
    }

    const textureDefaultSize = gpgpuTexture.clone();

    const sizeVariable = computation.addVariable(
      "gpgpuTexture",
      gpgpuShader,
      gpgpuTexture,
    );

    computation.setVariableDependencies(sizeVariable, [sizeVariable]);

    gpgpuTextureRef.current = gpgpuTexture;

    sizeVariable.material.uniforms.uTime = { value: 0.0 };
    sizeVariable.material.uniforms.uDelta = { value: 0.0 };
    sizeVariable.material.uniforms.uMouse3d = {
      value: new THREE.Vector3(),
    };
    sizeVariable.material.uniforms.uTextureDefaultSize = {
      value: textureDefaultSize,
    };
    sizeVariable.material.uniforms.cubesPerSide = { value: CUBES_PER_SIDE };

    return {
      computation,
      sizeVariable,
    };
  }, [gl]);

  useLayoutEffect(() => {
    const error = gpgpu.computation.init();
    if (error !== null) {
      console.error(error);
    }
  });

  const [ray] = useState(() => new THREE.Ray());

  useFrame(({ camera, clock, pointer }, delta) => {
    const deltaRatio = 60 * delta;

    ray.origin.copy(camera.position);
    ray.direction
      .set(pointer.x, pointer.y, 0.5)
      .unproject(camera)
      .sub(ray.origin)
      .normalize();
    const mousePosition = new THREE.Vector3();
    mousePosition.copy(ray.direction);
    mousePosition.multiplyScalar(
      ray.origin.length() /
        Math.cos(Math.PI - ray.direction.angleTo(ray.origin)),
    );
    mousePosition.add(ray.origin);

    gpgpu.sizeVariable.material.uniforms.uTime.value = clock.elapsedTime;
    gpgpu.sizeVariable.material.uniforms.uDelta.value = deltaRatio;
    gpgpu.sizeVariable.material.uniforms.uMouse3d.value.copy(mousePosition);
    gpgpu.computation.compute();

    gpgpuTextureRef.current = gpgpu.computation.getCurrentRenderTarget(
      gpgpu.sizeVariable,
    ).texture;
  });

  return {
    gpgpuTexture: gpgpuTextureRef,
  };
}
