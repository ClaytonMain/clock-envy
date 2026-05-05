import { Box, Loader } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import { useControls } from "leva";
import { useMotionValue, useSpring } from "motion/react";
import { Suspense, useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import useAppStore from "../../../stores/useAppStore";
import BasicBoundsBoxBaybee from "../../misc/BasicBoundsBoxBaybee";
import CustomStatsComponent from "../../misc/CustomStatsComponent";
import DebugOrbitControls from "../../misc/DebugOrbitControls";
import { FOV } from "./constants/constants";
import voxelsFragmentShader from "./shaders/voxels/voxels.frag";
import voxelsVertexShader from "./shaders/voxels/voxels.vert";
import { getActiveSegments } from "./utils/utils";

const OFFSET_SCALE = 1.3;
const DIGIT_CENTER_OFFSETS = [
  -3.5 * OFFSET_SCALE,
  -1.5 * OFFSET_SCALE,
  1.5 * OFFSET_SCALE,
  3.5 * OFFSET_SCALE,
];
const SEGMENT_X_OFFSET = 0.6;
const SEGMENT_Y_OFFSET = 1.5;
const SEGMENT_OFFSETS = [
  new THREE.Vector2(0.0, SEGMENT_Y_OFFSET),
  new THREE.Vector2(SEGMENT_X_OFFSET, SEGMENT_Y_OFFSET / 2),
  new THREE.Vector2(SEGMENT_X_OFFSET, -SEGMENT_Y_OFFSET / 2),
  new THREE.Vector2(0.0, -SEGMENT_Y_OFFSET),
  new THREE.Vector2(-SEGMENT_X_OFFSET, -SEGMENT_Y_OFFSET / 2),
  new THREE.Vector2(-SEGMENT_X_OFFSET, SEGMENT_Y_OFFSET / 2),
  new THREE.Vector2(0.0, 0.0),
];
const SEGMENT_ORIENTATIONS = ["H", "V", "V", "H", "V", "V", "H"];
const SEGMENT_THICKNESS = 0.2;

function DigitSegmentObjects({ segmentIndex }: { segmentIndex: number }) {
  const segmentPosition = useMemo(
    () =>
      new THREE.Vector3(
        SEGMENT_OFFSETS[segmentIndex].x,
        SEGMENT_OFFSETS[segmentIndex].y,
        0,
      ),
    [segmentIndex],
  );

  return (
    <group
      position={segmentPosition}
      rotation={[
        0,
        0,
        SEGMENT_ORIENTATIONS[segmentIndex] === "H" ? 0 : Math.PI * 0.5,
      ]}
    >
      <object3D
        name={`a-${segmentIndex}`}
        position={[
          -(SEGMENT_ORIENTATIONS[segmentIndex] === "H"
            ? SEGMENT_X_OFFSET
            : SEGMENT_Y_OFFSET * 0.75) * 0.5,
          0,
          0,
        ]}
      />
      <object3D
        name={`b-${segmentIndex}`}
        position={[
          (SEGMENT_ORIENTATIONS[segmentIndex] === "H"
            ? SEGMENT_X_OFFSET
            : SEGMENT_Y_OFFSET * 0.75) * 0.5,
          0,
          0,
        ]}
      />
    </group>
  );
}

function getCurrentDigits(format: string = "HHmm"): string {
  const timeValue = useAppStore.getState().currentTimeValue;
  const digits = timeValue.toFormat(format);
  return digits;
}

function getChangedDigitCount(
  currentDigits: string,
  targetDigits: string,
): number {
  let changedCount = 0;
  for (let i = 0; i < currentDigits.length; i++) {
    if (currentDigits[i] !== targetDigits[i]) {
      changedCount = currentDigits.length - i;
      break;
    }
  }
  return changedCount;
}

type DigitState = "display" | "exitWait" | "exit" | "enterWait" | "enter";

function getBaseGroupPositionOffsets(digitState: DigitState) {
  const exitYOffset = 4.0;
  const bounds = [
    [-0.1, 0.1],
    [-0.3, 0.4],
    [-0.05, 0.05],
  ];
  const returnVals = [];
  for (let i = 0; i < 3; i++) {
    let targetValue =
      Math.random() * (bounds[i][1] - bounds[i][0]) + bounds[i][0];
    if (digitState === "exit" && i === 1) {
      targetValue -= exitYOffset;
    } else if (i === 1) {
      if (targetValue >= -0.01 && targetValue < 0.09) {
        targetValue -= 0.1;
      } else if (targetValue >= 0.09 && targetValue < 0.17) {
        targetValue += 0.1;
      }
    }
    returnVals.push(targetValue);
  }
  return {
    x: returnVals[0],
    y: returnVals[1],
    z: returnVals[2],
  };
}

function getBaseGroupRotationOffsets() {
  const bounds = {
    x: [-0.1, 0.1],
    y: [-0.08, 0.08],
    z: [-0.05, 0.05],
  };
  return {
    x: Math.random() * (bounds.x[1] - bounds.x[0]) + bounds.x[0],
    y: Math.random() * (bounds.y[1] - bounds.y[0]) + bounds.y[0],
    z: Math.random() * (bounds.z[1] - bounds.z[0]) + bounds.z[0],
  };
}

// https://easings.net/#easeInOutBack
function easeInOutBack(x: number): number {
  const c1 = 1.70158;
  const c2 = c1 * 1.525;

  return x < 0.5
    ? (Math.pow(2 * x, 2) * ((c2 + 1) * 2 * x - c2)) / 2
    : (Math.pow(2 * x - 2, 2) * ((c2 + 1) * (x * 2 - 2) + c2) + 2) / 2;
}

// https://easings.net/#easeInBack
function easeInBack(x: number): number {
  const c1 = 1.70158;
  const c3 = c1 + 1;

  return c3 * x * x * x - c1 * x * x;
}

// https://easings.net/#easeOutBack
function easeOutBack(x: number): number {
  const c1 = 1.70158;
  const c3 = c1 + 1;

  return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2);
}

