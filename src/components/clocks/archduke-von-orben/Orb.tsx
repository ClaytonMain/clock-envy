import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import CustomShaderMaterial from "three-custom-shader-material";
import { mergeVertices } from "three/addons/utils/BufferGeometryUtils.js";
import { Reflector } from "three/examples/jsm/objects/Reflector.js";
import orbFragmentShader from "./shaders/orb/orb.frag";
import orbVertexShader from "./shaders/orb/orb.vert";

export default function Orb({
  position = [0, 0, 0],
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
  const orbLayers = useMemo(() => {
    const layers = new THREE.Layers();
    layers.set(1);
    return layers;
  }, []);
  const reflectorLayers = useMemo(() => {
    const layers = new THREE.Layers();
    return layers;
  }, []);

  useFrame(({ gl, camera, scene }) => {
    camera.layers = reflectorLayers;
    gl.render(scene, camera);

    if (reflectorRef.current && csmRef.current) {
      // @ts-expect-error It's fine, don't worry about it.
      csmRef.current.uniforms.uTextureMatrix.value =
        // @ts-expect-error It's fine, don't worry about it.
        reflectorRef.current.material.uniforms["textureMatrix"].value;
      // @ts-expect-error It's fine, don't worry about it.
      csmRef.current.uniforms.uTDiffuse.value =
        // @ts-expect-error It's fine, don't worry about it.
        reflectorRef.current.material.uniforms["tDiffuse"].value;
    } else {
      console.log("no reflectorRef or csmRef");
    }

    camera.layers = orbLayers;
    // gl.render(scene, camera);
  });

  return (
    <>
      <primitive
        ref={reflectorRef}
        position={position}
        object={mirror}
        layers={reflectorLayers}
      />
      <mesh
        geometry={orbGeometry}
        position={position}
        castShadow
        layers={orbLayers}
      >
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
          clearcoat={0.5}
          clearcoatRoughness={0.7}
        />
      </mesh>
    </>
  );
}
