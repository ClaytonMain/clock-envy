import {
  Environment,
  Loader,
  OrbitControls,
  RoundedBox,
} from "@react-three/drei";
import { Canvas, useLoader } from "@react-three/fiber";
import { Suspense, useMemo } from "react";
import * as THREE from "three";
import { EXRLoader } from "three/addons/loaders/EXRLoader.js";
import { mergeVertices } from "three/addons/utils/BufferGeometryUtils.js";
import useAppStore from "../../../stores/useAppStore";
import CustomStatsComponent from "../../misc/CustomStatsComponent";
import Tube from "./Tube";

function Nixie() {
  const glassGeometry = useMemo(() => {
    const points = [];
    points.push(new THREE.Vector2(0.0, 1.0));
    points.push(new THREE.Vector2(0.009, 0.998));
    points.push(new THREE.Vector2(0.0197, 0.989));
    points.push(new THREE.Vector2(0.022, 0.98));
    points.push(new THREE.Vector2(0.0245, 0.97));
    points.push(new THREE.Vector2(0.028, 0.948));
    points.push(new THREE.Vector2(0.035, 0.94));
    points.push(new THREE.Vector2(0.05, 0.934));
    points.push(new THREE.Vector2(0.072, 0.928));
    points.push(new THREE.Vector2(0.1, 0.92));
    points.push(new THREE.Vector2(0.15, 0.9));
    points.push(new THREE.Vector2(0.195, 0.87));
    points.push(new THREE.Vector2(0.24, 0.82));
    points.push(new THREE.Vector2(0.26, 0.77));
    points.push(new THREE.Vector2(0.26, 0.6));
    points.push(new THREE.Vector2(0.26, 0.5));
    points.push(new THREE.Vector2(0.26, 0.5));
    points.push(new THREE.Vector2(0.26, 0.4));
    points.push(new THREE.Vector2(0.26, 0.3));
    points.push(new THREE.Vector2(0.26, 0.2));
    points.push(new THREE.Vector2(0.26, 0.1));
    points.push(new THREE.Vector2(0.26, 0.0));
    // // Test
    // points.push(new THREE.Vector2(0.0, 0.0));
    // Return
    points.push(new THREE.Vector2(0.22, 0.0));
    points.push(new THREE.Vector2(0.22, 0.1));
    points.push(new THREE.Vector2(0.22, 0.2));
    points.push(new THREE.Vector2(0.22, 0.3));
    points.push(new THREE.Vector2(0.22, 0.4));
    points.push(new THREE.Vector2(0.22, 0.5));
    points.push(new THREE.Vector2(0.22, 0.6));
    points.push(new THREE.Vector2(0.22, 0.7));
    points.push(new THREE.Vector2(0.22, 0.77));
    points.push(new THREE.Vector2(0.21, 0.795));
    points.push(new THREE.Vector2(0.195, 0.82));
    points.push(new THREE.Vector2(0.175, 0.84));
    points.push(new THREE.Vector2(0.13, 0.866));
    points.push(new THREE.Vector2(0.07, 0.89));
    points.push(new THREE.Vector2(0, 0.897));
    points.reverse();
    const latheGeometry = new THREE.LatheGeometry(points, 32);
    const geometry = mergeVertices(latheGeometry);
    return geometry;
  }, []);
  const [baseColorMap, baseDisplacementMap] = useLoader(THREE.TextureLoader, [
    "./textures/wood_table_worn_1k/textures/wood_table_worn_diff_1k.jpg",
    "./textures/wood_table_worn_1k/textures/wood_table_worn_disp_1k.png",
  ]);
  const [baseNormalMap, baseRoughnessMap] = useLoader(EXRLoader, [
    "./textures/wood_table_worn_1k/textures/wood_table_worn_nor_gl_1k.exr",
    "./textures/wood_table_worn_1k/textures/wood_table_worn_rough_1k.exr",
  ]);
  baseColorMap.wrapS = THREE.MirroredRepeatWrapping;
  baseColorMap.wrapT = THREE.MirroredRepeatWrapping;
  baseDisplacementMap.wrapS = THREE.MirroredRepeatWrapping;
  baseDisplacementMap.wrapT = THREE.MirroredRepeatWrapping;
  baseNormalMap.wrapS = THREE.MirroredRepeatWrapping;
  baseNormalMap.wrapT = THREE.MirroredRepeatWrapping;
  baseRoughnessMap.wrapS = THREE.MirroredRepeatWrapping;
  baseRoughnessMap.wrapT = THREE.MirroredRepeatWrapping;
  return (
    <>
      <Tube
        displayIndex={0}
        glassGeometry={glassGeometry}
        position={[-1.5, 0, 0]}
      />
      <Tube
        displayIndex={1}
        glassGeometry={glassGeometry}
        position={[-0.95, 0, 0]}
      />
      <Tube
        displayIndex={3}
        glassGeometry={glassGeometry}
        position={[-0.275, 0, 0]}
      />
      <Tube
        displayIndex={4}
        glassGeometry={glassGeometry}
        position={[0.275, 0, 0]}
      />
      <Tube
        displayIndex={6}
        glassGeometry={glassGeometry}
        position={[0.95, 0, 0]}
      />
      <Tube
        displayIndex={7}
        glassGeometry={glassGeometry}
        position={[1.5, 0, 0]}
      />
      <RoundedBox args={[3.8, 0.3, 1]} position={[0, -0.1, 0]} radius={0.03}>
        <meshPhysicalMaterial
          roughness={0.2}
          clearcoat={0.3}
          clearcoatRoughness={0.2}
          map={baseColorMap}
          displacementMap={baseDisplacementMap}
          normalMap={baseNormalMap}
          roughnessMap={baseRoughnessMap}
          displacementScale={0.02}
        />
      </RoundedBox>
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
          position: [0, 3, 35],
          // rotation: [0.05, 0, 0],
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
            files="./environments/photo_studio_loft_hall_4k.exr"
            resolution={2048}
          />
          <ambientLight intensity={0.5} />
          <Nixie />
          <OrbitControls makeDefault />
        </Suspense>
      </Canvas>
      <Loader />
      <div className="fixed top-0 left-0 flex h-full w-full">
        <div className="pointer-events-none m-auto text-center text-9xl text-white select-none">
          WORK IN PROGRESS I AM NOT PLEASED WITH THIS YET
        </div>
      </div>
    </>
  );
}
