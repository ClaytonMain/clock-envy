import { useHelper } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useControls } from "leva";
import { useRef } from "react";
import * as THREE from "three";

export default function Lights() {
  const spotLightRef00 = useRef<THREE.SpotLight>(null!);
  const spotLightRef01 = useRef<THREE.SpotLight>(null!);
  const spotLightRef02 = useRef<THREE.SpotLight>(null!);
  const spotLightTargetRef00 = useRef<THREE.Object3D>(null);
  const spotLightTargetRef01 = useRef<THREE.Object3D>(null);
  const spotLightTargetRef02 = useRef<THREE.Object3D>(null);
  const helpersEnabled = true;
  useHelper(helpersEnabled && spotLightRef00, THREE.SpotLightHelper);
  useHelper(helpersEnabled && spotLightRef01, THREE.SpotLightHelper);
  useHelper(helpersEnabled && spotLightRef02, THREE.SpotLightHelper);

  const spotLight00Values = useControls("SpotLight 00", {
    positionX: { value: 0, min: -30, max: 30 },
    positionY: { value: 0, min: -30, max: 30 },
    positionZ: { value: -4.4, min: -30, max: 30 },
    targetX: { value: 0, min: -30, max: 30 },
    targetY: { value: 0, min: -30, max: 30 },
    targetZ: { value: 0, min: -30, max: 30 },
    angle: { value: 0.87, min: 0, max: Math.PI / 2 },
    penumbra: { value: 0.27, min: 0, max: 1 },
    decay: { value: 0.1, min: 0, max: 10 },
    intensity: { value: 10, min: 0, max: 50 },
    color: { value: "#31E981" },
    bias: { value: 0, min: 0, max: 0.05, step: 0.001 },
    normalBias: { value: 0, min: 0, max: 0.05, step: 0.001 },
  });
  const spotLight01Values = useControls("SpotLight 01", {
    positionX: { value: 0, min: -30, max: 30 },
    positionY: { value: -0.5, min: -30, max: 30 },
    positionZ: { value: -2, min: -30, max: 30 },
    targetX: { value: 0, min: -30, max: 30 },
    targetY: { value: 0, min: -30, max: 30 },
    targetZ: { value: -5, min: -30, max: 30 },
    angle: { value: 1.03, min: 0, max: Math.PI / 2 },
    penumbra: { value: 0.26, min: 0, max: 1 },
    decay: { value: 0.1, min: 0, max: 10 },
    intensity: { value: 2, min: 0, max: 50 },
    color: { value: "#31E981" },
    bias: { value: 0, min: 0, max: 0.05, step: 0.001 },
    normalBias: { value: 0.001, min: 0, max: 0.05, step: 0.001 },
  });
  const spotLight02Values = useControls("SpotLight 02", {
    positionX: { value: -1, min: -30, max: 30 },
    positionY: { value: 10, min: -30, max: 30 },
    positionZ: { value: 10, min: -30, max: 30 },
    targetX: { value: -0.5, min: -30, max: 30 },
    targetY: { value: 0, min: -30, max: 30 },
    targetZ: { value: 1, min: -30, max: 30 },
    angle: { value: 0.3, min: 0, max: Math.PI / 2 },
    penumbra: { value: 0.4, min: 0, max: 1 },
    decay: { value: 0.1, min: 0, max: 10 },
    intensity: { value: 4, min: 0, max: 50 },
    color: { value: "#31E981" },
    bias: { value: 0, min: 0, max: 0.05, step: 0.001 },
    normalBias: { value: 0.002, min: 0, max: 0.05, step: 0.001 },
  });

  useFrame(() => {
    if (
      spotLightTargetRef00.current &&
      spotLightTargetRef01.current &&
      spotLightTargetRef02.current
    ) {
      spotLightRef00.current.target = spotLightTargetRef00.current;
      spotLightRef01.current.target = spotLightTargetRef01.current;
      spotLightRef02.current.target = spotLightTargetRef02.current;
    }
  });

  return (
    <>
      <spotLight
        ref={spotLightRef00}
        position={[
          spotLight00Values.positionX,
          spotLight00Values.positionY,
          spotLight00Values.positionZ,
        ]}
        color={spotLight00Values.color}
        intensity={spotLight00Values.intensity}
        angle={spotLight00Values.angle}
        penumbra={spotLight00Values.penumbra}
        decay={spotLight00Values.decay}
        shadow-camera-near={0.01}
        shadow-camera-far={20}
        shadow-camera-fov={spotLight00Values.angle}
        shadow-camera-bias={spotLight00Values.bias}
        shadow-normalBias={spotLight00Values.normalBias}
        castShadow
      />
      <spotLight
        ref={spotLightRef01}
        position={[
          spotLight01Values.positionX,
          spotLight01Values.positionY,
          spotLight01Values.positionZ,
        ]}
        color={spotLight01Values.color}
        intensity={spotLight01Values.intensity}
        angle={spotLight01Values.angle}
        penumbra={spotLight01Values.penumbra}
        decay={spotLight01Values.decay}
        shadow-camera-near={0.01}
        shadow-camera-far={20}
        shadow-camera-fov={spotLight01Values.angle}
        shadow-camera-bias={spotLight01Values.bias}
        shadow-normalBias={spotLight01Values.normalBias}
        castShadow
      />
      <spotLight
        ref={spotLightRef02}
        position={[
          spotLight02Values.positionX,
          spotLight02Values.positionY,
          spotLight02Values.positionZ,
        ]}
        color={spotLight02Values.color}
        intensity={spotLight02Values.intensity}
        angle={spotLight02Values.angle}
        penumbra={spotLight02Values.penumbra}
        decay={spotLight02Values.decay}
        shadow-camera-near={0.01}
        shadow-camera-far={20}
        shadow-camera-fov={spotLight02Values.angle}
        shadow-camera-bias={spotLight02Values.bias}
        shadow-normalBias={spotLight02Values.normalBias}
        castShadow
      />
      <object3D
        ref={spotLightTargetRef00}
        position={[
          spotLight00Values.targetX,
          spotLight00Values.targetY,
          spotLight00Values.targetZ,
        ]}
      />
      <object3D
        ref={spotLightTargetRef01}
        position={[
          spotLight01Values.targetX,
          spotLight01Values.targetY,
          spotLight01Values.targetZ,
        ]}
      />
      <object3D
        ref={spotLightTargetRef02}
        position={[
          spotLight02Values.targetX,
          spotLight02Values.targetY,
          spotLight02Values.targetZ,
        ]}
      />
    </>
  );
}
