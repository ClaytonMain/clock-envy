import { useFrame, useThree } from "@react-three/fiber";
import { useControls } from "leva";
import { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { GPUComputationRenderer } from "three/addons/misc/GPUComputationRenderer.js";
import {
  GPGPU_TEXTURE_SIZE,
  RENDER_EPICYCLES,
  TICK_RATE,
  TOTAL_EPICYCLES,
} from "./constants/constants";
import gpgpuShader from "./shaders/gpgpu/gpgpu.glsl";
import type { EpicycleData } from "./types/types";
import {
  getEpicycleData,
  getFourier,
  getHourMinuteSecondPoints,
} from "./utils/utils";

// Props to The Coding Train for the Fourier code example.
// https://www.youtube.com/watch?v=7_vKzcgpfvU

type GpgpuUniforms = {
  uDelta: { value: number };
  uNumEpicycles: { value: number };
  uEpicycleData: { value: THREE.Vector3[] }; // x: center.x, y: center.y, z: scale
  uDrawPoint: { value: THREE.Vector2 };
  uPrevDrawPoint: { value: THREE.Vector2 };
  uFadeSpeed: { value: number };
};
const gpgpuUniforms: GpgpuUniforms = {
  uDelta: { value: 0 },
  uNumEpicycles: { value: RENDER_EPICYCLES },
  uEpicycleData: {
    value: Array.from({ length: TOTAL_EPICYCLES }).map(
      () => new THREE.Vector3(),
    ),
  },
  uDrawPoint: { value: new THREE.Vector2() },
  uPrevDrawPoint: { value: new THREE.Vector2() },
  uFadeSpeed: { value: 1.0 },
};

function getEpicycleDataForTime(time: number): {
  epicycleData: EpicycleData[];
  position: THREE.Vector2;
} {
  const points = getHourMinuteSecondPoints({ totalPoints: TOTAL_EPICYCLES });
  const fourier = getFourier(points);
  const { epicycleData, position } = getEpicycleData(
    fourier,
    time,
    TOTAL_EPICYCLES,
  );
  return { epicycleData, position };
}

export default function useGPGPU() {
  const gl = useThree((state) => state.gl);

  const uniforms = useControls({
    uNumEpicycles: {
      value: gpgpuUniforms.uNumEpicycles.value,
      min: 1,
      max: TOTAL_EPICYCLES,
      step: 1,
    },
    uFadeSpeed: {
      value: gpgpuUniforms.uFadeSpeed.value,
      min: 0.1,
      max: 1,
      step: 0.01,
    },
  });

  const gpgpuTextureRef = useRef<THREE.Texture>(null!);

  const gpgpu = useMemo(() => {
    const computation = new GPUComputationRenderer(
      GPGPU_TEXTURE_SIZE,
      GPGPU_TEXTURE_SIZE,
      gl,
    );

    const gpgpuTexture = computation.createTexture();

    const gpgpuArray = gpgpuTexture.image.data as Float32Array;

    const { epicycleData, position } = getEpicycleDataForTime(0);

    for (let i = 0; i < GPGPU_TEXTURE_SIZE * GPGPU_TEXTURE_SIZE; i++) {
      const i4 = i * 4;

      gpgpuArray[i4 + 0] = 0; // Distance to nearest circle
      gpgpuArray[i4 + 1] = 0; // Distance to nearest line segment
      gpgpuArray[i4 + 2] = 0; // Distance to draw point
      gpgpuArray[i4 + 3] = 0; // Draw strength history
    }

    const gpgpuTextureVariable = computation.addVariable(
      "vGpgpuTexture",
      gpgpuShader,
      gpgpuTexture,
    );

    computation.setVariableDependencies(gpgpuTextureVariable, [
      gpgpuTextureVariable,
    ]);

    gpgpuTextureRef.current = gpgpuTexture;

    gpgpuTextureVariable.material.uniforms.uDelta = { value: 0 };
    gpgpuTextureVariable.material.uniforms.uNumEpicycles = {
      value: gpgpuUniforms.uNumEpicycles.value,
    };
    gpgpuTextureVariable.material.uniforms.uEpicycleData = {
      value: epicycleData.map(
        (data) => new THREE.Vector3(data.center.x, data.center.y, data.scale),
      ),
    };
    gpgpuTextureVariable.material.uniforms.uDrawPoint = { value: position };
    gpgpuTextureVariable.material.uniforms.uPrevDrawPoint = { value: position };
    gpgpuTextureVariable.material.uniforms.uFadeSpeed = {
      value: gpgpuUniforms.uFadeSpeed.value,
    };

    return {
      computation,
      gpgpuTextureVariable,
    };
  }, [gl]);

  useLayoutEffect(() => {
    if (!gpgpu) return;
    const error = gpgpu.computation.init();
    if (error !== error) {
      console.error("GPUComputationRenderer initialization error:", error);
    }
  }, [gpgpu]);

  const frameDurationRef = useRef(1);
  const timeRef = useRef(0);
  useFrame((_, delta) => {
    if (!gpgpu) return;
    // const uDelta = Math.min(delta, 0.1);
    const uDelta = delta;

    gpgpu.gpgpuTextureVariable.material.uniforms.uDelta.value = uDelta;
    gpgpu.gpgpuTextureVariable.material.uniforms.uNumEpicycles.value =
      uniforms.uNumEpicycles;
    gpgpu.gpgpuTextureVariable.material.uniforms.uFadeSpeed.value =
      uniforms.uFadeSpeed;

    frameDurationRef.current += uDelta;
    if (frameDurationRef.current < 1 / TICK_RATE) {
      // Still advancing frames when not advancing Fourier time.
      gpgpu.computation.compute();
      gpgpuTextureRef.current = gpgpu.computation.getCurrentRenderTarget(
        gpgpu.gpgpuTextureVariable,
      ).texture;
      return;
    }
    frameDurationRef.current = 0;

    timeRef.current += (2 * Math.PI) / TOTAL_EPICYCLES;
    if (timeRef.current > 2 * Math.PI) {
      timeRef.current = 0;
    }

    const { epicycleData, position } = getEpicycleDataForTime(timeRef.current);

    gpgpu.gpgpuTextureVariable.material.uniforms.uEpicycleData.value =
      epicycleData.map(
        (data) => new THREE.Vector3(data.center.x, data.center.y, data.scale),
      );
    gpgpu.gpgpuTextureVariable.material.uniforms.uDrawPoint.value = position;
    if (uDelta > 0.25) {
      gpgpu.gpgpuTextureVariable.material.uniforms.uPrevDrawPoint.value =
        position;
    }

    gpgpu.computation.compute();

    gpgpuTextureRef.current = gpgpu.computation.getCurrentRenderTarget(
      gpgpu.gpgpuTextureVariable,
    ).texture;

    gpgpu.gpgpuTextureVariable.material.uniforms.uPrevDrawPoint.value =
      position;
  });

  return {
    gpgpuTexture: gpgpuTextureRef,
  };
}
