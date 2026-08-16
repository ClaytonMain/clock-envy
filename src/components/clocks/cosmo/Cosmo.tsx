import { Loader, OrbitControls } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { Suspense, useEffect, useRef } from "react";
import * as THREE from "three";
import useAppStore from "../../../stores/useAppStore";
import CustomStatsComponent from "../../misc/CustomStatsComponent";
import BlackHoleComponent from "./BlackHoleComponent";
import { FOV } from "./constants/constants";

export default function CosmoScene() {
  const canvasRef = useRef<HTMLCanvasElement>(null!);

  useEffect(() => {
    document.title = "Clock Envy - Cosmo";
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
        dpr={1}
        camera={{
          position: [0.01, 0.5, 8],
          // position: [0, 0, 10],
          fov: FOV,
        }}
        style={{
          touchAction: "none",
        }}
        gl={{
          toneMapping: THREE.LinearToneMapping,
          outputColorSpace: THREE.LinearSRGBColorSpace,
        }}
        linear
        flat
      >
        <CustomStatsComponent />
        <Suspense fallback={null}>
          {/* <Environment preset="lobby" resolution={2048} /> */}
          <BlackHoleComponent />
        </Suspense>
        <OrbitControls makeDefault autoRotate autoRotateSpeed={-0.15} />
      </Canvas>
      <Loader />
    </>
  );
}
