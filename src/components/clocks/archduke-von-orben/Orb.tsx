import { useFrame, useThree } from "@react-three/fiber";
// import { monitor, useControls } from "leva";
import { useSpring } from "motion/react";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three/webgpu";
// import CustomShaderMaterial from "three-custom-shader-material";
// import CSM from "three-custom-shader-material/vanilla";
import { mergeVertices } from "three/addons/utils/BufferGeometryUtils.js";
// import { Reflector } from "three/examples/jsm/objects/Reflector.js";
import useAppStore from "../../../stores/useAppStore";
import useArchdukeVonOrbenStore from "../../../stores/useArchdukeVonOrbenStore";
import { SPRING_CONFIGS } from "./constants/constants";
// import orbFragmentShader from "./shaders/orb/orb.frag";
// import orbVertexShader from "./shaders/orb/orb.vert";
import { useLocalNodes, useNodes, useUniforms } from "@react-three/tsl";
import {
  Fn,
  mx_noise_float,
  normalLocal,
  positionLocal,
  time,
  vec3,
} from "three/tsl";

function GlobalEffects() {
  useNodes(({ uniforms }) => ({
    getWobble: Fn(
      ({
        pos,
        steppedToCameraAmount,
      }: {
        pos: THREE.Node<"vec3">;
        steppedToCameraAmount: THREE.Node<"float">;
      }) => {
        const adjustedPos = pos.add(vec3(0, 0, time.mul(0.015)));
        const wobble = mx_noise_float(
          adjustedPos.mul(uniforms.uBasePosFreq),
          time.mul(uniforms.uBaseTimeFreq),
        ).mul(uniforms.uBaseStrength);
        wobble.mulAssign(steppedToCameraAmount.mul(0.5));
        wobble.addAssign(0.5);
        return wobble;
      },
      {
        pos: "vec3",
        steppedToCameraAmount: "float",
        return: "float",
      },
    ),
  }));
  return null;
}

// const uniforms = {
//   // Orb
//   orbMass: new THREE.Uniform(5000.0),
//   orbDecayFactor: new THREE.Uniform(0.08),
//   // Misc.
//   uTime: new THREE.Uniform(0.0),
//   uBasePosFreq: new THREE.Uniform(3.15),
//   uBaseTimeFreq: new THREE.Uniform(0.02),
//   uBaseStrength: new THREE.Uniform(0.06),
//   // Hour
//   uHTime: new THREE.Uniform(0.0),
//   uHBasePosFreq: new THREE.Uniform(0.48),
//   uHBaseTimeFreq: new THREE.Uniform(0.08),
//   uHBaseStrength: new THREE.Uniform(0.04),
//   // Minute
//   uMTime: new THREE.Uniform(0.0),
//   uMBasePosFreq: new THREE.Uniform(1.06),
//   uMBaseTimeFreq: new THREE.Uniform(0.08),
//   uMBaseStrength: new THREE.Uniform(0.04),
//   // Second
//   uSTime: new THREE.Uniform(0.0),
//   uSBasePosFreq: new THREE.Uniform(3.28),
//   uSBaseTimeFreq: new THREE.Uniform(0.08),
//   uSBaseStrength: new THREE.Uniform(0.04),
// };

