import { Text } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
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

// const FONT_URL = "./fonts/Roboto_Mono/static/RobotoMono-Regular.ttf";
// const FONT_URL = "./fonts/Six_Caps/SixCaps-Regular.ttf";
const FONT_URL = "./fonts/Teko/static/Teko-Light.ttf";
const CHARACTERS = "0123456789:";

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
  distance = 0,
  fadeSpeed = 10,
}: {
  index: number;
  distance?: number;
  fadeSpeed?: number;
}) {
  const isSemicolon = [2, 5].includes(index);

  const groupPosition = useMemo(() => {
    const x = getDigitSpace(index, 0.062, 0.042);
    return [x, 0, 0] as [number, number, number];
  }, [index]);

  const [text00Char, setText00Char] = useState(
    isSemicolon
      ? ":"
      : useAppStore
          .getState()
          .currentTimeValue.toFormat("HH:mm:ss")
          .charAt(index),
  );
  const [text01Char, setText01Char] = useState(
    isSemicolon
      ? ":"
      : useAppStore
          .getState()
          .currentTimeValue.toFormat("HH:mm:ss")
          .charAt(index),
  );

  const text00Ref = useRef<THREE.Mesh>(null!);
  const text01Ref = useRef<THREE.Mesh>(null!);

  const material00Ref = useRef<THREE.MeshStandardMaterial>(null!);
  const material01Ref = useRef<THREE.MeshStandardMaterial>(null!);

  const displayingRef = useRef<0 | 1>(0);

  const text00YOffset = useSpring(0, getSpringConfig(index));
  const text01YOffset = useSpring(distance, getSpringConfig(index));

  const opacity00Ref = useRef<number>(1);
  const opacity01Ref = useRef<number>(0);

  const presence00StateRef = useRef<
    "present" | "entering" | "exiting" | "waiting"
  >("present");
  const presence01StateRef = useRef<
    "present" | "entering" | "exiting" | "waiting"
  >("waiting");

  const initializedRef = useRef(false);

  useEffect(() => {
    const unsubCurrentTimeValue = useAppStore.subscribe(
      (state) => state.currentTimeValue,
      (value, previousValue) => {
        if (isSemicolon && initializedRef.current) return;

        const char = value.toFormat("HH:mm:ss").charAt(index);
        const previousChar = previousValue.toFormat("HH:mm:ss").charAt(index);

        if (char === previousChar && initializedRef.current) return;

        if (!initializedRef.current) initializedRef.current = true;

        const newDisplaying = ((displayingRef.current + 1) % 2) as 0 | 1;
        displayingRef.current = newDisplaying;

        setTimeout(
          () => {
            if (newDisplaying === 0) {
              setText00Char(char);
              presence00StateRef.current = "entering";
              text00Ref.current.position.z = 0;
              // text00YOffset.set(0);
              text00YOffset.jump(0);

              presence01StateRef.current = "exiting";
              text01Ref.current.position.z = 0.01;
              // text01YOffset.set(-distance);
              text01YOffset.jump(-distance);
            } else {
              setText01Char(char);
              presence01StateRef.current = "entering";
              text01Ref.current.position.z = 0;
              // text01YOffset.set(0);
              text01YOffset.jump(0);

              presence00StateRef.current = "exiting";
              text00Ref.current.position.z = 0.01;
              // text00YOffset.set(-distance);
              text00YOffset.jump(-distance);
            }
          },
          (7 - index) * 100,
        );
      },
    );
    return () => {
      unsubCurrentTimeValue();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const deltaRef = useRef(0);
  useFrame((_, delta) => {
    deltaRef.current = Math.min(delta, 0.01);

    if (presence00StateRef.current === "entering") {
      opacity00Ref.current = Math.min(
        opacity00Ref.current + deltaRef.current * fadeSpeed,
        1,
      );
      if (opacity00Ref.current === 1) {
        presence00StateRef.current = "present";
      }
    } else if (presence00StateRef.current === "exiting") {
      opacity00Ref.current = Math.max(
        opacity00Ref.current - deltaRef.current * fadeSpeed,
        0,
      );
      if (opacity00Ref.current === 0) {
        presence00StateRef.current = "waiting";
        text00YOffset.jump(distance);
      }
    }

    if (presence01StateRef.current === "entering") {
      opacity01Ref.current = Math.min(
        opacity01Ref.current + deltaRef.current * fadeSpeed,
        1,
      );
      if (opacity01Ref.current === 1) {
        presence01StateRef.current = "present";
      }
    } else if (presence01StateRef.current === "exiting") {
      opacity01Ref.current = Math.max(
        opacity01Ref.current - deltaRef.current * fadeSpeed,
        0,
      );
      if (opacity01Ref.current === 0) {
        presence01StateRef.current = "waiting";
        text01YOffset.jump(distance);
      }
    }

    material00Ref.current.opacity = opacity00Ref.current;
    text00Ref.current.position.y = text00YOffset.get();

    material01Ref.current.opacity = opacity01Ref.current;
    text01Ref.current.position.y = text01YOffset.get();
  });
  return (
    <group position={groupPosition}>
      <Text
        ref={text00Ref}
        font={FONT_URL}
        fontSize={0.18}
        textAlign="center"
        characters={CHARACTERS}
        position={[0, 0, 0]}
        outlineBlur={0.004}
        outlineWidth={0.003}
        outlineColor={"#fff"}
      >
        {text00Char}
        <meshBasicMaterial ref={material00Ref} color={"#fff"} />
      </Text>
      <Text
        ref={text01Ref}
        font={FONT_URL}
        fontSize={0.18}
        textAlign="center"
        characters={CHARACTERS}
        position={[0, distance, 0.01]}
        outlineBlur={0.004}
        outlineWidth={0.003}
        outlineColor={"#fff"}
      >
        {text01Char}
        <meshBasicMaterial ref={material01Ref} color={"#fff"} />
      </Text>
    </group>
  );
}

export default function Digits({
  position = [0, 0, 0],
}: {
  position?: [number, number, number];
}) {
  const groupRef = useRef<THREE.Group>(null!);
  // useEffect(() => {
  //   groupRef.current.scale.set(
  //     0.3,
  //     window.innerHeight * 0.3,
  //     1,
  //   );
  //   // eslint-disable-next-line react-hooks/exhaustive-deps
  // }, []);
  return (
    <group ref={groupRef} position={position} scale={[520, 520, 1]}>
      {Array.from({ length: 8 }).map((_, index) => {
        // return <ClockPositionCharGroup key={`digit-${index}`} index={index} />;
        return <Char key={`digit-${index}`} index={index} />;
      })}
    </group>
  );
}
