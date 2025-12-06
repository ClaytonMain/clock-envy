import {
  MeshTransmissionMaterial,
  Text,
  type TextProps,
} from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useSpring } from "motion/react";
import { useEffect, useRef } from "react";
import * as THREE from "three";
import useAppStore from "../../../stores/useAppStore";

// https://gm1sxx.blogspot.com/2020/07/the-anatomy-of-nixie-tube.html

const FONT_URL_THIN = "./fonts/Roboto_Mono/static/RobotoMono-Thin.ttf";
const DIGIT_Z_ORDER = [4, 9, 8, 0, 3, 5, 2, 7, 1, 6];
const DIGIT_Z_SPACE = 0.01;
// const DIGIT_Z_ORDER = [4];

const MAX_LIGHT_INTENSITY = 1;

const ACTIVE_VALUES = {
  outlineBlur: 0.03,
  outlineColor: "#ff6741",
  outlineOpacity: 1,
  outlineWidth: 0.02,
};

const SPRING_CONFIGS = {
  shared: {
    stiffness: 500,
    damping: 40,
  },
};

function Glass({ glassGeometry }: { glassGeometry: THREE.BufferGeometry }) {
  return (
    <mesh geometry={glassGeometry}>
      {/* <meshStandardMaterial color="white" /> */}
      {/* <meshNormalMaterial /> */}
      <MeshTransmissionMaterial
        // clearcoatRoughness={0.6}
        // clearcoat={0.6}
        reflectivity={0.2}
        roughness={0.1}
        // distortion={10}
        // distortionScale={1000}
        // anisotropicBlur={1}
        // transmissionSampler
      />
    </mesh>
  );
}

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
  // const materialRef = useRef<THREE.MeshBasicMaterial>(null!);
  const outlineOpacity = useSpring(
    getIsActiveCharacter(displayIndex, character)
      ? ACTIVE_VALUES.outlineOpacity
      : 0,
    SPRING_CONFIGS.shared,
  );
  // const textColor = useSpring(
  //   getIsActiveCharacter(displayIndex, character) ? "#ff6741" : "#333",
  //   SPRING_CONFIGS.shared,
  // );

  useEffect(() => {
    const unsubCurrentTimeValue = useAppStore.subscribe(
      (state) => state.currentTimeValue,
      (value, previous) => {
        const formattedValue = value.toFormat("HH:mm:ss");
        const formattedPrevious = previous.toFormat("HH:mm:ss");
        if (formattedValue === formattedPrevious) return;
        if (formattedValue.charAt(displayIndex) === character) {
          outlineOpacity.set(ACTIVE_VALUES.outlineOpacity);
          // materialRef.current.color.set("#ff6741");
          // textColor.set("#ff6741");
        } else {
          outlineOpacity.set(0);
          // materialRef.current.color.set("#333");
          // textColor.set("#333");
        }
      },
    );
    return () => {
      unsubCurrentTimeValue();
    };
  }, [character, displayIndex, outlineOpacity]);

  useFrame(() => {
    textRef.current!.outlineOpacity = outlineOpacity.get();
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
        {/* <meshBasicMaterial ref={materialRef} color={"#333"} /> */}
        <meshStandardMaterial
          color={"#333"}
          opacity={0.8}
          // transparent={false}
          emissive={"#ff6741"}
          emissiveIntensity={0.02}
        />
        {/* <MeshTransmissionMaterial
          color={"#333"}
          emissive={"#ff6741"}
          emissiveIntensity={0.9}
          transmissionSampler
        /> */}
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
          zPosition={(zIndex - 4) * DIGIT_Z_SPACE}
        />
      ))}
    </group>
  );
}

