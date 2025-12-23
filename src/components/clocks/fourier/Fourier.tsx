import { Loader, Plane } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import { Suspense, useEffect, useRef } from "react";
import * as THREE from "three";
import useAppStore from "../../../stores/useAppStore";
import CustomStatsComponent from "../../misc/CustomStatsComponent";
import useGPGPU from "./useGPGPU";

// const uniforms = {
//   uBackgroundColor: { value: new THREE.Color("#000000") },
//   uEpicycleColor: { value: new THREE.Color("#ffffff") },
//   uRadiusColor: { value: new THREE.Color("#888888") },
//   uTrailColor: { value: new THREE.Color("#ff0000") },
// };

function Fourier() {
  const fourierDataDisplayPlaneRef = useRef<THREE.Mesh>(null!);
  const { gpgpuTexture } = useGPGPU();

  // const controlValues = useControls({
  //   uBackgroundColor: {
  //     value: `#${uniforms.uBackgroundColor.value.getHexString()}`,
  //     onEdit: (value: string) => {
  //       uniforms.uBackgroundColor.value.set(new THREE.Color(value));
  //     },
  //   },
  //   uEpicycleColor: {
  //     value: `#${uniforms.uEpicycleColor.value.getHexString()}`,
  //     onEdit: (value: string) => {
  //       uniforms.uEpicycleColor.value.set(new THREE.Color(value));
  //     },
  //   },
  //   uRadiusColor: {
  //     value: `#${uniforms.uRadiusColor.value.getHexString()}`,
  //     onEdit: (value: string) => {
  //       uniforms.uRadiusColor.value.set(new THREE.Color(value));
  //     },
  //   },
  //   uTrailColor: {
  //     value: `#${uniforms.uTrailColor.value.getHexString()}`,
  //     onEdit: (value: string) => {
  //       uniforms.uTrailColor.value.set(new THREE.Color(value));
  //     },
  //   },
  // });

  useFrame(() => {
    if (fourierDataDisplayPlaneRef.current && gpgpuTexture.current) {
      // @ts-expect-error 'map' does exist.
      fourierDataDisplayPlaneRef.current.material.map = gpgpuTexture.current;
      // @ts-expect-error 'needsUpdate' does exist.
      fourierDataDisplayPlaneRef.current.material.needsUpdate = true;
    }
  });

  return (
    <group scale={1}>
      <Plane
        ref={fourierDataDisplayPlaneRef}
        args={[2, 2]}
        position={[0, 0, -0.01]}
      />
    </group>
  );
}

export default function FourierScene() {
  const canvasRef = useRef<HTMLCanvasElement>(null!);

  useEffect(() => {
    const unsubInteractionState = useAppStore.subscribe(
      (state) => state.interactionState,
      (value) => {
        if (value === "active") {
          document.body.style.cursor = "default";
        } else {
          document.body.style.cursor = "none";
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
        dpr={Math.min(window.devicePixelRatio, 1)}
        camera={{
          position: [0, 0, 19],
          fov: 8,
        }}
        style={{
          touchAction: "none",
        }}
      >
        <CustomStatsComponent />
        <Suspense fallback={null}>
          {/* <Environment preset="city" resolution={2048} /> */}
          {/* <Environment
            files="./environments/photo_studio_loft_hall_4k.exr"
            resolution={2048}
          /> */}
          <ambientLight intensity={0.1} />
          {/* <OrbitControls makeDefault /> */}
          <Fourier />
        </Suspense>
      </Canvas>
      <Loader />
    </>
  );
}
