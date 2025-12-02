import { Cylinder, Text } from "@react-three/drei";
import { useMemo } from "react";
import * as THREE from "three";
import { mergeVertices } from "three/addons/utils/BufferGeometryUtils.js";

// https://gm1sxx.blogspot.com/2020/07/the-anatomy-of-nixie-tube.html

const FONT_URL_THIN = "./fonts/Roboto_Mono/static/RobotoMono-Thin.ttf";
const FONT_URL_EXTRA_LIGHT =
  "./fonts/Roboto_Mono/static/RobotoMono-ExtraLight.ttf";
const DIGIT_Z_ORDER = [4, 9, 8, 0, 3, 5, 2, 7, 1, 6];

function Glass() {
  const glassGeometry = useMemo(() => {
    const points = [];
    // points.push(new THREE.Vector2(0.0, 1.0));
    // points.push(new THREE.Vector2(0.009, 0.998));
    // points.push(new THREE.Vector2(0.0197, 0.989));
    // points.push(new THREE.Vector2(0.022, 0.98));
    // points.push(new THREE.Vector2(0.0245, 0.97));
    // points.push(new THREE.Vector2(0.028, 0.948));
    // points.push(new THREE.Vector2(0.035, 0.94));
    // points.push(new THREE.Vector2(0.05, 0.934));
    // points.push(new THREE.Vector2(0.072, 0.928));
    // points.push(new THREE.Vector2(0.1, 0.92));
    // points.push(new THREE.Vector2(0.15, 0.9));
    // points.push(new THREE.Vector2(0.195, 0.87));
    // points.push(new THREE.Vector2(0.24, 0.82));
    // points.push(new THREE.Vector2(0.26, 0.77));
    // points.push(new THREE.Vector2(0.26, 0.6));
    // points.push(new THREE.Vector2(0.26, 0.5));
    // points.push(new THREE.Vector2(0.26, 0.5));
    // points.push(new THREE.Vector2(0.26, 0.4));
    // points.push(new THREE.Vector2(0.26, 0.3));
    // points.push(new THREE.Vector2(0.26, 0.2));
    // points.push(new THREE.Vector2(0.26, 0.1));
    // points.push(new THREE.Vector2(0.26, 0.0));
    // Return
    points.push(new THREE.Vector2(0.22, 0.0));
    points.push(new THREE.Vector2(0.22, 0.1));
    points.push(new THREE.Vector2(0.22, 0.2));
    points.push(new THREE.Vector2(0.22, 0.3));
    points.push(new THREE.Vector2(0.22, 0.4));
    points.push(new THREE.Vector2(0.22, 0.5));
    points.push(new THREE.Vector2(0.22, 0.6));
    points.push(new THREE.Vector2(0.22, 0.7));
    points.push(new THREE.Vector2(0.22, 0.77));
    points.push(new THREE.Vector2(0.21, 0.795));
    points.push(new THREE.Vector2(0.195, 0.82));
    points.push(new THREE.Vector2(0.175, 0.84));
    points.push(new THREE.Vector2(0.13, 0.866));
    points.push(new THREE.Vector2(0.07, 0.89));
    points.push(new THREE.Vector2(0, 0.897));
    points.reverse();
    const geometry = new THREE.LatheGeometry(points, 32);
    return mergeVertices(geometry);
  }, []);

  return (
    <mesh geometry={glassGeometry}>
      {/* <meshStandardMaterial color="white" /> */}
      <meshNormalMaterial />
    </mesh>
  );
}

function Digit({
  displayIndex,
  character,
  zPosition,
}: {
  displayIndex: number;
  character: string;
  zPosition: number;
}) {
  return (
    <>
      <Text
        font={FONT_URL_THIN}
        position={[0, 0, zPosition]}
        characters={character}
        fontSize={0.55}
      >
        {character}
        <meshStandardMaterial color={"#333"} metalness={0.7} roughness={0.7} />
      </Text>
      <Text
        font={FONT_URL_EXTRA_LIGHT}
        position={[0, 0, zPosition - 0.001]}
        characters={character}
        fontSize={0.57}
        lineHeight={0.98}
      >
        {character}
        <meshBasicMaterial color={"#ffaa00"} />
      </Text>
    </>
  );
}

function Digits({ displayIndex }: { displayIndex: number }) {
  return (
    <group position={[0, 0.4, 0]}>
      {DIGIT_Z_ORDER.map((zIndex, digit) => (
        <Digit
          key={digit}
          displayIndex={displayIndex}
          character={digit.toString()}
          zPosition={(zIndex - 4) * 0.02}
        />
      ))}
    </group>
  );
}

function Plate() {
  return <Cylinder args={[0.21, 0.21, 0.005, 32, 1]} position={[0, 0.13, 0]} />;
}

function Posts() {
  return null;
}

function Backing() {
  return null;
}

function Screen() {
  return null;
}

export default function Tube({
  displayIndex,
  position = [0, 0, 0],
}: {
  displayIndex: number;
  position?: [number, number, number];
}) {
  return (
    <group position={position}>
      <Glass />
      <Digits displayIndex={displayIndex} />
      <Plate />
      <Posts />
      <Backing />
      <Screen />
    </group>
  );
}
