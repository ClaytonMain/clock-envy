import {
  Environment,
  Icosahedron,
  MeshReflectorMaterial,
  OrbitControls,
  Stats,
} from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { useControls } from "leva";
import { Suspense } from "react";
import useAppStore from "../../../stores/useAppStore";
import Hand from "./Hand";

function ArchdukeVonOrben() {
  const formatHours24 = useAppStore((state) => state.formatHours24);
  const materialProps = useControls({
    roughness: { value: 0.1, min: 0, max: 1, step: 0.01 },
    metalness: { value: 0.0, min: 0, max: 1, step: 0.01 },
    ior: { value: 1.5, min: 1, max: 2.5, step: 0.01 },
    reflectivity: { value: 0.5, min: 0, max: 1, step: 0.01 },
    iridescence: { value: 0.0, min: 0, max: 1, step: 0.01 },
    iridescenceIOR: { value: 1.3, min: 1, max: 2.5, step: 0.01 },
    sheen: { value: 0.0, min: 0, max: 1, step: 0.01 },
    sheenRoughness: { value: 1.0, min: 0, max: 1, step: 0.01 },
    sheenColor: { value: "#000" },
    clearcoat: { value: 0.9, min: 0, max: 1, step: 0.01 },
    clearcoatRoughness: { value: 0.0, min: 0, max: 1, step: 0.01 },
    specularIntensity: { value: 1.0, min: 0, max: 1, step: 0.01 },
    specularColor: { value: "#fff" },
  });
  return (
    <>
      <Icosahedron args={[2, 2]} position={[0, 0.0, -2.3]} receiveShadow>
        <MeshReflectorMaterial
          blur={[800, 800]}
          resolution={2048}
          mixBlur={1}
          mixStrength={80}
          depthScale={1.2}
          minDepthThreshold={0}
          maxDepthThreshold={1.4}
          roughness={1}
          metalness={0.5}
          color="#050505"
          flatShading
        />
      </Icosahedron>
      <Hand
        hms="s"
        radius={1.3}
        color="#2cff05"
        formatHours24={formatHours24}
        materialProps={materialProps}
      />
      <Hand
        hms="m"
        radius={1.0}
        color="#EB5160"
        formatHours24={formatHours24}
        materialProps={materialProps}
      />
      <Hand
        hms="h"
        radius={0.7}
        color="#84E6F8"
        formatHours24={formatHours24}
        materialProps={materialProps}
      />
    </>
  );
}

export default function ArchdukeVonOrbenScene() {
  return (
    <Canvas
      flat
      shadows
      dpr={1}
      camera={{ position: [0, -2, 25], rotation: [0.05, 0, 0], fov: 8 }}
    >
      {/* <fog attach="fog" args={["#17171b", 30, 40]} /> */}
      <Stats />
      <Suspense fallback={null}>
        <Environment preset="city" />
        <ambientLight intensity={1.5} />
        <OrbitControls makeDefault />
        <ArchdukeVonOrben />
      </Suspense>
    </Canvas>
  );
}
