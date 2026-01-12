import { Loader, OrbitControls } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import { Suspense, useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import useAppStore from "../../../stores/useAppStore";
import CustomStatsComponent from "../../misc/CustomStatsComponent";
import { FOV } from "./constants/constants";
import voxelsFragmentShader from "./shaders/voxels/voxels.frag";
import voxelsVertexShader from "./shaders/voxels/voxels.vert";

const DIGIT_CENTER_OFFSETS = [
  (-5.0 * 5.0) / 64.0,
  (-3.0 * 5.0) / 64.0,
  (-1.0 * 5.0) / 64.0,
  (1.0 * 5.0) / 64.0,
  (3.0 * 5.0) / 64.0,
  (5.0 * 5.0) / 64.0,
];
const SEGMENT_OFFSETS = [
  new THREE.Vector2(0.0, 6.0 / 64.0),
  new THREE.Vector2(3.0 / 64.0, 3.0 / 64.0),
  new THREE.Vector2(3.0 / 64.0, -3.0 / 64.0),
  new THREE.Vector2(0.0, -6.0 / 64.0),
  new THREE.Vector2(-3.0 / 64.0, -3.0 / 64.0),
  new THREE.Vector2(-3.0 / 64.0, 3.0 / 64.0),
  new THREE.Vector2(0.0, 0.0),
];

function getActiveSegments(): number[] {
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

function DigitAttractor({ digitIndex }: { digitIndex: number }) {}

function VoxelAttractor() {
  const uniforms = useMemo(() => {
    return {
      uDelta: { value: 0 },
      uTime: { value: 0 },
      uCameraPosition: { value: new THREE.Vector3() },
      uResolution: { value: new THREE.Vector2() },
      uGlZ: { value: -1 / (2 * Math.tan(FOV * (Math.PI / 180) * 0.5)) },
      uActiveSegments: { value: getActiveSegments() },
    };
  }, []);

  const cameraPosition = new THREE.Vector3();
  const uDeltaRef = useRef(0);
  const uTimeRef = useRef(0);

  useFrame(({ camera }, delta) => {
    uDeltaRef.current = Math.min(delta, 0.1);
    uTimeRef.current += uDeltaRef.current;

    camera.getWorldPosition(cameraPosition);

    uniforms.uDelta.value = uDeltaRef.current;
    uniforms.uTime.value = uTimeRef.current;
    uniforms.uCameraPosition.value.copy(cameraPosition);
    uniforms.uResolution.value.set(window.innerWidth, window.innerHeight);
  });

  useEffect(() => {
    const unsubCurrentTimeValue = useAppStore.subscribe(
      (state) => state.currentTimeValue,
      (value, previousValue) => {
        const timeString = value.toFormat("HHmmss");
        const prevTimeString = previousValue.toFormat("HHmmss");

        if (timeString === prevTimeString) return;

        uniforms.uActiveSegments.value = getActiveSegments();
      },
    );
    return () => {
      unsubCurrentTimeValue();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <group>
      <mesh visible={false}>
        <planeGeometry />
        <shaderMaterial
          vertexShader={voxelsVertexShader}
          fragmentShader={voxelsFragmentShader}
          uniforms={uniforms}
        />
      </mesh>
    </group>
  );
}

export default function VoxelAttractorScene() {
  const canvasRef = useRef<HTMLCanvasElement>(null!);

  useEffect(() => {
    document.title = "Clock Envy - Voxel Attractor";

    const unsubInteractionState = useAppStore.subscribe(
      (state) => state.interactionState,
      (interactionState) => {
        if (canvasRef.current) {
          canvasRef.current.style.cursor =
            interactionState === "active" ? "default" : "none";
        }
      },
    );
    return () => {
      unsubInteractionState();
    };
  }, []);

  return (
    <>
      <Canvas
        ref={canvasRef}
        shadows
        dpr={1}
        camera={{
          position: [0, 5, 10],
          // position: [0, 0, 10],
          fov: FOV,
        }}
        style={{
          touchAction: "none",
        }}
      >
        <CustomStatsComponent />
        <Suspense fallback={null}>
          {/* <Environment preset="lobby" resolution={2048} /> */}
          <VoxelAttractor />
          {/* <IDontReallyUnderstandVoxels /> */}
        </Suspense>
        <OrbitControls makeDefault />
      </Canvas>
      <Loader />
    </>
  );
}