function getEasedPosition(
  startPosition: number,
  endPosition: number,
  currentTime: number,
  totalTime: number,
  easing: "easeInOutBack" | "easeOutBack" | "easeInBack" = "easeInOutBack",
) {
  const t = Math.max(0.0, Math.min(1.0, currentTime / totalTime));
  let factor = t;
  switch (easing) {
    case "easeInOutBack":
      factor = easeInOutBack(t);
      break;
    case "easeOutBack":
      factor = easeOutBack(t);
      break;
    case "easeInBack":
      factor = easeInBack(t);
      break;
    default:
      factor = t;
      break;
  }
  return startPosition + (endPosition - startPosition) * factor;
}

function getPositionTimeOffset(
  tValue: number,
  axis: "x" | "y" | "z",
  randomValues: { x: number; y: number; z: number },
): number {
  const timeScales = {
    x: 0.5,
    y: 0.5,
    z: 0.5,
  };
  const amplitudeScales = {
    x: 0.02,
    y: 0.09,
    z: 0.02,
  };
  return (
    Math.sin(tValue * timeScales[axis] + randomValues[axis] * Math.PI * 2) *
    amplitudeScales[axis]
  );
}

function getInnerGroupXOffset(digitChar: string): number {
  if (digitChar === "1") {
    return -SEGMENT_X_OFFSET;
  }
  return 0;
}

