import { Environment, OrbitControls } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { Suspense } from "react";
import useAppStore from "../../../stores/useAppStore";
import CustomStatsComponent from "../../misc/CustomStatsComponent";
import Tube from "./Tube";

function Nixie() {
  return (
    <>
      <Tube displayIndex={0} position={[-1.4, 0, 0]} />
      <Tube displayIndex={1} position={[-0.9, 0, 0]} />
      <Tube displayIndex={3} position={[-0.25, 0, 0]} />
      <Tube displayIndex={4} position={[0.25, 0, 0]} />
      <Tube displayIndex={6} position={[0.9, 0, 0]} />
      <Tube displayIndex={7} position={[1.4, 0, 0]} />
    </>
  );
}

export default function NixieScene() {
  const interactionState = useAppStore((state) => state.interactionState);

  return (
    <>
      <Canvas
        shadows
        dpr={Math.min(window.devicePixelRatio, 2)}
        camera={{
          position: [0, -2, 35],
          rotation: [0.05, 0, 0],
          fov: 8,
        }}
        style={{
          touchAction: "none",
          cursor: interactionState === "active" ? "default" : "none",
        }}
      >
        <CustomStatsComponent />
        <Suspense fallback={null}>
          {/* <Environment preset="city" resolution={2048} /> */}
          <Environment
            files="./environments/golden_bay_4k.exr"
            resolution={2048}
          />
          <ambientLight intensity={0.5} />
          <Nixie />
          <OrbitControls makeDefault />
        </Suspense>
      </Canvas>
    </>
  );
}
