import { Text } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { springValue } from "motion/react";
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

// const fontUrl = "./fonts/roboto_mono/static/RobotoMono-Regular.ttf";
const fontUrl = "./fonts/Six_Caps/SixCaps-Regular.ttf";
const characters = "0123456789:";

function Char({
  index,
  currOrPrev,
  charRef,
  materialRef,
}: {
  index: number;
  currOrPrev: "curr" | "prev";
  charRef: React.RefObject<THREE.Mesh>;
  materialRef: React.RefObject<THREE.MeshStandardMaterial>;
}) {
  const [char, setChar] = useState("0");

  useEffect(() => {
    const unsubCurrentTimeValue = useAppStore.subscribe(
      (state) => state.currentTimeValue,
      (value, prevValue) => {
        const currentTimeString = value.toFormat("HH:mm:ss");
        const previousTimeString = prevValue.toFormat("HH:mm:ss");
        const newChar = currentTimeString.charAt(index);
        const oldChar = previousTimeString.charAt(index);
        if (newChar !== oldChar) {
          if (currOrPrev === "curr") {
            setChar(newChar);
          } else {
            setChar(oldChar);
          }
        }
      },
    );
    return () => {
      unsubCurrentTimeValue();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

function Digit({ index }: { index: number }) {
  const enteringTextRef = useRef<THREE.Mesh>(null!);
  const exitingTextRef = useRef<THREE.Mesh>(null!);
  const enteringMaterialRef = useRef<THREE.MeshStandardMaterial>(null!);
  const exitingMaterialRef = useRef<THREE.MeshStandardMaterial>(null!);

  const enteringNeedsRef = useRef("");
  const exitingNeedsRef = useRef("");

  const enteringYOffset = springValue<number>(0);
  const exitingYOffset = springValue<number>(0);

  const position = useMemo(() => {
    const x = getDigitSpace(index, 0.2, 0.16);
    return [x, 0, 0] as [number, number, number];
  }, [index]);

  useEffect(() => {
    const unsubCurrentTimeValue = useAppStore.subscribe(
      (state) => state.currentTimeValue,
      (value, prevValue) => {
        const currentTimeString = value.toFormat("HH:mm:ss");
        const previousTimeString = prevValue.toFormat("HH:mm:ss");
        const newChar = currentTimeString.charAt(index);
        const oldChar = previousTimeString.charAt(index);
        if (newChar !== oldChar) {
          enteringNeedsRef.current = "opacity";
          exitingNeedsRef.current = "opacity";

          // enteringYOffset.jump(1);
          // exitingYOffset.jump(0);

          // enteringYOffset.set(0);
          // exitingYOffset.set(-1);
        }
      },
    );
    return () => {
      unsubCurrentTimeValue();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const hasLogged = useRef(false);
  useFrame((_, delta) => {
    if (!hasLogged.current) {
      hasLogged.current = true;
      console.log(enteringTextRef.current);
    }
    enteringTextRef.current.position.y = enteringYOffset.get();
    exitingTextRef.current.position.y = exitingYOffset.get();

    if (enteringMaterialRef.current.opacity < 1) {
      enteringMaterialRef.current.opacity = Math.min(
        1,
        enteringMaterialRef.current.opacity + delta * 3,
      );
    }
    if (exitingMaterialRef.current.opacity > 0) {
      exitingMaterialRef.current.opacity = Math.max(
        0,
        exitingMaterialRef.current.opacity - delta * 3,
      );
    }

    if (enteringNeedsRef.current === "opacity") {
      enteringMaterialRef.current.opacity = 0;
      enteringNeedsRef.current = "jump";
    } else if (enteringNeedsRef.current === "jump") {
      enteringYOffset.jump(1);
      enteringNeedsRef.current = "set";
    } else if (enteringNeedsRef.current === "set") {
      enteringYOffset.set(0);
      enteringNeedsRef.current = "";
    }

    if (exitingNeedsRef.current === "opacity") {
      exitingMaterialRef.current.opacity = 0;
      exitingNeedsRef.current = "jump";
    } else if (exitingNeedsRef.current === "jump") {
      exitingYOffset.jump(0);
      exitingNeedsRef.current = "set";
    } else if (exitingNeedsRef.current === "set") {
      exitingYOffset.set(-1);
      exitingNeedsRef.current = "";
    }
  });

  return (
    <group position={position}>
      <Char
        index={index}
        currOrPrev="curr"
        charRef={enteringTextRef}
        materialRef={enteringMaterialRef}
      />
      <Char
        index={index}
        currOrPrev="prev"
        charRef={exitingTextRef}
        materialRef={exitingMaterialRef}
      />
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
        return <Digit key={`digit-${index}`} index={index} />;
      })}
    </group>
  );
}
