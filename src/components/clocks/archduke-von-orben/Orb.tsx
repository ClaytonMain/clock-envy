import { useFrame } from "@react-three/fiber";
import { button, monitor, useControls } from "leva";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import CustomShaderMaterial from "three-custom-shader-material";
import CSM from "three-custom-shader-material/vanilla";
import { mergeVertices } from "three/addons/utils/BufferGeometryUtils.js";
import { Reflector } from "three/examples/jsm/objects/Reflector.js";
import useArchdukeVonOrbenStore from "../../../stores/useArchdukeVonOrbenStore";
import orbFragmentShader from "./shaders/orb/orb.frag";
import orbVertexShader from "./shaders/orb/orb.vert";

function smootherstep(edge0: number, edge1: number, x: number) {
  // https://en.wikipedia.org/wiki/Smoothstep (sort of)
  x = Math.min(Math.max((x - edge0) / (edge1 - edge0), 0.0), 1.0);

  return x * x * x * (x * (x * 6 - 15) + 10) * (edge1 - edge0) + edge0;
}

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
  uHBaseTimeFreq: new THREE.Uniform(0.02),
  uHBaseStrength: new THREE.Uniform(0.04),
  // Minute
  uMTime: new THREE.Uniform(0.0),
  uMSpringVelocity: new THREE.Uniform(0.0),
  uMBasePosFreq: new THREE.Uniform(1.06),
  uMBaseTimeFreq: new THREE.Uniform(0.02),
  uMBaseStrength: new THREE.Uniform(0.04),
  // Second
  uSTime: new THREE.Uniform(0.0),
  uSSpringVelocity: new THREE.Uniform(0.0),
  uSBasePosFreq: new THREE.Uniform(3.28),
  uSBaseTimeFreq: new THREE.Uniform(0.02),
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
  const uHSpringVelocityPrevRef = useRef(
    useArchdukeVonOrbenStore.getState().uHSpringVelocity,
  );

  const uMSpringVelocityRef = useRef(
    useArchdukeVonOrbenStore.getState().uMSpringVelocity,
  );
  const uMSpringVelocityPrevRef = useRef(
    useArchdukeVonOrbenStore.getState().uMSpringVelocity,
  );

  const uSSpringVelocityRef = useRef(
    useArchdukeVonOrbenStore.getState().uSSpringVelocity,
  );
  const uSSpringVelocityPrevRef = useRef(
    useArchdukeVonOrbenStore.getState().uSSpringVelocity,
  );
  useEffect(() => {
    const unsubHVelocity = useArchdukeVonOrbenStore.subscribe(
      (state) => state.uHSpringVelocity,
      (value, previous) => {
        uHSpringVelocityRef.current = value;
        uHSpringVelocityPrevRef.current = previous;
      },
    );
    const unsubMVelocity = useArchdukeVonOrbenStore.subscribe(
      (state) => state.uMSpringVelocity,
      (value, previous) => {
        uMSpringVelocityRef.current = value;
        uMSpringVelocityPrevRef.current = previous;
      },
    );
    const unsubSVelocity = useArchdukeVonOrbenStore.subscribe(
      (state) => state.uSSpringVelocity,
      (value, previous) => {
        uSSpringVelocityRef.current = value;
        uSSpringVelocityPrevRef.current = previous;
      },
    );
    return () => {
      unsubHVelocity();
      unsubMVelocity();
      unsubSVelocity();
    };
  }, []);

  const controlValues = useControls({
    // Debug
    clearMaxVelocityRef: button(() => {
      maxVelocityRef.current = 0;
    }),
    clearMinVelocityRef: button(() => {
      minVelocityRef.current = 0;
    }),
    // Velocity
    velocityLimit: {
      value: 1,
      min: 0,
      max: 1.5,
      step: 0.01,
    },
    // Orb
    orbMass: {
      value: 5000,
      min: 0,
      max: 10000,
      step: 1,
    },
    orbDecayFactor: {
      value: 0.08,
      min: 0,
      max: 1,
      step: 0.001,
    },
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
    velocityRef: monitor(() => velocityRef.current, {
      graph: true,
      interval: 300,
    }),
    sVelocityRef: monitor(() => uSSpringVelocityRef.current, {
      graph: true,
      interval: 30,
    }),
  });

  const deltaRef = useRef(0);
  const uTimeRef = useRef(0);
  const uHTimeRef = useRef(0);
  const uMTimeRef = useRef(0);
  const uSTimeRef = useRef(0);

  const velocityRef = useRef(0.1);
  const maxVelocityRef = useRef(0);
  const minVelocityRef = useRef(0);

  const masses = {
    orb: 5000,
    h: 4,
    m: 2,
    s: 1,
  };

  useFrame(({ gl, camera, scene }, delta) => {
    // General.
    deltaRef.current = Math.max(delta, 0.016);

    const hForce =
      (masses.h *
        Math.max(
          Math.abs(
            uHSpringVelocityRef.current - uHSpringVelocityPrevRef.current,
          ) - velocityRef.current,
          0,
        )) /
      deltaRef.current;
    const mForce =
      (masses.m *
        Math.max(
          Math.abs(
            uMSpringVelocityRef.current - uMSpringVelocityPrevRef.current,
          ) - velocityRef.current,
          0,
        )) /
      deltaRef.current;
    const sForce =
      (masses.s *
        Math.max(
          Math.abs(
            uSSpringVelocityRef.current - uSSpringVelocityPrevRef.current,
          ) - velocityRef.current,
          0,
        )) /
      deltaRef.current;

    const forceToAdd = (hForce + mForce + sForce) / controlValues.orbMass;

    velocityRef.current += forceToAdd;
    velocityRef.current = Math.max(
      0,
      velocityRef.current *
        (1 - controlValues.orbDecayFactor * deltaRef.current),
    );

    if (uSSpringVelocityRef.current > maxVelocityRef.current) {
      maxVelocityRef.current = uSSpringVelocityRef.current;
      console.log("New max velocity:", maxVelocityRef.current.toFixed(4));
    }
    if (uSSpringVelocityRef.current < minVelocityRef.current) {
      minVelocityRef.current = uSSpringVelocityRef.current;
      console.log("New min velocity:", minVelocityRef.current.toFixed(4));
    }

    // uTimeRef.current += velocityRef.current + deltaRef.current;
    uTimeRef.current += velocityRef.current;
    uHTimeRef.current += smootherstep(
      -0.02,
      0.02,
      uHSpringVelocityRef.current * deltaRef.current,
    );
    uMTimeRef.current += smootherstep(
      -0.02,
      0.02,
      uMSpringVelocityRef.current * deltaRef.current,
    );
    uSTimeRef.current += smootherstep(
      -0.02,
      0.02,
      uSSpringVelocityRef.current * deltaRef.current,
    );

    // Uniform updates.
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
