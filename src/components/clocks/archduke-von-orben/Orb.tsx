import { useFrame } from "@react-three/fiber";
import { monitor, useControls } from "leva";
import { springValue } from "motion/react";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import CustomShaderMaterial from "three-custom-shader-material";
import CSM from "three-custom-shader-material/vanilla";
import { mergeVertices } from "three/addons/utils/BufferGeometryUtils.js";
import { Reflector } from "three/examples/jsm/objects/Reflector.js";
import useAppStore from "../../../stores/useAppStore";
import useArchdukeVonOrbenStore from "../../../stores/useArchdukeVonOrbenStore";
import { SPRING_CONFIGS } from "./constants/constants";
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
  uHBasePosFreq: new THREE.Uniform(0.48),
  uHBaseTimeFreq: new THREE.Uniform(0.08),
  uHBaseStrength: new THREE.Uniform(0.04),
  // Minute
  uMTime: new THREE.Uniform(0.0),
  uMBasePosFreq: new THREE.Uniform(1.06),
  uMBaseTimeFreq: new THREE.Uniform(0.08),
  uMBaseStrength: new THREE.Uniform(0.04),
  // Second
  uSTime: new THREE.Uniform(0.0),
  uSBasePosFreq: new THREE.Uniform(3.28),
  uSBaseTimeFreq: new THREE.Uniform(0.08),
  uSBaseStrength: new THREE.Uniform(0.04),
};

export default function Orb({
  position = [0, 0, 0],
}: {
  position?: [number, number, number];
}) {
  const formatHours24 = useAppStore((state) => state.formatHours24);
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

  // Sort of mimicking the Hand spring velocities, but without the large
  // jumps when going from full hand length to zero. Helps achieve the
  // tick effect on the orb each time the hand lengths change.
  const hSpringLocal = springValue<number>(0, {
    ...SPRING_CONFIGS.shared,
    ...SPRING_CONFIGS.h,
  });
  const mSpringLocal = springValue<number>(0, {
    ...SPRING_CONFIGS.shared,
    ...SPRING_CONFIGS.m,
  });
  const sSpringLocal = springValue<number>(0, {
    ...SPRING_CONFIGS.shared,
    ...SPRING_CONFIGS.s,
  });

  // Used to calculate the force imparted on the orb by each hand's spring
  // velocity changes. Helps achieve that nice inertia effect when the hands
  // reset from full length to zero.
  const uHSpringVelocityDeltaRef = useRef(0);
  const uMSpringVelocityDeltaRef = useRef(0);
  const uSSpringVelocityDeltaRef = useRef(0);

  useEffect(() => {
    const unsubCurrentTimeValue = useAppStore.subscribe(
      (state) => state.currentTimeValue,
      (value, previous) => {
        if (value.get("hour") !== previous.get("hour")) {
          hSpringLocal.set(hSpringLocal.get() + 1 / (formatHours24 ? 24 : 12));
        }
        if (value.get("minute") !== previous.get("minute")) {
          mSpringLocal.set(mSpringLocal.get() + 1 / 60);
        }
        if (value.get("second") !== previous.get("second")) {
          sSpringLocal.set(sSpringLocal.get() + 1 / 60);
        }
      },
    );
    const unsubHVelocity = useArchdukeVonOrbenStore.subscribe(
      (state) => state.uHSpringVelocity,
      (value, previous) => {
        uHSpringVelocityDeltaRef.current = value - previous;
      },
    );
    const unsubMVelocity = useArchdukeVonOrbenStore.subscribe(
      (state) => state.uMSpringVelocity,
      (value, previous) => {
        uMSpringVelocityDeltaRef.current = value - previous;
      },
    );
    const unsubSVelocity = useArchdukeVonOrbenStore.subscribe(
      (state) => state.uSSpringVelocity,
      (value, previous) => {
        uSSpringVelocityDeltaRef.current = value - previous;
      },
    );
    return () => {
      unsubCurrentTimeValue();
      unsubHVelocity();
      unsubMVelocity();
      unsubSVelocity();
    };
  }, [formatHours24, hSpringLocal, mSpringLocal, sSpringLocal]);

  const controlValues = useControls({
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
    sVelocityRef: monitor(() => uSSpringVelocityDeltaRef.current, {
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

  useFrame(({ gl, camera, scene }, delta) => {
    // General.
    deltaRef.current = Math.max(delta, 0.016);

    const hForce =
      (SPRING_CONFIGS.h.mass *
        2 *
        Math.max(
          Math.abs(uHSpringVelocityDeltaRef.current) - velocityRef.current,
          0,
        )) /
      deltaRef.current;
    const mForce =
      (SPRING_CONFIGS.m.mass *
        2 *
        Math.max(
          Math.abs(uMSpringVelocityDeltaRef.current) - velocityRef.current,
          0,
        )) /
      deltaRef.current;
    const sForce =
      (SPRING_CONFIGS.s.mass *
        2 *
        Math.max(
          Math.abs(uSSpringVelocityDeltaRef.current) - velocityRef.current,
          0,
        )) /
      deltaRef.current;

    velocityRef.current += (hForce + mForce + sForce) / controlValues.orbMass;
    velocityRef.current = Math.max(
      0,
      velocityRef.current *
        (1 - controlValues.orbDecayFactor * deltaRef.current),
    );

    uTimeRef.current += velocityRef.current;
    uHTimeRef.current += deltaRef.current + hSpringLocal.getVelocity();
    uMTimeRef.current += deltaRef.current + mSpringLocal.getVelocity();
    uSTimeRef.current += deltaRef.current + sSpringLocal.getVelocity();

    // Uniform updates.
    uniforms.uTime.value = uTimeRef.current;
    uniforms.uBasePosFreq.value = controlValues.uBasePosFreq;
    uniforms.uBaseTimeFreq.value = controlValues.uBaseTimeFreq;
    uniforms.uBaseStrength.value = controlValues.uBaseStrength;

    uniforms.uHTime.value = uHTimeRef.current;
    uniforms.uHBasePosFreq.value = controlValues.uHBasePosFreq;
    uniforms.uHBaseTimeFreq.value = controlValues.uHBaseTimeFreq;
    uniforms.uHBaseStrength.value = controlValues.uHBaseStrength;

    uniforms.uMTime.value = uMTimeRef.current;
    uniforms.uMBasePosFreq.value = controlValues.uMBasePosFreq;
    uniforms.uMBaseTimeFreq.value = controlValues.uMBaseTimeFreq;
    uniforms.uMBaseStrength.value = controlValues.uMBaseStrength;

    uniforms.uSTime.value = uSTimeRef.current;
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
