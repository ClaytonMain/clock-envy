import { useFrame } from "@react-three/fiber";
import { useControls } from "leva";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import CustomShaderMaterial from "three-custom-shader-material";
import CSM from "three-custom-shader-material/vanilla";
import { mergeVertices } from "three/addons/utils/BufferGeometryUtils.js";
import { Reflector } from "three/examples/jsm/objects/Reflector.js";
import useArchdukeVonOrbenStore from "../../../stores/useArchdukeVonOrbenStore";
import orbFragmentShader from "./shaders/orb/orb.frag";
import orbVertexShader from "./shaders/orb/orb.vert";

const uniforms = {
  // Misc.
  uTime: new THREE.Uniform(0.0),
  uBasePosFreq: new THREE.Uniform(3.15),
  uBaseTimeFreq: new THREE.Uniform(0.02),
  uBaseStrength: new THREE.Uniform(0.06),
  // Hour
  uHTime: new THREE.Uniform(0.0),
  uHSpringVelocity: new THREE.Uniform(0.0),
  uHBasePosFreq: new THREE.Uniform(0.48),
  uHBaseTimeFreq: new THREE.Uniform(0.59),
  uHBaseStrength: new THREE.Uniform(0.1),
  // Minute
  uMTime: new THREE.Uniform(0.0),
  uMSpringVelocity: new THREE.Uniform(0.0),
  uMBasePosFreq: new THREE.Uniform(1.06),
  uMBaseTimeFreq: new THREE.Uniform(0.67),
  uMBaseStrength: new THREE.Uniform(0.11),
  // Second
  uSTime: new THREE.Uniform(0.0),
  uSSpringVelocity: new THREE.Uniform(0.0),
  uSBasePosFreq: new THREE.Uniform(3.28),
  uSBaseTimeFreq: new THREE.Uniform(1.02),
  uSBaseStrength: new THREE.Uniform(0.04),
};

