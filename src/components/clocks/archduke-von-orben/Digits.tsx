import { Text } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { DateTime } from "luxon";
import { useSpring } from "motion/react";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import useAppStore from "../../../stores/useAppStore";
import { SPRING_CONFIGS } from "./constants/constants";

function getDigitSpace(index: number, digitSpace: number, colonSpace: number) {
  const adjustedIndex = Math.floor(Math.abs(index - 3.5));
  const sign = index - 3.5 >= 0 ? 1 : -1;
  return (
    sign *
    (digitSpace / 2 +
      Math.min(adjustedIndex, 2) * colonSpace +
      Math.floor(adjustedIndex / 3) * digitSpace)
  );
}

// const fontUrl = "./fonts/roboto_mono/static/RobotoMono-Regular.ttf";
const fontUrl = "./fonts/Six_Caps/SixCaps-Regular.ttf";
const characters = "0123456789:";

function getPresence(
  index: number,
  modTwo: 0 | 1,
  currentTimeValue?: DateTime,
  secretThirdOption = false,
) {
  if (!currentTimeValue) {
    currentTimeValue = useAppStore.getState().currentTimeValue;
  }
  // This function will never be called for the semicolons.
  // Can treat all characters as digits.
  const charAtIndex = currentTimeValue.toFormat("HH:mm:ss").charAt(index);
  const valueAtIndex = parseInt(charAtIndex);
  if (index === 0) {
    if (secretThirdOption) {
      return valueAtIndex === 2 ? 1 : 0;
    } else if (modTwo === 0 && valueAtIndex === 0) {
      return 1;
    } else if (modTwo === 1 && valueAtIndex === 1) {
      return 1;
    }
    return 0;
  }
  return valueAtIndex % 2 === modTwo ? 1 : 0;
}

function getSpringConfig(index: number) {
  if ([0, 1].includes(index)) {
    return {
      ...SPRING_CONFIGS.shared,
      ...SPRING_CONFIGS.h,
    };
  } else if ([3, 4].includes(index)) {
    return {
      ...SPRING_CONFIGS.shared,
      ...SPRING_CONFIGS.m,
    };
  } else if ([6, 7].includes(index)) {
    return {
      ...SPRING_CONFIGS.shared,
      ...SPRING_CONFIGS.s,
    };
  } else {
    return SPRING_CONFIGS.shared;
  }
}

function Char({
  index,
  modTwo,
  distance = 0.15,
  fadeSpeed = 3,
  secretThirdOption = false,
}: {
  index: number;
  modTwo: 0 | 1;
  distance?: number;
  fadeSpeed?: number;
  secretThirdOption?: boolean;
}) {
  const isSemicolon = [2, 5].includes(index);
  const [char, setChar] = useState(
    isSemicolon
      ? ":"
      : useAppStore
          .getState()
          .currentTimeValue.toFormat("HH:mm:ss")
          .charAt(index),
  );
  const presenceRef = useRef<number>(
    isSemicolon ? 1 : getPresence(index, modTwo, undefined, secretThirdOption),
  );
  const yOffset = useSpring(
    isSemicolon ? 0 : ((presenceRef.current + 1) % 2) * distance,
    getSpringConfig(index),
  );
  const opacityRef = useRef<number>(presenceRef.current === 1 ? 1 : 0);
  const presenceStateRef = useRef<
    "present" | "entering" | "exiting" | "waiting"
  >(presenceRef.current === 1 ? "present" : "waiting");

  const charRef = useRef<THREE.Mesh>(null!);
  const materialRef = useRef<THREE.MeshStandardMaterial>(null!);

  useEffect(() => {
    const unsubCurrentTimeValue = useAppStore.subscribe(
      (state) => state.currentTimeValue,
      (value) => {
        if (isSemicolon) return;
        const newPresence = getPresence(
          index,
          modTwo,
          value,
          secretThirdOption,
        );
        if (newPresence !== presenceRef.current) {
          presenceRef.current = newPresence;
          if (newPresence === 1) {
            setTimeout(
              () => {
                setChar(value.toFormat("HH:mm:ss").charAt(index));
                presenceStateRef.current = "entering";
                charRef.current.position.z = 0;
                yOffset.set(0);
              },
              [0, 3, 6].includes(index) ? 100 : 0,
            );
          } else {
            setTimeout(
              () => {
                presenceStateRef.current = "exiting";
                charRef.current.position.z = 0.01;
                yOffset.set(-distance);
              },
              [0, 3, 6].includes(index) ? 100 : 0,
            );
          }
        }
      },
    );
    return () => {
      unsubCurrentTimeValue();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useFrame((_, delta) => {
    if (presenceStateRef.current === "entering") {
      opacityRef.current = Math.min(opacityRef.current + delta * fadeSpeed, 1);
      if (opacityRef.current === 1) {
        presenceStateRef.current = "present";
      }
    } else if (presenceStateRef.current === "exiting") {
      opacityRef.current = Math.max(
        opacityRef.current - delta * fadeSpeed * 1.1,
        0,
      );
      if (opacityRef.current === 0) {
        presenceStateRef.current = "waiting";
        yOffset.jump(distance);
      }
    }

    materialRef.current.opacity = opacityRef.current;
    charRef.current.position.y = yOffset.get();
  });

  return (
    <Text ref={charRef} font={fontUrl} characters={characters}>
      {char}
      <meshStandardMaterial
        ref={materialRef}
        color={"#deeadd"}
        emissive={"#deeadd"}
        emissiveIntensity={0.5}
        side={THREE.BackSide}
      />
    </Text>
  );
}

function ClockPositionCharGroup({ index }: { index: number }) {
  const position = useMemo(() => {
    const x = getDigitSpace(index, 0.2, 0.16);
    return [x, 0, 0] as [number, number, number];
  }, [index]);

  return (
    <group position={position}>
      <Char index={index} modTwo={0} />
      {![2, 5].includes(index) && <Char index={index} modTwo={1} />}
      {index === 0 && (
        <Char index={index} modTwo={0} secretThirdOption={true} />
      )}
    </group>
  );
}

export default function Digits({
  position,
}: {
  position: [number, number, number];
}) {
  const textLayers = useMemo(() => {
    const layers = new THREE.Layers();
    return layers;
  }, []);

  return (
    <group position={position} scale={[0.6, 0.6, 1]} layers={textLayers}>
      {Array.from({ length: 8 }).map((_, index) => {
        return <ClockPositionCharGroup key={`digit-${index}`} index={index} />;
      })}
    </group>
  );
}