function Plate() {
  // return <Cylinder args={[0.21, 0.21, 0.005, 32, 1]} position={[0, 0.13, 0]} />;
  return null;
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

function Lights({ displayIndex }: { displayIndex: number }) {
  const lightGroup00Ref = useRef<THREE.Group>(null!);
  const lightGroup01Ref = useRef<THREE.Group>(null!);

  const light0000Ref = useRef<THREE.PointLight>(null!);
  // const light0001Ref = useRef<THREE.RectAreaLight>(null!);
  const light0100Ref = useRef<THREE.PointLight>(null!);
  // const light0101Ref = useRef<THREE.RectAreaLight>(null!);

  const light00Intensity = useSpring(0, SPRING_CONFIGS.shared);
  const light01Intensity = useSpring(0, SPRING_CONFIGS.shared);

  const displayingRef = useRef<0 | 1>(0);

  const initializedRef = useRef(false);

  useEffect(() => {
    const unsubCurrentTimeValue = useAppStore.subscribe(
      (state) => state.currentTimeValue,
      (value, previousValue) => {
        const char = value.toFormat("HH:mm:ss").charAt(displayIndex);
        const previousChar = previousValue
          .toFormat("HH:mm:ss")
          .charAt(displayIndex);

        if (char === previousChar && initializedRef.current) return;

        if (!initializedRef.current) initializedRef.current = true;

        const newDisplaying = ((displayingRef.current + 1) % 2) as 0 | 1;
        displayingRef.current = newDisplaying;

        if (newDisplaying === 0) {
          lightGroup00Ref.current.position.z =
            (DIGIT_Z_ORDER[parseInt(char)] - 4) * DIGIT_Z_SPACE;
          light00Intensity.set(MAX_LIGHT_INTENSITY);

          light01Intensity.set(0);
        } else {
          lightGroup01Ref.current.position.z =
            (DIGIT_Z_ORDER[parseInt(char)] - 4) * DIGIT_Z_SPACE;
          light01Intensity.set(MAX_LIGHT_INTENSITY);

          light00Intensity.set(0);
        }
      },
    );
    return () => {
      unsubCurrentTimeValue();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useFrame(() => {
    light0000Ref.current.intensity = light00Intensity.get();
    // light0001Ref.current.intensity = light00Intensity.get();
    light0100Ref.current.intensity = light01Intensity.get();
    // light0101Ref.current.intensity = light01Intensity.get();
    if (light00Intensity.get() < 0.01) {
      light0000Ref.current.visible = false;
      // light0001Ref.current.visible = false;
    } else {
      light0000Ref.current.visible = true;
      // light0001Ref.current.visible = true;
    }
    if (light01Intensity.get() < 0.01) {
      light0100Ref.current.visible = false;
      // light0101Ref.current.visible = false;
    } else {
      light0100Ref.current.visible = true;
      // light0101Ref.current.visible = true;
    }
  });

  return (
    <>
      <group ref={lightGroup00Ref} position={[0, 0.4, 0]}>
        <pointLight
          ref={light0000Ref}
          color={"#ff6741"}
          intensity={MAX_LIGHT_INTENSITY}
          visible={true}
          position={[0, -0.01, DIGIT_Z_SPACE / 2]}
          // width={0.35}
          // height={0.5}
        />
        {/* <rectAreaLight
          ref={light0001Ref}
          intensity={MAX_LIGHT_INTENSITY}
          visible={true}
          position={[0, -0.01, -DIGIT_Z_SPACE / 4]}
          rotation={[0, Math.PI, 0]}
          width={0.35}
          height={0.5}
        /> */}
      </group>
      <group ref={lightGroup01Ref} position={[0, 0.4, 0]}>
        <pointLight
          ref={light0100Ref}
          color={"#ff6741"}
          intensity={0}
          visible={false}
          position={[0, -0.01, DIGIT_Z_SPACE / 2]}
          // width={0.35}
          // height={0.5}
        />
        {/* <rectAreaLight
          ref={light0101Ref}
          intensity={0}
          visible={false}
          position={[0, -0.01, -DIGIT_Z_SPACE / 4]}
          rotation={[0, Math.PI, 0]}
          width={0.35}
          height={0.5}
        /> */}
      </group>
    </>
  );
}

export default function Tube({
  displayIndex,
  position = [0, 0, 0],
  glassGeometry,
}: {
  displayIndex: number;
  position?: [number, number, number];
  glassGeometry: THREE.BufferGeometry;
}) {
  return (
    <group position={position}>
      <Glass glassGeometry={glassGeometry} />
      <Digits displayIndex={displayIndex} />
      <Plate />
      <Posts />
      <Backing />
      <Screen />
      <Lights displayIndex={displayIndex} />
    </group>
  );
}
