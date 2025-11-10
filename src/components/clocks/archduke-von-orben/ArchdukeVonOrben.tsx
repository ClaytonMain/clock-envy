import {
  CubeCamera,
  Environment,
  Icosahedron,
  MeshReflectorMaterial,
  OrbitControls,
  Stats,
} from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { useControls } from "leva";
import { Suspense, useRef } from "react";
import * as THREE from "three";
import { MeshPhysicalMaterial } from "three";
import { Reflector } from "three/examples/jsm/objects/Reflector.js";
import useAppStore from "../../../stores/useAppStore";
import Hand from "./Hand";
import Orb from "./Orb";

function ArchdukeVonOrben() {
  const orbRef = useRef(null!);
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
  const orbGeometry = new THREE.IcosahedronGeometry(2, 2);
  const mirror = new Reflector(orbGeometry, {
    textureWidth: 1024,
    textureHeight: 1024,
  });
  return (
    <>
      {/* <primitive
        ref={orbRef}
        onClick={() => console.log(orbRef.current, mirror)}
        object={mirror}
        position={[0, 0, -2.3]}
        rotation={[0, 0, 0]}
      /> */}
      {/* <Suspense fallback={null}>
        <Icosahedron
          ref={orbRef}
          args={[2, 2]}
          position={[0, 0.0, -2.3]}
          receiveShadow
          onClick={() => console.log(orbRef.current.material)}
        >
          <MeshReflectorMaterial
            blur={[800, 800]}
            // onBeforeCompile={(shader) => console.log(shader)}
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
      </Suspense> */}
      {/* <CubeCamera
        position={[0, 0.0, -0.6]}
        resolution={1028}
        near={0.1}
        far={30}
      >
        {(texture) => (
          <Icosahedron
            ref={orbRef}
            args={[2, 2]}
            receiveShadow
            onClick={() => console.log(orbRef.current)}
            position={[0, 0.0, -1.7]}
          >
            <meshPhysicalMaterial
              envMap={texture}
              color="#050505"
              reflectivity={0.9}
              roughness={0.1}
            />
          </Icosahedron>
        )}
      </CubeCamera> */}
      <Orb />
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
