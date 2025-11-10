import {
  CubeCamera,
  MeshReflectorMaterial,
  shaderMaterial,
} from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import CustomShaderMaterial from "three-custom-shader-material";
import { mergeVertices } from "three/addons/utils/BufferGeometryUtils.js";
import { Reflector } from "three/examples/jsm/objects/Reflector.js";
import orbFragmentShader from "./shaders/orb/orb.frag";
import orbVertexShader from "./shaders/orb/orb.vert";

export default function Orb({
  position = [0, 0, -2.3],
}: {
  position?: [number, number, number];
}) {
  const reflectorRef = useRef<THREE.Mesh>(null!);
  const csmRef = useRef(null!);
  const orbGeometry = useMemo(() => {
    const geometry = mergeVertices(new THREE.IcosahedronGeometry(2, 50));
    geometry.computeTangents();
    return geometry;
  }, []);
  const mirror = useMemo(() => {
    const reflector = new Reflector(orbGeometry, {
      textureWidth: 1024,
      textureHeight: 1024,
    });
    reflector.forceUpdate = true;
    return reflector;
  }, [orbGeometry]);

  useFrame(() => {
    if (reflectorRef.current && csmRef.current) {
      csmRef.current.uniforms.uTextureMatrix.value =
        reflectorRef.current.material.uniforms["textureMatrix"].value;
      csmRef.current.uniforms.uTDiffuse.value =
        reflectorRef.current.material.uniforms["tDiffuse"].value;
    }
  });

  return (
    <group position={position}>
      <primitive
        ref={reflectorRef}
        position={[0, 0, 0]}
        object={mirror}
        layers={new THREE.Layers().set(1)}
      />
      <mesh geometry={orbGeometry} position={[0, 0, 0]} castShadow>
        {/* <MeshReflectorMaterial
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
        /> */}
        <CustomShaderMaterial
          ref={csmRef}
          baseMaterial={THREE.MeshPhysicalMaterial}
          vertexShader={orbVertexShader}
          fragmentShader={orbFragmentShader}
          uniforms={{
            uTextureMatrix: new THREE.Uniform(new THREE.Matrix4()),
            uTDiffuse: new THREE.Uniform(new THREE.Texture()),
          }}
          color="#050505"
        />
      </mesh>
    </group>
  );
}
