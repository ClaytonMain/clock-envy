import { CubeCamera, MeshReflectorMaterial } from "@react-three/drei";
import { useMemo } from "react";
import * as THREE from "three";
import CustomShaderMaterial from "three-custom-shader-material";
import { mergeVertices } from "three/addons/utils/BufferGeometryUtils.js";
import orbVertexShader from "./shaders/orb/orb.vert";

{
  /* <MeshReflectorMaterial
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
/> */
}

export default function Orb() {
  const orbGeometry = useMemo(() => {
    // const geometry = mergeVertices(new THREE.IcosahedronGeometry(2, 2));
    // geometry.computeTangents();
    // return geometry;
    return new THREE.IcosahedronGeometry(2, 2);
  }, []);

  return (
    <mesh
      geometry={orbGeometry}
      position={[0, 0, -2.3]}
      // receiveShadow
      castShadow
    >
      <MeshReflectorMaterial
        attach="material"
        onBeforeCompile={(shader) => console.log(shader.vertexShader)}
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
      {/* <CustomShaderMaterial
        baseMaterial={MeshReflectorMaterial}
        vertexShader={orbVertexShader}
        // Base material properties
        // blur={[800, 800]}
        // resolution={2048}
        // mixBlur={1}
        // mixStrength={80}
        // depthScale={1.2}
        // minDepthThreshold={0}
        // maxDepthThreshold={1.4}
        roughness={0.3}
        metalness={0.2}
        reflectivity={0.5}
        color="#050505"
        // flatShading
      /> */}
    </mesh>
  );
}