export default function Orb({
  position = [0, 0, 0],
}: {
  position?: [number, number, number];
}) {
  const formatHours24 = useAppStore((state) => state.formatHours24);
  // const reflectorRef = useRef<THREE.Mesh>(null!);
  // const csmRef = useRef<CSM<typeof THREE.MeshPhysicalMaterial>>(null!);
  // const csmDepthRef = useRef<CSM<typeof THREE.MeshDepthMaterial>>(null!);
  const orbRef = useRef<THREE.Mesh>(null!);

  const orbGeometry = useMemo(() => {
    const geometry = mergeVertices(new THREE.IcosahedronGeometry(2, 80));
    geometry.computeTangents();
    return geometry;
  }, []);

  const uniforms = useUniforms({
    // Orb
    orbMass: 5000.0,
    orbDecayFactor: 0.08,
    // Misc.
    uTime: 0.0,
    uBasePosFreq: 3.15,
    uBaseTimeFreq: 0.02,
    uBaseStrength: 0.06,
    // Hour
    uHTime: 0.0,
    uHBasePosFreq: 0.48,
    uHBaseTimeFreq: 0.08,
    uHBaseStrength: 0.04,
    // Minute
    uMTime: 0.0,
    uMBasePosFreq: 1.06,
    uMBaseTimeFreq: 0.08,
    uMBaseStrength: 0.04,
    // Second
    uSTime: 0.0,
    uSBasePosFreq: 3.28,
    uSBaseTimeFreq: 0.08,
    uSBaseStrength: 0.04,
  });

  const renderer = useThree((state) => state.renderer);

  useEffect(() => {
    // @ts-expect-error `createParameters` does exist.
    const gui = renderer.inspector?.createParameters("Orb");
    gui.add(uniforms.orbMass, "value", 0, 10000, 1).name("orbMass");
    gui
      .add(uniforms.orbDecayFactor, "value", 0, 1, 0.001)
      .name("orbDecayFactor");
    gui.add(uniforms.uBasePosFreq, "value", 0, 5, 0.01).name("uBasePosFreq");
    gui.add(uniforms.uBaseTimeFreq, "value", 0, 5, 0.01).name("uBaseTimeFreq");
    gui.add(uniforms.uBaseStrength, "value", 0, 5, 0.01).name("uBaseStrength");
    gui.add(uniforms.uHBasePosFreq, "value", 0, 5, 0.01).name("uHBasePosFreq");
    gui
      .add(uniforms.uHBaseTimeFreq, "value", 0, 5, 0.01)
      .name("uHBaseTimeFreq");
    gui
      .add(uniforms.uHBaseStrength, "value", 0, 5, 0.01)
      .name("uHBaseStrength");
    gui.add(uniforms.uMBasePosFreq, "value", 0, 5, 0.01).name("uMBasePosFreq");
    gui
      .add(uniforms.uMBaseTimeFreq, "value", 0, 5, 0.01)
      .name("uMBaseTimeFreq");
    gui
      .add(uniforms.uMBaseStrength, "value", 0, 5, 0.01)
      .name("uMBaseStrength");
    gui.add(uniforms.uSBasePosFreq, "value", 0, 5, 0.01).name("uSBasePosFreq");
    gui
      .add(uniforms.uSBaseTimeFreq, "value", 0, 5, 0.01)
      .name("uSBaseTimeFreq");
    gui
      .add(uniforms.uSBaseStrength, "value", 0, 5, 0.01)
      .name("uSBaseStrength");

    return () => gui.destroy?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [renderer]);

  // const mirror = useMemo(() => {
  //   const reflector = new Reflector(orbGeometry, {
  //     textureWidth: 2048,
  //     textureHeight: 2048,
  //   });
  //   reflector.forceUpdate = true;
  //   return reflector;
  // }, [orbGeometry]);

  const orbLayers = useMemo(() => {
    const layers = new THREE.Layers();
    layers.set(1);
    return layers;
  }, []);
  // const reflectorLayers = useMemo(() => {
  //   const layers = new THREE.Layers();
  //   return layers;
  // }, []);

  // Sort of mimicking the Hand spring velocities, but without the large
  // jumps when going from full hand length to zero. Helps achieve the
  // tick effect on the orb each time the hand lengths change.
  const hSpringLocal = useSpring(0, {
    ...SPRING_CONFIGS.shared,
    ...SPRING_CONFIGS.h,
  });
  const mSpringLocal = useSpring(0, {
    ...SPRING_CONFIGS.shared,
    ...SPRING_CONFIGS.m,
  });
  const sSpringLocal = useSpring(0, {
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

  // const controlValues = {
  //   orbMass: 5000,
  //   orbDecayFactor: 0.08,
  //   uBasePosFreq: uniforms.uBasePosFreq.value,
  //   uBaseTimeFreq: uniforms.uBaseTimeFreq.value,
  //   uBaseStrength: uniforms.uBaseStrength.value,
  //   uHBasePosFreq: uniforms.uHBasePosFreq.value,
  //   uHBaseTimeFreq: uniforms.uHBaseTimeFreq.value,
  //   uHBaseStrength: uniforms.uHBaseStrength.value,
  //   uMBasePosFreq: uniforms.uMBasePosFreq.value,
  //   uMBaseTimeFreq: uniforms.uMBaseTimeFreq.value,
  //   uMBaseStrength: uniforms.uMBaseStrength.value,
  //   uSBasePosFreq: uniforms.uSBasePosFreq.value,
  //   uSBaseTimeFreq: uniforms.uSBaseTimeFreq.value,
  //   uSBaseStrength: uniforms.uSBaseStrength.value,
  // };

  // const controlValues = useControls({
  //   // Orb
  //   orbMass: {
  //     value: 5000,
  //     min: 0,
  //     max: 10000,
  //     step: 1,
  //   },
  //   orbDecayFactor: {
  //     value: 0.08,
  //     min: 0,
  //     max: 1,
  //     step: 0.001,
  //   },
  //   // Time
  //   uBasePosFreq: {
  //     value: uniforms.uBasePosFreq.value,
  //     min: 0,
  //     max: 5,
  //     step: 0.01,
  //   },
  //   uBaseTimeFreq: {
  //     value: uniforms.uBaseTimeFreq.value,
  //     min: 0,
  //     max: 5,
  //     step: 0.01,
  //   },
  //   uBaseStrength: {
  //     value: uniforms.uBaseStrength.value,
  //     min: 0,
  //     max: 5,
  //     step: 0.01,
  //   },
  //   // Hour
  //   uHBasePosFreq: {
  //     value: uniforms.uHBasePosFreq.value,
  //     min: 0,
  //     max: 5,
  //     step: 0.01,
  //   },
  //   uHBaseTimeFreq: {
  //     value: uniforms.uHBaseTimeFreq.value,
  //     min: 0,
  //     max: 5,
  //     step: 0.01,
  //   },
  //   uHBaseStrength: {
  //     value: uniforms.uHBaseStrength.value,
  //     min: 0,
  //     max: 5,
  //     step: 0.01,
  //   },
  //   // Minute
  //   uMBasePosFreq: {
  //     value: uniforms.uMBasePosFreq.value,
  //     min: 0,
  //     max: 5,
  //     step: 0.01,
  //   },
  //   uMBaseTimeFreq: {
  //     value: uniforms.uMBaseTimeFreq.value,
  //     min: 0,
  //     max: 5,
  //     step: 0.01,
  //   },
  //   uMBaseStrength: {
  //     value: uniforms.uMBaseStrength.value,
  //     min: 0,
  //     max: 5,
  //     step: 0.01,
  //   },
  //   // Second
  //   uSBasePosFreq: {
  //     value: uniforms.uSBasePosFreq.value,
  //     min: 0,
  //     max: 5,
  //     step: 0.01,
  //   },
  //   uSBaseTimeFreq: {
  //     value: uniforms.uSBaseTimeFreq.value,
  //     min: 0,
  //     max: 5,
  //     step: 0.01,
  //   },
  //   uSBaseStrength: {
  //     value: uniforms.uSBaseStrength.value,
  //     min: 0,
  //     max: 5,
  //     step: 0.01,
  //   },
  //   velocityRef: monitor(() => velocityRef.current, {
  //     graph: true,
  //     interval: 300,
  //   }),
  //   sVelocityRef: monitor(() => uSSpringVelocityDeltaRef.current, {
  //     graph: true,
  //     interval: 30,
  //   }),
  // });

  // const deltaRef = useRef(0);

  // const velocityRef = useRef(0.1);

  // useFrame(({ renderer, camera, scene }, delta) => {
  //   // General.
  //   deltaRef.current = Math.max(delta, 0.016);

  //   const hForce =
  //     (SPRING_CONFIGS.h.mass *
  //       2 *
  //       Math.max(
  //         Math.abs(uHSpringVelocityDeltaRef.current) - velocityRef.current,
  //         0,
  //       )) /
  //     deltaRef.current;
  //   const mForce =
  //     (SPRING_CONFIGS.m.mass *
  //       2 *
  //       Math.max(
  //         Math.abs(uMSpringVelocityDeltaRef.current) - velocityRef.current,
  //         0,
  //       )) /
  //     deltaRef.current;
  //   const sForce =
  //     (SPRING_CONFIGS.s.mass *
  //       2 *
  //       Math.max(
  //         Math.abs(uSSpringVelocityDeltaRef.current) - velocityRef.current,
  //         0,
  //       )) /
  //     deltaRef.current;

  //   velocityRef.current += (hForce + mForce + sForce) / uniforms.orbMass.value;
  //   velocityRef.current = Math.max(
  //     0,
  //     velocityRef.current *
  //       (1 - uniforms.orbDecayFactor.value * deltaRef.current),
  //   );

  //   // uTimeRef.current += velocityRef.current;
  //   // uHTimeRef.current += deltaRef.current + hSpringLocal.getVelocity();
  //   // uMTimeRef.current += deltaRef.current + mSpringLocal.getVelocity();
  //   // uSTimeRef.current += deltaRef.current + sSpringLocal.getVelocity();

  //   // uniforms.uTime.value = uTimeRef.current;
  //   // uniforms.uBasePosFreq.value = controlValues.uBasePosFreq;
  //   // uniforms.uBaseTimeFreq.value = controlValues.uBaseTimeFreq;
  //   // uniforms.uBaseStrength.value = controlValues.uBaseStrength;

  //   // uniforms.uHTime.value = uHTimeRef.current;
  //   // uniforms.uHBasePosFreq.value = controlValues.uHBasePosFreq;
  //   // uniforms.uHBaseTimeFreq.value = controlValues.uHBaseTimeFreq;
  //   // uniforms.uHBaseStrength.value = controlValues.uHBaseStrength;

  //   // uniforms.uMTime.value = uMTimeRef.current;
  //   // uniforms.uMBasePosFreq.value = controlValues.uMBasePosFreq;
  //   // uniforms.uMBaseTimeFreq.value = controlValues.uMBaseTimeFreq;
  //   // uniforms.uMBaseStrength.value = controlValues.uMBaseStrength;

  //   // uniforms.uSTime.value = uSTimeRef.current;
  //   // uniforms.uSBasePosFreq.value = controlValues.uSBasePosFreq;
  //   // uniforms.uSBaseTimeFreq.value = controlValues.uSBaseTimeFreq;
  //   // uniforms.uSBaseStrength.value = controlValues.uSBaseStrength;

  //   // Rendering logic.
  //   // camera.layers = reflectorLayers;
  //   // renderer.render(scene, camera);

  //   // if (reflectorRef.current && csmRef.current) {
  //   //   csmRef.current.uniforms.uTextureMatrix.value =
  //   //     // @ts-expect-error It's fine, don't worry about it.
  //   //     reflectorRef.current.material.uniforms["textureMatrix"].value;
  //   //   csmRef.current.uniforms.uTDiffuse.value =
  //   //     // @ts-expect-error It's fine, don't worry about it.
  //   //     reflectorRef.current.material.uniforms["tDiffuse"].value;
  //   // } else {
  //   //   console.log("no reflectorRef or csmRef");
  //   // }

  //   // camera.layers = orbLayers;
  //   // renderer.render(scene, camera);
  // });

  const { positionNode } = useLocalNodes(({ nodes }) => ({
    positionNode: positionLocal.add(
      normalLocal.mul(nodes.getWobble(positionLocal, 1)),
    ),
  }));

  return (
    <>
      <group position={position}>
        {/* <primitive
          ref={reflectorRef}
          object={mirror}
          layers={reflectorLayers}
        /> */}
        <mesh
          ref={orbRef}
          geometry={orbGeometry}
          castShadow
          receiveShadow
          layers={orbLayers}
        >
          <meshPhysicalNodeMaterial positionNode={positionNode} />
          {/* <CustomShaderMaterial
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
          /> */}
        </mesh>
      </group>
    </>
  );
}
