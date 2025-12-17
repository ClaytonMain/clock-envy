import { Plane } from "@react-three/drei";
import { useLoader } from "@react-three/fiber";
import * as THREE from "three";
import CustomShaderMaterial from "three-custom-shader-material";
import { EXRLoader } from "three/addons/loaders/EXRLoader.js";
import { FOREGROUND_CONSTANTS } from "./constants/constants";
import screenFragmentShader from "./shaders/screen/screen.frag";
import screenVertexShader from "./shaders/screen/screen.vert";

export default function Screen() {
  const [baseColorMap] = useLoader(THREE.TextureLoader, [
    "./textures/granular_concrete_2k/textures/granular_concrete_diff_2k.jpg",
  ]);
  const [baseNormalMap, baseRoughnessMap] = useLoader(EXRLoader, [
    "./textures/granular_concrete_2k/textures/granular_concrete_nor_gl_2k.exr",
    "./textures/granular_concrete_2k/textures/granular_concrete_rough_2k.exr",
  ]);
  baseColorMap.wrapS = THREE.RepeatWrapping;
  baseColorMap.wrapT = THREE.RepeatWrapping;
  baseNormalMap.wrapS = THREE.RepeatWrapping;
  baseNormalMap.wrapT = THREE.RepeatWrapping;
  baseRoughnessMap.wrapS = THREE.RepeatWrapping;
  baseRoughnessMap.wrapT = THREE.RepeatWrapping;

  const repeatScale = 10;
  baseColorMap.repeat.set(repeatScale, repeatScale);
  baseNormalMap.repeat.set(repeatScale, repeatScale);
  baseRoughnessMap.repeat.set(repeatScale, repeatScale);

  const rotation = 0.2;
  baseColorMap.rotation = rotation;
  baseNormalMap.rotation = rotation;
  baseRoughnessMap.rotation = rotation;

  return (
    <Plane
      args={[30, 30]}
      position={[
        0,
        0,
        -FOREGROUND_CONSTANTS.cubeSize *
          (FOREGROUND_CONSTANTS.cubeCounts[2] / 2),
      ]}
      receiveShadow
    >
      <CustomShaderMaterial
        attach="material"
        // color={"#363946"}
        metalness={1}
        roughness={1}
        // clearcoat={1}
        // clearcoatRoughness={0.3}
        map={baseColorMap}
        normalMap={baseNormalMap}
        roughnessMap={baseRoughnessMap}
        uniforms={{
          uCubeSize: { value: FOREGROUND_CONSTANTS.cubeSize },
          uCubeCounts: { value: FOREGROUND_CONSTANTS.cubeCounts },
        }}
        baseMaterial={THREE.MeshPhysicalMaterial}
        vertexShader={screenVertexShader}
        fragmentShader={screenFragmentShader}
        transparent
      />
    </Plane>
  );
}