export default function Orb({
  position = [0, 0, 0],
}: {
  position?: [number, number, number];
}) {
  const reflectorRef = useRef<THREE.Mesh>(null!);
  const csmRef = useRef<CSM<typeof THREE.MeshPhysicalMaterial>>(null!);
  const csmDepthRef = useRef<CSM<typeof THREE.MeshDepthMaterial>>(null!);
  const orbRef = useRef<THREE.Mesh>(null!);

  const orbGeometry = useMemo(() => {
    const geometry = mergeVertices(new THREE.IcosahedronGeometry(2, 50));
    geometry.computeTangents();
    return geometry;
  }, []);

  const mirror = useMemo(() => {
    const reflector = new Reflector(orbGeometry, {
      textureWidth: 2048,
      textureHeight: 2048,
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

  const uHSpringVelocityRef = useRef(
    useArchdukeVonOrbenStore.getState().uHSpringVelocity,
  );
  const uMSpringVelocityRef = useRef(
    useArchdukeVonOrbenStore.getState().uMSpringVelocity,
  );
  const uSSpringVelocityRef = useRef(
    useArchdukeVonOrbenStore.getState().uSSpringVelocity,
  );

  useEffect(() => {
    const unsubscribeH = useArchdukeVonOrbenStore.subscribe(
      (state) => state.uHSpringVelocity,
      (value) => {
        uHSpringVelocityRef.current = value;
      },
    );
    const unsubscribeM = useArchdukeVonOrbenStore.subscribe(
      (state) => state.uMSpringVelocity,
      (value) => {
        uMSpringVelocityRef.current = value;
      },
    );
    const unsubscribeS = useArchdukeVonOrbenStore.subscribe(
      (state) => state.uSSpringVelocity,
      (value) => {
        uSSpringVelocityRef.current = value;
      },
    );
    return () => {
      unsubscribeH();
      unsubscribeM();
      unsubscribeS();
    };
  }, []);

  const controlValues = useControls({
    // Time
    uBasePosFreq: {
      value: uniforms.uBasePosFreq.value,
      min: 0,
      max: 5,
      step: 0.01,
    },
    uBaseTimeFreq: {
      value: uniforms.uBaseTimeFreq.value,
      min: 0,
      max: 5,
      step: 0.01,
    },
    uBaseStrength: {
      value: uniforms.uBaseStrength.value,
      min: 0,
      max: 5,
      step: 0.01,
    },
    // Hour
    uHBasePosFreq: {
      value: uniforms.uHBasePosFreq.value,
      min: 0,
      max: 5,
      step: 0.01,
    },
    uHBaseTimeFreq: {
      value: uniforms.uHBaseTimeFreq.value,
      min: 0,
      max: 5,
      step: 0.01,
    },
    uHBaseStrength: {
      value: uniforms.uHBaseStrength.value,
      min: 0,
      max: 5,
      step: 0.01,
    },
    // Minute
    uMBasePosFreq: {
      value: uniforms.uMBasePosFreq.value,
      min: 0,
      max: 5,
      step: 0.01,
    },
    uMBaseTimeFreq: {
      value: uniforms.uMBaseTimeFreq.value,
      min: 0,
      max: 5,
      step: 0.01,
    },
    uMBaseStrength: {
      value: uniforms.uMBaseStrength.value,
      min: 0,
      max: 5,
      step: 0.01,
    },
    // Second
    uSBasePosFreq: {
      value: uniforms.uSBasePosFreq.value,
      min: 0,
      max: 5,
      step: 0.01,
    },
    uSBaseTimeFreq: {
      value: uniforms.uSBaseTimeFreq.value,
      min: 0,
      max: 5,
      step: 0.01,
    },
    uSBaseStrength: {
      value: uniforms.uSBaseStrength.value,
      min: 0,
      max: 5,
      step: 0.01,
    },
  });

  const deltaRef = useRef(0);
  const uTimeRef = useRef(0);
  const uHTimeRef = useRef(0);
  const uMTimeRef = useRef(0);
  const uSTimeRef = useRef(0);

  const velocityRef = useRef(0);

  useFrame(({ gl, camera, scene }, delta) => {
    // General.
    deltaRef.current = Math.max(delta, 0.016);

    // orbRef.current.rotation.y += deltaRef.current * 0.001;
    // orbRef.current.rotation.x += deltaRef.current * 0.005;
    // orbRef.current.rotation.z += deltaRef.current * 0.002;

    velocityRef.current +=
      deltaRef.current *
      (Math.abs(uHSpringVelocityRef.current) * 40 +
        Math.abs(uMSpringVelocityRef.current) * 20 +
        Math.abs(uSSpringVelocityRef.current) * 10);
    velocityRef.current = Math.max(
      velocityRef.current - deltaRef.current * 5,
      0,
    );

    // Uniform updates.
    uTimeRef.current += deltaRef.current * (1 + velocityRef.current);
    uHTimeRef.current +=
      deltaRef.current * Math.abs(uHSpringVelocityRef.current);
    uMTimeRef.current +=
      deltaRef.current * Math.abs(uMSpringVelocityRef.current);
    uSTimeRef.current +=
      deltaRef.current * Math.abs(uSSpringVelocityRef.current);

    uniforms.uTime.value = uTimeRef.current;
    uniforms.uBasePosFreq.value = controlValues.uBasePosFreq;
    uniforms.uBaseTimeFreq.value = controlValues.uBaseTimeFreq;
    uniforms.uBaseStrength.value = controlValues.uBaseStrength;

    uniforms.uHTime.value = uHTimeRef.current;
    uniforms.uHSpringVelocity.value = uHSpringVelocityRef.current;
    uniforms.uHBasePosFreq.value = controlValues.uHBasePosFreq;
    uniforms.uHBaseTimeFreq.value = controlValues.uHBaseTimeFreq;
    uniforms.uHBaseStrength.value = controlValues.uHBaseStrength;

    uniforms.uMTime.value = uMTimeRef.current;
    uniforms.uMSpringVelocity.value = uMSpringVelocityRef.current;
    uniforms.uMBasePosFreq.value = controlValues.uMBasePosFreq;
    uniforms.uMBaseTimeFreq.value = controlValues.uMBaseTimeFreq;
    uniforms.uMBaseStrength.value = controlValues.uMBaseStrength;

    uniforms.uSTime.value = uSTimeRef.current;
    uniforms.uSSpringVelocity.value = uSSpringVelocityRef.current;
    uniforms.uSBasePosFreq.value = controlValues.uSBasePosFreq;
    uniforms.uSBaseTimeFreq.value = controlValues.uSBaseTimeFreq;
    uniforms.uSBaseStrength.value = controlValues.uSBaseStrength;

    // Rendering logic.
    camera.layers = reflectorLayers;
    gl.render(scene, camera);

    if (reflectorRef.current && csmRef.current) {
      csmRef.current.uniforms.uTextureMatrix.value =
        // @ts-expect-error It's fine, don't worry about it.
        reflectorRef.current.material.uniforms["textureMatrix"].value;
      csmRef.current.uniforms.uTDiffuse.value =
        // @ts-expect-error It's fine, don't worry about it.
        reflectorRef.current.material.uniforms["tDiffuse"].value;
    } else {
      console.log("no reflectorRef or csmRef");
    }

    camera.layers = orbLayers;
    gl.render(scene, camera);
  });

  return (
    <>
      <group position={position}>
        <primitive
          ref={reflectorRef}
          object={mirror}
          layers={reflectorLayers}
        />
        <mesh
          ref={orbRef}
          geometry={orbGeometry}
          castShadow
          receiveShadow
          layers={orbLayers}
        >
          <CustomShaderMaterial
            attach="material"
            ref={csmRef}
            baseMaterial={THREE.MeshPhysicalMaterial}
            vertexShader={orbVertexShader}
            fragmentShader={orbFragmentShader}
            uniforms={{
              uTextureMatrix: new THREE.Uniform(new THREE.Matrix4()),
              uTDiffuse: new THREE.Uniform(new THREE.Texture()),

              ...uniforms,
            }}
            color="#000"
            // color="#fff"
            roughness={0.1}
            metalness={0.7}
            reflectivity={0.2}
            clearcoat={0.3}
            clearcoatRoughness={0.01}
          />
          <CustomShaderMaterial
            attach="customDepthMaterial"
            ref={csmDepthRef}
            uniforms={{
              ...uniforms,
            }}
            baseMaterial={THREE.MeshDepthMaterial}
            vertexShader={orbVertexShader}
            depthPacking={THREE.RGBADepthPacking}
          />
        </mesh>
      </group>
    </>
  );
}