function Digit({
  digitIndex,
  boundingBoxCenters,
  boundingBoxBValues,
  segmentAPositions,
  segmentBPositions,
  activeSegments,
  rippleTimes,
}: {
  digitIndex: number;
  boundingBoxCenters: THREE.Vector3[];
  boundingBoxBValues: THREE.Vector3[];
  segmentAPositions: THREE.Vector3[];
  segmentBPositions: THREE.Vector3[];
  activeSegments: number[];
  rippleTimes: number[];
}) {
  const baseGroupRef = useRef<THREE.Group>(null!);
  const innerGroupRef = useRef<THREE.Group>(null!);
  const currentDigitsRef = useRef(getCurrentDigits());
  const innerGroupXOffset = useRef(
    getInnerGroupXOffset(currentDigitsRef.current[digitIndex]),
  );

  const randomValues = useMemo(() => {
    return {
      x: Math.random(),
      y: Math.random(),
      z: Math.random(),
    };
  }, []);

  // digitCenter does not change.
  const digitCenter = useMemo(() => {
    return new THREE.Vector3(DIGIT_CENTER_OFFSETS[digitIndex], 0, 0);
  }, [digitIndex]);
  // We'll update the offsets based on the current animation state.
  const positionOffsets = useMemo(() => {
    const offsets = getBaseGroupPositionOffsets("display");
    return new THREE.Vector3(offsets.x, offsets.y, offsets.z);
  }, []);
  // These will be updated while animating, after updating the positionOffsets.
  const targetPositionX = useRef(digitCenter.x + positionOffsets.x);
  const targetPositionY = useRef(digitCenter.y + positionOffsets.y);
  const targetPositionZ = useRef(digitCenter.z + positionOffsets.z);
  // We'll add the sin offsets to the motion values when they're updated.
  const motionPositionX = useMotionValue(
    targetPositionX.current + getPositionTimeOffset(0, "x", randomValues),
  );
  const motionPositionY = useMotionValue(
    targetPositionY.current + getPositionTimeOffset(0, "y", randomValues),
  );
  const motionPositionZ = useMotionValue(
    targetPositionZ.current + getPositionTimeOffset(0, "z", randomValues),
  );
  // The spring values we'll use for the actual position.
  const targetSpringConfig = { stiffness: 50, damping: 20 };
  const targetSpringX = useSpring(motionPositionX, targetSpringConfig);
  const targetSpringY = useSpring(motionPositionY, targetSpringConfig);
  const targetSpringZ = useSpring(motionPositionZ, targetSpringConfig);
  // We'll need to keep track of our easing positions for each axis
  // so we can update the motion values during the animation.
  const easeOffsetsRef = useRef({
    x: [positionOffsets.x, positionOffsets.x],
    y: [positionOffsets.y, positionOffsets.y],
    z: [positionOffsets.z, positionOffsets.z],
  });

  const baseGroupSpringRotationOffsetsRef = useRef(
    getBaseGroupRotationOffsets(),
  );
  const rotationSpringConfig = { visualDuration: 5.0, bounce: 0.8 };
  const baseGroupTargetXRotation = useSpring(
    baseGroupSpringRotationOffsetsRef.current.x,
    rotationSpringConfig,
  );
  const baseGroupTargetYRotation = useSpring(
    baseGroupSpringRotationOffsetsRef.current.y,
    rotationSpringConfig,
  );
  const baseGroupTargetZRotation = useSpring(
    baseGroupSpringRotationOffsetsRef.current.z,
    rotationSpringConfig,
  );

  const deltaRef = useRef(0);
  const timeRef = useRef(0);

  const digitWaitStagger = 0.5;
  const digitWaitTimeRemainingRef = useRef(0);
  const digitHideBaseDuration = 1.0;
  const digitCurrentEaseTimeRef = useRef(0);
  const digitTotalEaseTime = 3.0;

  const currentChangedDigitCountRef = useRef(0);
  const currentDigitStateRef = useRef<DigitState>("display");

  useFrame((_, delta) => {
    deltaRef.current = Math.min(delta, 0.1);
    timeRef.current = (timeRef.current + deltaRef.current) % 100000;

    rippleTimes[digitIndex] =
      (rippleTimes[digitIndex] +
        deltaRef.current *
          (1.0 + Math.abs(targetSpringY.getVelocity()) * 2.0)) %
      100000;

    const targetDigits = getCurrentDigits();
    const currentDigits = currentDigitsRef.current;
    const changedDigitCount = getChangedDigitCount(currentDigits, targetDigits);

    if (changedDigitCount > 0 && currentDigitStateRef.current === "display") {
      if (digitIndex >= currentDigits.length - changedDigitCount) {
        // Digit needs to change after stagger.
        currentChangedDigitCountRef.current = changedDigitCount;
        currentDigitStateRef.current = "exitWait";
        digitWaitTimeRemainingRef.current =
          (currentDigits.length - digitIndex - 1) * digitWaitStagger;
      } else {
        // Digit does not need to change.
        currentChangedDigitCountRef.current = 0;
      }
    }

    // Handle exit wait.
    if (currentDigitStateRef.current === "exitWait") {
      if (digitWaitTimeRemainingRef.current <= 0) {
        // Start exit.
        currentDigitStateRef.current = "exit";
        digitWaitTimeRemainingRef.current = 0;

        // Find new target position for y.
        const newPositionOffsets = getBaseGroupPositionOffsets("exit");
        easeOffsetsRef.current.y = [positionOffsets.y, newPositionOffsets.y];

        digitCurrentEaseTimeRef.current = 0;

        const newBaseGroupRotationOffsets = getBaseGroupRotationOffsets();
        baseGroupSpringRotationOffsetsRef.current = newBaseGroupRotationOffsets;
        baseGroupTargetXRotation.set(
          baseGroupSpringRotationOffsetsRef.current.x,
        );
        baseGroupTargetYRotation.set(
          baseGroupSpringRotationOffsetsRef.current.y,
        );
        baseGroupTargetZRotation.set(
          baseGroupSpringRotationOffsetsRef.current.z,
        );
      }

      digitWaitTimeRemainingRef.current -= deltaRef.current;
    }

    // Handle exit.
    if (currentDigitStateRef.current === "exit") {
      positionOffsets.y = getEasedPosition(
        easeOffsetsRef.current.y[0],
        easeOffsetsRef.current.y[1],
        digitCurrentEaseTimeRef.current,
        digitTotalEaseTime,
        "easeInBack",
      );
      targetPositionY.current = digitCenter.y + positionOffsets.y;
      if (digitCurrentEaseTimeRef.current >= digitTotalEaseTime) {
        // Start enter wait.
        currentDigitStateRef.current = "enterWait";
        digitWaitTimeRemainingRef.current =
          digitHideBaseDuration +
          (currentChangedDigitCountRef.current -
            (currentDigits.length - digitIndex - 1)) *
            digitWaitStagger *
            2;
      }
      digitCurrentEaseTimeRef.current += deltaRef.current;
    }

    // Handle enter wait.
    if (currentDigitStateRef.current === "enterWait") {
      if (digitWaitTimeRemainingRef.current <= 0) {
        currentDigitStateRef.current = "enter";
        digitWaitTimeRemainingRef.current = 0;

        // Find new target position for all.
        const newPositionOffsets = getBaseGroupPositionOffsets("display");
        easeOffsetsRef.current.x = [positionOffsets.x, newPositionOffsets.x];
        easeOffsetsRef.current.y = [positionOffsets.y, newPositionOffsets.y];
        easeOffsetsRef.current.z = [positionOffsets.z, newPositionOffsets.z];

        digitCurrentEaseTimeRef.current = 0;

        const newBaseGroupRotationOffsets = getBaseGroupRotationOffsets();
        baseGroupSpringRotationOffsetsRef.current = newBaseGroupRotationOffsets;
        baseGroupTargetXRotation.set(
          baseGroupSpringRotationOffsetsRef.current.x,
        );
        baseGroupTargetYRotation.set(
          baseGroupSpringRotationOffsetsRef.current.y,
        );
        baseGroupTargetZRotation.set(
          baseGroupSpringRotationOffsetsRef.current.z,
        );
      }

      digitWaitTimeRemainingRef.current -= deltaRef.current;
    }

    // Handle enter.
    if (currentDigitStateRef.current === "enter") {
      positionOffsets.x = getEasedPosition(
        easeOffsetsRef.current.x[0],
        easeOffsetsRef.current.x[1],
        digitCurrentEaseTimeRef.current,
        digitTotalEaseTime,
        "easeOutBack",
      );
      positionOffsets.y = getEasedPosition(
        easeOffsetsRef.current.y[0],
        easeOffsetsRef.current.y[1],
        digitCurrentEaseTimeRef.current,
        digitTotalEaseTime,
        "easeOutBack",
      );
      positionOffsets.z = getEasedPosition(
        easeOffsetsRef.current.z[0],
        easeOffsetsRef.current.z[1],
        digitCurrentEaseTimeRef.current,
        digitTotalEaseTime,
        "easeOutBack",
      );

      targetPositionX.current = digitCenter.x + positionOffsets.x;
      targetPositionY.current = digitCenter.y + positionOffsets.y;
      targetPositionZ.current = digitCenter.z + positionOffsets.z;

      if (digitCurrentEaseTimeRef.current >= digitTotalEaseTime) {
        currentDigitStateRef.current = "display";
      }

      digitCurrentEaseTimeRef.current += deltaRef.current;
    }

    // Sanity-check correct digits.
    if (["display", "enter"].includes(currentDigitStateRef.current)) {
      const currentActiveSegments = getActiveSegments();
      for (let i = digitIndex * 7; i < digitIndex * 7 + 7; i++) {
        if (activeSegments[i] !== currentActiveSegments[i]) {
          activeSegments[i] = currentActiveSegments[i];
        }
      }
      if (currentDigitsRef.current !== targetDigits) {
        currentDigitsRef.current = targetDigits;
      }
      innerGroupXOffset.current = getInnerGroupXOffset(
        currentDigitsRef.current[digitIndex],
      );
    }

    // Update motion values.
    motionPositionX.set(
      targetPositionX.current +
        getPositionTimeOffset(timeRef.current, "x", randomValues),
    );
    motionPositionY.set(
      targetPositionY.current +
        getPositionTimeOffset(timeRef.current, "y", randomValues),
    );
    motionPositionZ.set(
      targetPositionZ.current +
        getPositionTimeOffset(timeRef.current, "z", randomValues),
    );

    if (baseGroupRef.current) {
      baseGroupRef.current.position.x = targetSpringX.get();
      baseGroupRef.current.position.y = targetSpringY.get();
      baseGroupRef.current.position.z = targetSpringZ.get();

      baseGroupRef.current.rotation.x =
        baseGroupTargetXRotation.get() +
        Math.sin(timeRef.current * 0.2 + randomValues.x * Math.PI * 2) * 0.07;
      baseGroupRef.current.rotation.y =
        baseGroupTargetYRotation.get() +
        Math.sin(timeRef.current * 0.22 + randomValues.y * Math.PI * 2) * 0.18;
      baseGroupRef.current.rotation.z =
        baseGroupTargetZRotation.get() +
        Math.sin(timeRef.current * 0.2 + randomValues.z * Math.PI * 2) * 0.02;
    }

    if (innerGroupRef.current) {
      innerGroupRef.current.position.x = innerGroupXOffset.current;
    }

    if (baseGroupRef.current) {
      boundingBoxCenters[digitIndex].copy(baseGroupRef.current.position);
      boundingBoxBValues[digitIndex].copy(
        new THREE.Box3()
          .setFromObject(baseGroupRef.current)
          .max.sub(baseGroupRef.current.position),
      );
      for (let segmentIndex = 0; segmentIndex < 7; segmentIndex++) {
        const aObject = baseGroupRef.current.getObjectByName(
          `a-${segmentIndex}`,
        );
        const bObject = baseGroupRef.current.getObjectByName(
          `b-${segmentIndex}`,
        );
        if (aObject && bObject) {
          const globalAPosition = new THREE.Vector3();
          aObject.getWorldPosition(globalAPosition);
          const globalBPosition = new THREE.Vector3();
          bObject.getWorldPosition(globalBPosition);
          const globalSegmentIndex = digitIndex * 7 + segmentIndex;
          segmentAPositions[globalSegmentIndex].copy(globalAPosition);
          segmentBPositions[globalSegmentIndex].copy(globalBPosition);
        }
      }
    }
  });

  return (
    <>
      <group
        ref={baseGroupRef}
        onClick={() => console.log(baseGroupRef.current.position.y)}
      >
        {/* <Box args={[0.5, 0.5, 0.5]} visible={false} /> */}
        <group ref={innerGroupRef}>
          <Box
            args={[
              SEGMENT_X_OFFSET * 2 + SEGMENT_THICKNESS,
              SEGMENT_Y_OFFSET * 2 + SEGMENT_THICKNESS,
              SEGMENT_THICKNESS,
            ]}
            visible={false}
          />
          {Array.from({ length: 7 }, (_, segmentIndex) => (
            <DigitSegmentObjects
              key={segmentIndex}
              segmentIndex={segmentIndex}
            />
          ))}
        </group>
      </group>
    </>
  );
}

