import { Environment, OrbitControls, Stats } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { Suspense, useMemo } from "react";
import * as THREE from "three";
import useAppStore from "../../../stores/useAppStore";
import Hand from "./Hand";
import Orb from "./Orb";

function ArchdukeVonOrben() {
  const formatHours24 = useAppStore((state) => state.formatHours24);
  return (
    <>
      <Orb position={[0, 0, -2.3]} />
      <Hand
        hms="s"
        radius={1.3}
        color="#2cff05"
        formatHours24={formatHours24}
      />
      <Hand
        hms="m"
        radius={1.0}
        color="#EB5160"
        formatHours24={formatHours24}
      />
      <Hand
        hms="h"
        radius={0.7}
        color="#84E6F8"
        formatHours24={formatHours24}
      />
    </>
  );
}

export default function ArchdukeVonOrbenScene() {
  const cameraLayers = useMemo(() => {
    const layers = new THREE.Layers();
    layers.set(1);
    return layers;
  }, []);
  const allLayers = useMemo(() => {
    const layers = new THREE.Layers();
    layers.enableAll();
    return layers;
  }, []);

  return (
    <Canvas
      shadows
      dpr={1}
      camera={{
        position: [0, -2, 25],
        rotation: [0.05, 0, 0],
        fov: 8,
        layers: cameraLayers,
      }}
    >
      {/* <fog attach="fog" args={["#17171b", 30, 40]} /> */}
      <Stats />
      <Suspense fallback={null}>
        <Environment preset="city" resolution={2048} />
        <ambientLight intensity={0.5} layers={allLayers} />
        <directionalLight
          position={[0.25, 4, 4.25]}
          intensity={1.0}
          color={"#fff"}
          layers={allLayers}
          castShadow
          shadow-camera-far={15}
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
          shadow-camera-left={-10}
          shadow-camera-right={10}
          shadow-camera-top={10}
          shadow-camera-bottom={-10}
          shadow-normalBias={0.05}
        />
        <OrbitControls makeDefault />
        <ArchdukeVonOrben />
      </Suspense>
    </Canvas>
  );
}
