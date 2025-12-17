import {
  Environment,
  Loader,
  OrbitControls,
  Plane,
  useGLTF,
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
  const nixieTubeGlb = useGLTF("./models/nixie/NixieTube.glb");
  const { glassGeometry, rimGeometry } = useMemo(() => {
    let glassGeometry = nixieTubeGlb.meshes.Glass.geometry;
    delete glassGeometry.attributes.normal;
    glassGeometry = mergeVertices(glassGeometry);
    glassGeometry.computeVertexNormals();

    let rimGeometry = nixieTubeGlb.meshes.Rim.geometry;
    delete rimGeometry.attributes.normal;
    rimGeometry = mergeVertices(rimGeometry);
    rimGeometry.computeVertexNormals();

    return { glassGeometry, rimGeometry };
  }, [nixieTubeGlb]);
  const [baseColorMap, baseDisplacementMap, baseRoughnessMap] = useLoader(
    THREE.TextureLoader,
    [
      "./textures/green_metal_rust_4k/textures/green_metal_rust_diff_4k.jpg",
      "./textures/green_metal_rust_4k/textures/green_metal_rust_disp_4k.png",
      "./textures/green_metal_rust_4k/textures/green_metal_rust_rough_4k.jpg",
    ],
  );
  const [baseNormalMap] = useLoader(EXRLoader, [
    "./textures/green_metal_rust_4k/textures/green_metal_rust_nor_gl_4k.exr",
  ]);

  const wrapping = THREE.RepeatWrapping;
  baseColorMap.wrapS = wrapping;
  baseColorMap.wrapT = wrapping;
  baseDisplacementMap.wrapS = wrapping;
  baseDisplacementMap.wrapT = wrapping;
  baseNormalMap.wrapS = wrapping;
  baseNormalMap.wrapT = wrapping;
  baseRoughnessMap.wrapS = wrapping;
  baseRoughnessMap.wrapT = wrapping;

  const repeatScale = 10;
  baseColorMap.repeat.set(repeatScale, repeatScale);
  baseDisplacementMap.repeat.set(repeatScale, repeatScale);
  baseNormalMap.repeat.set(repeatScale, repeatScale);
  baseRoughnessMap.repeat.set(repeatScale, repeatScale);

  const rotation = 0.0;
  baseColorMap.rotation = rotation;
  baseDisplacementMap.rotation = rotation;
  baseNormalMap.rotation = rotation;
  baseRoughnessMap.rotation = rotation;

  return (
    <>
      <Tube
        displayIndex={0}
        position={[-1.5, 0, 0]}
        glassGeometry={glassGeometry}
        rimGeometry={rimGeometry}
      />
      <Tube
        displayIndex={1}
        position={[-0.95, 0, 0]}
        glassGeometry={glassGeometry}
        rimGeometry={rimGeometry}
      />
      <Tube
        displayIndex={3}
        position={[-0.275, 0, 0]}
        glassGeometry={glassGeometry}
        rimGeometry={rimGeometry}
      />
      <Tube
        displayIndex={4}
        position={[0.275, 0, 0]}
        glassGeometry={glassGeometry}
        rimGeometry={rimGeometry}
      />
      <Tube
        displayIndex={6}
        position={[0.95, 0, 0]}
        glassGeometry={glassGeometry}
        rimGeometry={rimGeometry}
      />
      <Tube
        displayIndex={7}
        position={[1.5, 0, 0]}
        glassGeometry={glassGeometry}
        rimGeometry={rimGeometry}
      />
      <Plane args={[30, 30]} position={[0, 0, 0]}>
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
      </Plane>
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
      {/* <div className="fixed top-0 left-0 flex h-full w-full">
        <div className="pointer-events-none m-auto text-center text-9xl text-white select-none">
          WORK IN PROGRESS I AM NOT PLEASED WITH THIS YET
        </div>
      </div> */}
    </>
  );
}