function Voxus() {
  const boundingBoxCenters = useMemo(() => {
    return Array.from({ length: 4 }, () => new THREE.Vector3());
  }, []);
  const boundingBoxBValues = useMemo(() => {
    return Array.from({ length: 4 }, () => new THREE.Vector3());
  }, []);
  const { segmentAPositions, segmentBPositions } = useMemo(() => {
    const segmentAPositionsArray: THREE.Vector3[] = [];
    const segmentBPositionsArray: THREE.Vector3[] = [];
    for (let digitIndex = 0; digitIndex < 4; digitIndex++) {
      const digitOffset = DIGIT_CENTER_OFFSETS[digitIndex];
      for (let segmentIndex = 0; segmentIndex < 7; segmentIndex++) {
        const segmentPos = new THREE.Vector3(
          digitOffset + SEGMENT_OFFSETS[segmentIndex].x,
          SEGMENT_OFFSETS[segmentIndex].y,
          0,
        );
        const orientation = SEGMENT_ORIENTATIONS[segmentIndex];
        const segmentAPosition = new THREE.Vector3();
        const segmentBPosition = new THREE.Vector3();
        if (orientation === "H") {
          segmentAPosition.set(
            segmentPos.x - SEGMENT_X_OFFSET * 0.5,
            segmentPos.y,
            0,
          );
          segmentBPosition.set(
            segmentPos.x + SEGMENT_X_OFFSET * 0.5,
            segmentPos.y,
            0,
          );
        } else {
          segmentAPosition.set(
            segmentPos.x,
            segmentPos.y - SEGMENT_Y_OFFSET * 0.5,
            0,
          );
          segmentBPosition.set(
            segmentPos.x,
            segmentPos.y + SEGMENT_Y_OFFSET * 0.5,
            0,
          );
        }
        segmentAPositionsArray.push(segmentAPosition);
        segmentBPositionsArray.push(segmentBPosition);
      }
    }
    return {
      segmentAPositions: segmentAPositionsArray,
      segmentBPositions: segmentBPositionsArray,
    };
  }, []);
  const activeSegments = useMemo(() => {
    return getActiveSegments();
  }, []);
  const colonCenters = useMemo(() => {
    return [new THREE.Vector3(0.0, 0.75, 0), new THREE.Vector3(0.0, -0.75, 0)];
  }, []);
  const rippleTimes = useMemo(() => {
    return [0.0, 0.0, 0.0, 0.0];
  }, []);

  const uniforms = useMemo(() => {
    return {
      uDelta: { value: 0 },
      uTime: { value: 0 },
      uCameraPosition: { value: new THREE.Vector3() },
      uResolution: { value: new THREE.Vector2() },
      uGlZ: { value: -1 / (2 * Math.tan(FOV * (Math.PI / 180) * 0.5)) },
      uBoundingBoxCenters: { value: boundingBoxCenters },
      uBoundingBoxBValues: { value: boundingBoxBValues },
      uActiveSegments: { value: activeSegments },
      uSegmentAPositions: { value: segmentAPositions },
      uSegmentBPositions: { value: segmentBPositions },
      // uLightColor: { value: new THREE.Color("#101010") },
      uLightColor01: { value: new THREE.Color("#ffa3a3") },
      uLightColor02: { value: new THREE.Color("#ffc99d") },
      // uMaterialColor: { value: new THREE.Color("#b4b4b4") },
      uMaterialColor: { value: new THREE.Color("#ffffff") },
      uMaterialSubsurfaceColor: { value: new THREE.Color("#f20512") },
      // uSubsurfaceRadius: { value: 2.42 },
      uSubsurfaceRadius: { value: 1.72 },
      uRoughness: { value: 0.0 },
      uRefractionIndex: { value: 2.17 },
      uFogColor: { value: new THREE.Color("#c76b80") },
      // uSkyLowColor: { value: new THREE.Color("#000000") },
      // uSkyHighColor: { value: new THREE.Color("#000000") },
      uSkyLowColor: { value: new THREE.Color("#f20512") },
      uSkyHighColor: { value: new THREE.Color("#f20512") },
      uPlatformColor: { value: new THREE.Color("#be0225") },
      uSeaLowColor: { value: new THREE.Color("#c73e4e") },
      uSeaHighColor: { value: new THREE.Color("#02153b") },
      uNormalMix: { value: 0.68 },
      uSkyRangeMin: { value: 0.0 },
      uSkyRangeMax: { value: 0.2 },
      uColonCenters: { value: colonCenters },
      uColonScales: { value: [1.0, 1.0] },
      uRippleTimes: { value: rippleTimes },
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useControls({
    lightColor01: {
      value: "#ffa3a3",
      onChange: (value) => {
        uniforms.uLightColor01.value = new THREE.Color(value);
      },
    },
    lightColor02: {
      value: "#ffc99d",
      onChange: (value) => {
        uniforms.uLightColor02.value = new THREE.Color(value);
      },
    },
    materialColor: {
      value: "#ffffff",
      onChange: (value) => {
        uniforms.uMaterialColor.value = new THREE.Color(value);
      },
    },
    materialSubsurfaceColor: {
      value: "#f20512",
      onChange: (value) => {
        uniforms.uMaterialSubsurfaceColor.value = new THREE.Color(value);
      },
    },
    subsurfaceRadius: {
      value: 1.72,
      min: 0,
      max: 10,
      step: 0.01,
      onChange: (value) => {
        uniforms.uSubsurfaceRadius.value = value;
      },
    },
    roughness: {
      value: 0.0,
      min: 0,
      max: 1,
      step: 0.01,
      onChange: (value) => {
        uniforms.uRoughness.value = value;
      },
    },
    refractionIndex: {
      value: 2.17,
      min: 1,
      max: 3,
      step: 0.01,
      onChange: (value) => {
        uniforms.uRefractionIndex.value = value;
      },
    },
    normalMix: {
      value: 0.84,
      min: 0,
      max: 1,
      step: 0.01,
      onChange: (value) => {
        uniforms.uNormalMix.value = value;
      },
    },
    fogColor: {
      value: "#c76b80",
      onChange: (value) => {
        uniforms.uFogColor.value = new THREE.Color(value);
      },
    },
    skyLowColor: {
      value: "#f20512",
      onChange: (value) => {
        uniforms.uSkyLowColor.value = new THREE.Color(value);
      },
    },
    skyHighColor: {
      value: "#f20512",
      onChange: (value) => {
        uniforms.uSkyHighColor.value = new THREE.Color(value);
      },
    },
    platformColor: {
      value: "#be0225",
      onChange: (value) => {
        uniforms.uPlatformColor.value = new THREE.Color(value);
      },
    },
    seaLowColor: {
      value: "#c73e4e",
      onChange: (value) => {
        uniforms.uSeaLowColor.value = new THREE.Color(value);
      },
    },
    seaHighColor: {
      value: "#02153b",
      onChange: (value) => {
        uniforms.uSeaHighColor.value = new THREE.Color(value);
      },
    },
    skyRangeMin: {
      value: 0.0,
      min: 0,
      max: 5,
      step: 0.01,
      onChange: (value) => {
        uniforms.uSkyRangeMin.value = value;
      },
    },
    skyRangeMax: {
      value: 0.2,
      min: 0,
      max: 5,
      step: 0.01,
      onChange: (value) => {
        uniforms.uSkyRangeMax.value = value;
      },
    },
  });

  const cameraPosition = new THREE.Vector3();
  const uDeltaRef = useRef(0);
  const uTimeRef = useRef(0);

  const secondsRef = useRef(getCurrentDigits("ss"));
  const secondTimeRef = useRef(0);
  const colonScaleCount0Ref = useRef(0);
  const colonScaleCount1Ref = useRef(0);
  const colonScale0Spring = useSpring(1.0, { damping: 7, stiffness: 80 });
  const colonScale1Spring = useSpring(1.0, { damping: 7, stiffness: 80 });

  useFrame(({ camera }, delta) => {
    uDeltaRef.current = Math.min(delta, 0.1);
    uTimeRef.current = (uTimeRef.current + uDeltaRef.current) % 100000;

    const seconds = getCurrentDigits("ss");
    if (seconds !== secondsRef.current) {
      secondsRef.current = seconds;
      secondTimeRef.current = 0;
      colonScaleCount0Ref.current = 0;
      colonScaleCount1Ref.current = 0;
    }
    if (colonScaleCount0Ref.current === 0) {
      colonScale0Spring.set(0.9);
      colonScaleCount0Ref.current = 1;
    }
    if (secondTimeRef.current >= 0.15 && colonScaleCount1Ref.current === 0) {
      colonScale1Spring.set(0.9);
      colonScaleCount1Ref.current = 1;
    }
    if (secondTimeRef.current >= 0.15 && colonScaleCount0Ref.current === 1) {
      colonScale0Spring.set(1.0);
      colonScaleCount0Ref.current = 2;
    }
    if (secondTimeRef.current >= 0.3 && colonScaleCount1Ref.current === 1) {
      colonScale1Spring.set(1.0);
      colonScaleCount1Ref.current = 2;
    }
    secondTimeRef.current += uDeltaRef.current;

    camera.getWorldPosition(cameraPosition);

    uniforms.uDelta.value = uDeltaRef.current;
    uniforms.uTime.value = uTimeRef.current;
    uniforms.uCameraPosition.value.copy(cameraPosition);
    uniforms.uResolution.value.set(window.innerWidth, window.innerHeight);
    uniforms.uBoundingBoxCenters.value = boundingBoxCenters;
    uniforms.uBoundingBoxBValues.value = boundingBoxBValues;
    uniforms.uSegmentAPositions.value = segmentAPositions;
    uniforms.uSegmentBPositions.value = segmentBPositions;
    uniforms.uActiveSegments.value = activeSegments;

    colonCenters[0].x = Math.sin(uTimeRef.current * 0.19) * 0.1;
    colonCenters[0].y = Math.sin(uTimeRef.current * 0.2) * 0.18 + 0.68;
    colonCenters[0].z = Math.sin(uTimeRef.current * 0.16) * 0.1;

    colonCenters[1].x = Math.sin(uTimeRef.current * 0.17 + 1.0) * 0.1;
    colonCenters[1].y = Math.sin(uTimeRef.current * 0.23 + 1.0) * 0.18 - 0.68;
    colonCenters[1].z = Math.sin(uTimeRef.current * 0.19 + 1.0) * 0.1;

    uniforms.uColonCenters.value = colonCenters;
    uniforms.uColonScales.value = [
      colonScale0Spring.get(),
      colonScale1Spring.get(),
    ];

    uniforms.uRippleTimes.value = rippleTimes;
  });

  return (
    <group>
      {[0, 1, 2, 3].map((digitIndex) => (
        <Digit
          key={digitIndex}
          digitIndex={digitIndex}
          boundingBoxCenters={boundingBoxCenters}
          boundingBoxBValues={boundingBoxBValues}
          segmentAPositions={segmentAPositions}
          segmentBPositions={segmentBPositions}
          activeSegments={activeSegments}
          rippleTimes={rippleTimes}
        />
      ))}
      <mesh visible={true}>
        <planeGeometry />
        <shaderMaterial
          vertexShader={voxelsVertexShader}
          fragmentShader={voxelsFragmentShader}
          uniforms={uniforms}
          toneMapped={false}
        />
      </mesh>
    </group>
  );
}

export default function VoxusScene() {
  const canvasRef = useRef<HTMLCanvasElement>(null!);

  useEffect(() => {
    document.title = "Clock Envy - Voxus";

    const unsubInteractionState = useAppStore.subscribe(
      (state) => state.interactionState,
      (interactionState) => {
        if (canvasRef.current) {
          canvasRef.current.style.cursor =
            interactionState === "active" ? "default" : "none";
        }
      },
    );
    return () => {
      unsubInteractionState();
    };
  }, []);

  return (
    <>
      <Canvas
        ref={canvasRef}
        dpr={1}
        camera={{
          position: [-0.1, -1.0, 10],
          // position: [0, 0, 10],
          fov: FOV,
        }}
        style={{
          touchAction: "none",
        }}
        gl={{
          toneMapping: THREE.LinearToneMapping,
          outputColorSpace: THREE.LinearSRGBColorSpace,
        }}
        linear
        flat
      >
        <CustomStatsComponent />
        <Suspense fallback={null}>
          <Voxus />
        </Suspense>
        <DebugOrbitControls minDistance={1} />
        <BasicBoundsBoxBaybee
          boundsMargin={1.0}
          boxArgs={[
            (DIGIT_CENTER_OFFSETS[3] +
              SEGMENT_X_OFFSET * OFFSET_SCALE +
              SEGMENT_THICKNESS) *
              2,
            SEGMENT_Y_OFFSET * 2 + SEGMENT_THICKNESS,
            SEGMENT_THICKNESS,
          ]}
        />
      </Canvas>
      <Loader />
    </>
  );
}
