import {
  Box,
  Cloud,
  Environment,
  Loader,
  MeshReflectorMaterial,
  Plane,
} from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { useControls } from "leva";
import { Suspense, useEffect, useState } from "react";
import * as THREE from "three";
import useAppStore from "../../../stores/useAppStore";
import CustomStatsComponent from "../../misc/CustomStatsComponent";

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

const segmentPositions: Record<number, THREE.Vector3> = {
  0: new THREE.Vector3(0, 0.1, 0),
  1: new THREE.Vector3(0.05, 0.05, 0),
  2: new THREE.Vector3(0.05, -0.05, 0),
  3: new THREE.Vector3(0, -0.1, 0),
  4: new THREE.Vector3(-0.05, -0.05, 0),
  5: new THREE.Vector3(-0.05, 0.05, 0),
  6: new THREE.Vector3(0, 0, 0),
};

const horizontalRotation: THREE.Euler = new THREE.Euler(0, 0, Math.PI / 2);
const verticalRotation: THREE.Euler = new THREE.Euler(0, 0, 0);
const segmentRotations: Record<number, THREE.Euler> = {
  0: horizontalRotation,
  1: verticalRotation,
  2: verticalRotation,
  3: horizontalRotation,
  4: verticalRotation,
  5: verticalRotation,
  6: horizontalRotation,
};

function Segment({
  segmentKey,
  active,
}: {
  segmentKey: number;
  active: boolean;
}) {
  return (
    <mesh
      position={segmentPositions[segmentKey].clone().multiplyScalar(2)}
      rotation={segmentRotations[segmentKey]}
    >
      <capsuleGeometry args={[0.01, 0.16, 4, 8]} />
      <meshPhysicalMaterial
        reflectivity={1}
        color={active ? "#ff4500" : "#330000"}
        emissive={active ? "#ff4500" : "#000000"}
        emissiveIntensity={active ? 0.8 : 0}
      />
    </mesh>
  );
}

function ClockDigit({
  digitIndex,
  segments,
}: {
  digitIndex: number;
  segments: number[];
}) {
  return (
    <group position={[(digitIndex - 2.5) * 0.3, 0, 0]}>
      {segments.slice(digitIndex * 7, digitIndex * 7 + 7).map((active, i) => (
        <Segment key={i} segmentKey={i} active={Boolean(active)} />
      ))}
    </group>
  );
}

function Clock() {
  const [segments, setSegments] = useState<number[]>(getActiveSegments());

  useEffect(() => {
    const unsubCurrentTimeValue = useAppStore.subscribe(
      (state) => state.currentTimeValue,
      (value, previousValue) => {
        const timeString = value.toFormat("HHmmss");
        const prevTimeString = previousValue.toFormat("HHmmss");

        if (timeString === prevTimeString) return;

        setSegments(getActiveSegments());
      },
    );
    return () => {
      unsubCurrentTimeValue();
    };
  }, []);

  return (
    <>
      {Array.from({ length: 6 }).map((_, i) => (
        <ClockDigit key={i} digitIndex={i} segments={segments} />
      ))}
    </>
  );
}

function PoolRoom() {
  const meshReflectorMaterialProps = useControls("ReflectorMaterial", {
    color: "#655757",
    metalness: {
      value: 0.1,
      min: 0,
      max: 1,
      step: 0.01,
    },
    roughness: {
      value: 0.75,
      min: 0,
      max: 1,
      step: 0.01,
    },
    blur: {
      value: [400, 400],
      min: 0,
      max: 1000,
      step: 1,
    },
    mixBlur: {
      value: 6.87,
      min: 0,
      max: 10,
      step: 0.01,
    },
    mixStrength: {
      value: 80,
      min: 0,
      max: 200,
      step: 1,
    },
    depthScale: {
      value: 2.35,
      min: 0,
      max: 10,
      step: 0.01,
    },
    minDepthThreshold: {
      value: 0.23,
      min: 0,
      max: 1,
      step: 0.01,
    },
    maxDepthThreshold: {
      value: 0.76,
      min: 0,
      max: 1,
      step: 0.01,
    },
  });
  return (
    <>
      <Plane
        args={[50, 100]}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -0.25, 0]}
      >
        <MeshReflectorMaterial
          resolution={2048}
          {...meshReflectorMaterialProps}
        />
      </Plane>
      <Clock />
    </>
  );
}

export default function PoolRoomScene() {
  return (
    <>
      <Canvas
        shadows
        dpr={Math.min(window.devicePixelRatio, 2)}
        camera={{
          position: [0, 0, 10],
          fov: 8,
        }}
        style={{
          touchAction: "none",
          backgroundColor: "#000000",
        }}
      >
        <CustomStatsComponent />
        <Suspense fallback={null}>
          <Environment preset="night" resolution={2048} />
          <ambientLight intensity={0.1} />
          <fog attach="fog" args={["#000", 11, 45]} />
          <PoolRoom />
        </Suspense>
      </Canvas>
      <Loader />
    </>
  );
}
