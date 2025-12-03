import { Cylinder, Text, type TextProps } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useSpring } from "motion/react";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
// import { RectAreaLightHelper } from "three/addons/helpers/RectAreaLightHelper.js";
import { mergeVertices } from "three/addons/utils/BufferGeometryUtils.js";
import useAppStore from "../../../stores/useAppStore";

// https://gm1sxx.blogspot.com/2020/07/the-anatomy-of-nixie-tube.html

const FONT_URL_THIN = "./fonts/Roboto_Mono/static/RobotoMono-Thin.ttf";
const DIGIT_Z_ORDER = [4, 9, 8, 0, 3, 5, 2, 7, 1, 6];
const DIGIT_Z_SPACE = 0.02;
// const DIGIT_Z_ORDER = [4];

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

const ACTIVE_VALUES = {
  outlineBlur: 0.03,
  outlineColor: "#ff6741",
  outlineOpacity: 1,
  outlineWidth: 0.03,
};

function getIsActiveCharacter(displayIndex: number, character: string) {
  const currentChar = useAppStore
    .getState()
    .currentTimeValue.toFormat("HH:mm:ss")
    .charAt(displayIndex);
  return currentChar === character;
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
  const textRef = useRef<TextProps>(null!);
  const light01Ref = useRef<THREE.RectAreaLight>(null!);
  const light02Ref = useRef<THREE.RectAreaLight>(null!);
  const activeRef = useRef(getIsActiveCharacter(displayIndex, character));
  const outlineOpacity = useSpring(
    activeRef.current ? ACTIVE_VALUES.outlineOpacity : 0,
    { stiffness: 500, damping: 40 },
  );

  useEffect(() => {
    const unsubCurrentTimeValue = useAppStore.subscribe(
      (state) => state.currentTimeValue,
      (value, previous) => {
        const formattedValue = value.toFormat("HH:mm:ss");
        const formattedPrevious = previous.toFormat("HH:mm:ss");
        if (formattedValue === formattedPrevious) return;
        if (formattedValue.charAt(displayIndex) === character) {
          activeRef.current = true;
          outlineOpacity.set(ACTIVE_VALUES.outlineOpacity);
        } else {
          outlineOpacity.set(0);
        }
      },
    );
    return () => {
      unsubCurrentTimeValue();
    };
  }, [character, displayIndex, outlineOpacity]);

  useFrame(() => {
    textRef.current!.outlineOpacity = outlineOpacity.get();
    if (
      outlineOpacity.get() < 0.01 &&
      (outlineOpacity.getPrevious() || 0) >= 0.01 &&
      activeRef.current
    ) {
      activeRef.current = false;

      // light01Ref.current.intensity = 0;
      // light02Ref.current.intensity = 0;

      // light01Ref.current.visible = false;
      // light02Ref.current.visible = false;
    }
    if (activeRef.current) {
      // if (!light01Ref.current.visible || !light02Ref.current.visible) {
      //   light01Ref.current.visible = true;
      //   light02Ref.current.visible = true;
      // }
      // light01Ref.current.intensity = 1 * outlineOpacity.get();
      // light02Ref.current.intensity = 1 * outlineOpacity.get();
    }
  });

  return (
    <>
      <Text
        ref={textRef}
        onClick={() => console.log(textRef.current)}
        font={FONT_URL_THIN}
        position={[0, 0, zPosition]}
        characters={character}
        fontSize={0.55}
        outlineBlur={ACTIVE_VALUES.outlineBlur}
        outlineColor={ACTIVE_VALUES.outlineColor}
        outlineOpacity={outlineOpacity.get()}
        outlineWidth={ACTIVE_VALUES.outlineWidth}
      >
        {character}
        <meshStandardMaterial color={"#333"} />
      </Text>
      {/* <rectAreaLight
        ref={light01Ref}
        visible={false}
        intensity={0}
        position={[0, -0.01, zPosition + DIGIT_Z_SPACE / 4]}
        width={0.35}
        height={0.5}
      />
      <rectAreaLight
        ref={light02Ref}
        visible={false}
        intensity={0}
        position={[0, -0.01, zPosition + DIGIT_Z_SPACE / 4]}
        rotation={[0, Math.PI, 0]}
        width={0.35}
        height={0.5}
      /> */}
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
          zPosition={(zIndex - 4) * DIGIT_Z_SPACE}
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
