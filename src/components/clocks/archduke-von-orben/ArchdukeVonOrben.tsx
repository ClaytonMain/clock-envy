import { Environment, Loader } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { Suspense, useMemo } from "react";
import * as THREE from "three";
import useAppStore from "../../../stores/useAppStore";
import BasicBoundsBoxBaybee from "../../misc/BasicBoundsBoxBaybee";
import CustomStatsComponent from "../../misc/CustomStatsComponent";
import DebugOrbitControls from "../../misc/DebugOrbitControls";
import Digits from "./Digits";
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
        color={"#deeadd"}
        formatHours24={formatHours24}
      />
      <Hand
        hms="m"
        radius={1.0}
        color={"#deeadd"}
        formatHours24={formatHours24}
      />
      <Hand
        hms="h"
        radius={0.7}
        color={"#deeadd"}
        formatHours24={formatHours24}
      />
      <Digits position={[0, 0.09, 1]} />
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
    <>
      <Canvas
        shadows
        dpr={Math.min(window.devicePixelRatio, 2)}
        camera={{
          position: [0, -2, 35],
          rotation: [0.05, 0, 0],
          fov: 8,
          layers: cameraLayers,
        }}
        style={{
          touchAction: "none",
        }}
      >
        <CustomStatsComponent />
        <Suspense fallback={null}>
          <Environment
            files="./environments/warm_reception_dinner_4k.exr"
            resolution={1024}
          />
          <ambientLight intensity={0.5} layers={allLayers} />
          <ArchdukeVonOrben />
        </Suspense>
        <BasicBoundsBoxBaybee boxArgs={[3.0, 3.0, 1.25]} />
        <DebugOrbitControls minDistance={10} maxDistance={50} />
      </Canvas>
      <Loader />
    </>
  );
}
