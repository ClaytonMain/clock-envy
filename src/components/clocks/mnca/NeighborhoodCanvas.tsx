import { Instance, Instances } from "@react-three/drei";
import { useFrame, type ThreeEvent } from "@react-three/fiber";
import { useControls } from "leva";
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import useMncaStore from "../../../stores/useMncaStore";
import { NEIGHBORHOOD_SIZE_RANGE } from "./constants/constants";

function NeighborhoodTile({
  ruleIndex,
  x,
  y,
  isCenter,
  initialAlive,
}: {
  ruleIndex: number;
  x: number;
  y: number;
  isCenter: boolean;
  initialAlive: boolean;
}) {
  const instanceRef = useRef<typeof Instance>(null!);
  const [hovered, setHovered] = useState(false);
  const [alive, setAlive] = useState(initialAlive);
  const color = new THREE.Color("#808080");

  useEffect(() => {
    setAlive(initialAlive);
  }, [initialAlive]);

  function handleOnPointer(e: ThreeEvent<PointerEvent>, isHovered: boolean) {
    if (isHovered) {
      e.stopPropagation();
      if (isCenter) return;
      if (e.buttons === 1) {
        handleOnClick(!e.shiftKey);
      }
    }
    setHovered(isHovered);
  }

  function handleOnClick(newAlive: boolean) {
    if (isCenter) return;
    const currentRules = [...useMncaStore.getState().rules];
    const currentRule = currentRules[ruleIndex];
    currentRule.neighborhood[y][x] = newAlive ? 1 : 0;
    const activeCount = currentRule.neighborhood
      .flat()
      .reduce((acc, val) => acc + val, 0);
    currentRule.activeCount = activeCount;
    const newRules = [...currentRules];
    newRules[ruleIndex] = currentRule;
    useMncaStore.setState({ rules: newRules, rulesUpdatedAt: Date.now() });
    console.log(newRules);
    setAlive(newAlive);
  }

  useFrame(() => {
    if (!instanceRef.current) return;
    if (isCenter) return;
    // @ts-expect-error this is probably fine
    instanceRef.current.color.lerp(
      color.set(
        alive
          ? hovered
            ? "#adadad"
            : "#ffffff"
          : hovered
            ? "#454545"
            : "#1a1a1a",
      ),
      0.5,
    );
  });

  return (
    <Instance
      ref={instanceRef}
      onPointerOver={(e) => handleOnPointer(e, true)}
      onPointerOut={(e) => handleOnPointer(e, false)}
      onClick={() => handleOnClick(!alive)}
      position={[x, y, 0.01]}
      color={isCenter ? "#808080" : initialAlive ? "#ffffff" : "#1a1a1a"}
    />
  );
}

export function NeighborhoodCanvas({ ruleIndex }: { ruleIndex: number }) {
  const ruleSize = useMncaStore((state) => state.rules[ruleIndex].size);
  const ruleNeighborhood = useMncaStore(
    (state) => state.rules[ruleIndex].neighborhood,
  );

  function updateNeighborhoodSize(size: number) {
    const currentRules = [...useMncaStore.getState().rules];
    const currentRule = currentRules[ruleIndex];
    const currentNeighborhood = currentRule.neighborhood;
    const currentSize = currentRule.size;
    const newNeighborhood: number[][] = Array.from(
      { length: size * 2 + 1 },
      () => Array.from({ length: size * 2 + 1 }, () => 0),
    );
    const sizeDifference = size - currentSize;

    if (sizeDifference > 0) {
      for (
        let y = sizeDifference;
        y < newNeighborhood.length - sizeDifference;
        y++
      ) {
        for (
          let x = sizeDifference;
          x < newNeighborhood[y].length - sizeDifference;
          x++
        ) {
          newNeighborhood[y][x] =
            currentNeighborhood[y - sizeDifference][x - sizeDifference];
        }
      }
    } else {
      for (let y = 0; y < newNeighborhood.length; y++) {
        for (let x = 0; x < newNeighborhood[y].length; x++) {
          newNeighborhood[y][x] =
            currentNeighborhood[y - sizeDifference][x - sizeDifference];
        }
      }
    }

    currentRule.neighborhood = newNeighborhood;
    currentRule.size = size;
    const activeCount = newNeighborhood
      .flat()
      .reduce((acc, val) => acc + val, 0);
    currentRule.activeCount = activeCount;
    const newRules = [...currentRules];
    newRules[ruleIndex] = currentRule;
    useMncaStore.setState({ rules: newRules, rulesUpdatedAt: Date.now() });
  }

  useControls(`MNCA Neighborhood ${ruleIndex + 1} Rules`, {
    size: {
      value: ruleSize,
      min: NEIGHBORHOOD_SIZE_RANGE[0],
      max: NEIGHBORHOOD_SIZE_RANGE[1],
      step: 1,
      onChange: updateNeighborhoodSize,
    },
    bornRange: {
      value: useMncaStore((state) => state.rules[ruleIndex].born),
      min: 0,
      max: 255,
      step: 1,
      onChange: (value) => {
        const currentRules = [...useMncaStore.getState().rules];
        const currentRule = currentRules[ruleIndex];
        currentRule.born = value as [number, number];
        const newRules = [...currentRules];
        newRules[ruleIndex] = currentRule;
        useMncaStore.setState({ rules: newRules, rulesUpdatedAt: Date.now() });
      },
    },
    stableRange: {
      value: useMncaStore((state) => state.rules[ruleIndex].stable),
      min: 0,
      max: 255,
      step: 1,
      onChange: (value) => {
        const currentRules = [...useMncaStore.getState().rules];
        const currentRule = currentRules[ruleIndex];
        currentRule.stable = value as [number, number];
        const newRules = [...currentRules];
        newRules[ruleIndex] = currentRule;
        useMncaStore.setState({ rules: newRules, rulesUpdatedAt: Date.now() });
      },
    },
  });

  return (
    <group
      position={[
        -window.innerWidth / window.innerHeight + 0.1,
        0.5 - ruleIndex * 0.5,
        0,
      ]}
      scale={[1, 1, 1]}
    >
      <Instances
        limit={(NEIGHBORHOOD_SIZE_RANGE[1] * 2 + 1) ** 2}
        scale={0.2 / ruleSize}
      >
        <planeGeometry args={[0.95, 0.95]} />
        <meshBasicMaterial />
        {ruleNeighborhood.map((row, y) =>
          row.map((_, x) => (
            <NeighborhoodTile
              key={`rule-${ruleIndex}-tile-${x}-${y}`}
              ruleIndex={ruleIndex}
              x={x}
              y={y}
              isCenter={x === ruleSize && y === ruleSize}
              initialAlive={ruleNeighborhood[y][x] === 1}
            />
          )),
        )}
      </Instances>
    </group>
  );
}
