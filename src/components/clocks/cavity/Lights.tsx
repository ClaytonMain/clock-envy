import { useHelper } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import useCavityStore from "../../../stores/useCavityStore";

export default function Lights() {
  const spotLight00Position: [number, number, number] = [0, 0, -1.8];
  const spotLight01Position: [number, number, number] = [0, -1.5, -0.2];
  const spotLight02Position: [number, number, number] = [-1, 10, 10];
  const spotLightRef00 = useRef<THREE.SpotLight>(null!);
  const spotLightRef01 = useRef<THREE.SpotLight>(null!);
  const spotLightRef02 = useRef<THREE.SpotLight>(null!);
  const spotLightTargetRef00 = useRef<THREE.Object3D>(null);
  const spotLightTargetRef01 = useRef<THREE.Object3D>(null);
  const spotLightTargetRef02 = useRef<THREE.Object3D>(null);
  const helpersEnabled = false;
  useHelper(helpersEnabled && spotLightRef00, THREE.SpotLightHelper);
  useHelper(helpersEnabled && spotLightRef01, THREE.SpotLightHelper);
  useHelper(helpersEnabled && spotLightRef02, THREE.SpotLightHelper);

  useEffect(() => {
    const unsubPrimaryColor = useCavityStore.subscribe(
      (state) => state.primaryColor,
      (color) => {
        console.log("Updating spotlight color to", color);
        if (spotLightRef00.current) {
          spotLightRef00.current.color = color;
        }
        if (spotLightRef01.current) {
          spotLightRef01.current.color = color;
        }
        if (spotLightRef02.current) {
          spotLightRef02.current.color = color;
        }
      },
    );
    return () => {
      unsubPrimaryColor();
    };
  }, []);

  const { angleOffsets, speeds } = useMemo(() => {
    return {
      angleOffsets: [
        Math.random() * Math.PI * 2,
        Math.random() * Math.PI * 2,
        Math.random() * Math.PI * 2,
      ],
      speeds: [
        0.1 + Math.random() * 0.1,
        0.1 + Math.random() * 0.1,
        0.1 + Math.random() * 0.1,
      ],
    };
  }, []);

  const timeRef = useRef(0);
  useFrame((_, delta) => {
    timeRef.current += Math.min(delta, 0.1);
    spotLightRef00.current.position.x =
      spotLight00Position[0] +
      Math.cos(timeRef.current * speeds[0] + angleOffsets[0]) * 0.1;
    spotLightRef00.current.position.y =
      spotLight00Position[1] +
      Math.sin(timeRef.current * speeds[0] + angleOffsets[0]) * 0.1;
    spotLightRef01.current.position.x =
      spotLight01Position[0] +
      Math.cos(timeRef.current * speeds[1] + angleOffsets[1]) * 0.1;
    spotLightRef01.current.position.y =
      spotLight01Position[1] +
      Math.sin(timeRef.current * speeds[1] + angleOffsets[1]) * 0.1;
    spotLightRef02.current.position.x =
      spotLight02Position[0] +
      Math.cos(timeRef.current * speeds[2] + angleOffsets[2]) * 0.1;
    spotLightRef02.current.position.y =
      spotLight02Position[1] +
      Math.sin(timeRef.current * speeds[2] + angleOffsets[2]) * 0.1;
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
        position={spotLight00Position}
        color={useCavityStore.getState().primaryColor}
        intensity={10}
        angle={1.21}
        penumbra={0.27}
        decay={0.1}
        shadow-camera-near={0.01}
        shadow-camera-far={20}
        shadow-camera-fov={1.21}
        shadow-normalBias={0.001}
        castShadow
      />
      <spotLight
        ref={spotLightRef01}
        position={spotLight01Position}
        color={useCavityStore.getState().primaryColor}
        intensity={2}
        angle={1.23}
        penumbra={0.26}
        decay={0.1}
        shadow-camera-near={0.01}
        shadow-camera-far={20}
        shadow-camera-fov={1.03}
        shadow-normalBias={0.001}
        castShadow
      />
      <spotLight
        ref={spotLightRef02}
        position={spotLight02Position}
        color={useCavityStore.getState().primaryColor}
        intensity={4}
        angle={0.3}
        penumbra={0.4}
        decay={0.1}
        shadow-camera-near={5}
        shadow-camera-far={20}
        shadow-camera-fov={0.3}
        shadow-normalBias={0.002}
        shadow-mapSize={new THREE.Vector2(1024, 1024)}
        castShadow
      />
      <object3D ref={spotLightTargetRef00} position={[0, 0, 0]} />
      <object3D ref={spotLightTargetRef01} position={[0, -1.5, -2]} />
      <object3D ref={spotLightTargetRef02} position={[-0.5, 0, 0]} />
    </>
  );
}
