import { Text } from "@react-three/drei";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import useAppStore from "../../../stores/useAppStore";

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

function Char({ index }: { index: number }) {
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

        setTimeout(
          () => {
            setText00Char(char);
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

  return (
    <group position={groupPosition}>
      <Text
        font={FONT_URL}
        fontSize={0.18}
        textAlign="center"
        characters={CHARACTERS}
        position={[0, 0, 0]}
        outlineWidth={0.002}
        outlineColor={"#fff"}
      >
        {text00Char}
        <meshBasicMaterial color={"#000"} />
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
    <group ref={groupRef} position={position} scale={[600, 600, 1]}>
      {Array.from({ length: 8 }).map((_, index) => {
        // return <ClockPositionCharGroup key={`digit-${index}`} index={index} />;
        return <Char key={`digit-${index}`} index={index} />;
      })}
    </group>
  );
}
