import { Box, Loader, OrbitControls } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import { useControls } from "leva";
import { useSpring } from "motion/react";
import { Suspense, useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import useAppStore from "../../../stores/useAppStore";
import useVoxelAttractorStore from "../../../stores/useVoxelAttractorStore";
import CustomStatsComponent from "../../misc/CustomStatsComponent";
import { FOV } from "./constants/constants";
import voxelsFragmentShader from "./shaders/voxels/voxels.frag";
import voxelsVertexShader from "./shaders/voxels/voxels.vert";
import { getActiveSegments } from "./utils/utils";

const OFFSET_SCALE = 1.3;
const DIGIT_CENTER_OFFSETS = [
  -5.0 * OFFSET_SCALE,
  -3.0 * OFFSET_SCALE,
  -1.0 * OFFSET_SCALE,
  1.0 * OFFSET_SCALE,
  3.0 * OFFSET_SCALE,
  5.0 * OFFSET_SCALE,
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

function SpringyDigitSegmentObjects({
  segmentIndex,
}: {
  segmentIndex: number;
}) {
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

function getCurrentDigitAtIndex(digitIndex: number): number {
  const timeValue = useAppStore.getState().currentTimeValue;
  const char = timeValue.toFormat("HHmmss").charAt(digitIndex);
  return parseInt(char, 10);
}

function getBaseGroupPositionOffsets() {
  const bounds = {
    x: [-0.1, 0.1],
    y: [-0.3, 0.3],
    z: [-0.05, 0.05],
  };
  return {
    x: Math.random() * (bounds.x[1] - bounds.x[0]) + bounds.x[0],
    y: Math.random() * (bounds.y[1] - bounds.y[0]) + bounds.y[0],
    z: Math.random() * (bounds.z[1] - bounds.z[0]) + bounds.z[0],
  };
}

function getBaseGroupRotationOffsets() {
  const bounds = {
    x: [-0.1, 0.1],
    y: [-0.05, 0.05],
    z: [-0.05, 0.05],
  };
  return {
    x: Math.random() * (bounds.x[1] - bounds.x[0]) + bounds.x[0],
    y: Math.random() * (bounds.y[1] - bounds.y[0]) + bounds.y[0],
    z: Math.random() * (bounds.z[1] - bounds.z[0]) + bounds.z[0],
  };
}

function SpringyDigit({
  digitIndex,
  boundingBoxCenters,
  boundingBoxBValues,
  segmentAPositions,
  segmentBPositions,
  digitSpringScales,
}: {
  digitIndex: number;
  boundingBoxCenters: THREE.Vector3[];
  boundingBoxBValues: THREE.Vector3[];
  segmentAPositions: THREE.Vector3[];
  segmentBPositions: THREE.Vector3[];
  digitSpringScales: number[];
}) {
  const baseGroupRef = useRef<THREE.Group>(null!);
  const innerGroupRef = useRef<THREE.Group>(null!);
  const currentDigitRef = useRef(getCurrentDigitAtIndex(digitIndex));

  const randomValues = useMemo(() => {
    return {
      x: Math.random(),
      y: Math.random(),
      z: Math.random(),
    };
  }, []);

  const initialBaseGroupPosition = useMemo(() => {
    return new THREE.Vector3(DIGIT_CENTER_OFFSETS[digitIndex], 0, 0);
  }, [digitIndex]);

  const baseGroupPositionOffsetsRef = useRef(getBaseGroupPositionOffsets());
  const positionSpringConfig = { stiffness: 350, damping: 20 };
  const baseGroupTargetXPosition = useSpring(
    baseGroupPositionOffsetsRef.current.x,
    positionSpringConfig,
  );
  const baseGroupTargetYPosition = useSpring(
    baseGroupPositionOffsetsRef.current.y,
    positionSpringConfig,
  );
  const baseGroupTargetZPosition = useSpring(
    baseGroupPositionOffsetsRef.current.z,
    positionSpringConfig,
  );

  const baseGroupSpringRotationsRef = useRef({ x: 0, y: 0, z: 0 });
  const baseGroupSpringRotationOffsetsRef = useRef(
    getBaseGroupRotationOffsets(),
  );
  const rotationSpringConfig = { stiffness: 300, damping: 18 };
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

  const innerGroupTargetScale = useSpring(1, { stiffness: 350, damping: 26 });

  const deltaRef = useRef(0);
  const timeRef = useRef(0);
  const scaleTimeRef = useRef(0);
  const scaleShrinkDuration = 0.1;
  useFrame((_, delta) => {
    deltaRef.current = Math.min(delta, 0.1);
    timeRef.current += deltaRef.current;
    const targetDigit = getCurrentDigitAtIndex(digitIndex);
    const currentDigit = currentDigitRef.current;
    if (currentDigit !== targetDigit) {
      currentDigitRef.current = targetDigit;
      const newBaseGroupPositionOffsets = getBaseGroupPositionOffsets();
      const offsetDiffs = {
        x:
          newBaseGroupPositionOffsets.x - baseGroupPositionOffsetsRef.current.x,
        y:
          newBaseGroupPositionOffsets.y - baseGroupPositionOffsetsRef.current.y,
        z:
          newBaseGroupPositionOffsets.z - baseGroupPositionOffsetsRef.current.z,
      };
      baseGroupPositionOffsetsRef.current = newBaseGroupPositionOffsets;
      baseGroupTargetXPosition.set(baseGroupPositionOffsetsRef.current.x);
      baseGroupTargetYPosition.set(baseGroupPositionOffsetsRef.current.y);
      baseGroupTargetZPosition.set(baseGroupPositionOffsetsRef.current.z);

      const newBaseGroupRotationOffsets = getBaseGroupRotationOffsets();
      baseGroupSpringRotationOffsetsRef.current = newBaseGroupRotationOffsets;
      if (Math.abs(offsetDiffs.y) > 0.4) {
        baseGroupSpringRotationsRef.current.x +=
          Math.sign(offsetDiffs.y) * Math.PI * 2;
      } else if (Math.abs(offsetDiffs.x) > 0.1) {
        baseGroupSpringRotationsRef.current.y +=
          Math.sign(offsetDiffs.x) * Math.PI * 2;
      }
      baseGroupTargetXRotation.set(
        baseGroupSpringRotationOffsetsRef.current.x +
          baseGroupSpringRotationsRef.current.x,
      );
      baseGroupTargetYRotation.set(
        baseGroupSpringRotationOffsetsRef.current.y +
          baseGroupSpringRotationsRef.current.y,
      );
      baseGroupTargetZRotation.set(
        baseGroupSpringRotationOffsetsRef.current.z +
          baseGroupSpringRotationsRef.current.z,
      );

      innerGroupTargetScale.set(-1);
      scaleTimeRef.current = 0;
    }

    if (scaleTimeRef.current >= scaleShrinkDuration) {
      innerGroupTargetScale.set(1);
      scaleTimeRef.current = -99999;
    }

    if (baseGroupRef.current) {
      baseGroupRef.current.position.x =
        initialBaseGroupPosition.x +
        baseGroupTargetXPosition.get() +
        Math.sin(timeRef.current * 0.5 + randomValues.x * Math.PI * 2) * 0.02;
      baseGroupRef.current.position.y =
        baseGroupTargetYPosition.get() +
        Math.sin(timeRef.current * 0.5 + randomValues.y * Math.PI * 2) * 0.09;
      baseGroupRef.current.position.z =
        baseGroupTargetZPosition.get() +
        Math.sin(timeRef.current * 0.5 + randomValues.z * Math.PI * 2) * 0.02;

      baseGroupRef.current.rotation.x =
        baseGroupTargetXRotation.get() +
        Math.sin(timeRef.current * 0.2 + randomValues.x * Math.PI * 2) * 0.07;
      baseGroupRef.current.rotation.y =
        baseGroupTargetYRotation.get() +
        Math.sin(timeRef.current * 0.2 + randomValues.y * Math.PI * 2) * 0.08;
      baseGroupRef.current.rotation.z =
        baseGroupTargetZRotation.get() +
        Math.sin(timeRef.current * 0.2 + randomValues.z * Math.PI * 2) * 0.02;
    }

    if (innerGroupRef.current) {
      innerGroupRef.current.scale.setScalar(
        Math.max(0.1, innerGroupTargetScale.get()),
      );
    }

    scaleTimeRef.current += deltaRef.current;

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

    digitSpringScales[digitIndex] = innerGroupTargetScale.get();
  });

  return (
    <group
      ref={baseGroupRef}
      position={initialBaseGroupPosition}
      onClick={() => console.log(baseGroupRef.current)}
    >
      <Box args={[0.5, 0.5, 0.5]} visible={false} />
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
          <SpringyDigitSegmentObjects
            key={segmentIndex}
            segmentIndex={segmentIndex}
          />
        ))}
      </group>
    </group>
  );
}

function VoxelAttractor() {
  const boundingBoxCenters = useMemo(() => {
    return Array.from({ length: 6 }, () => new THREE.Vector3());
  }, []);
  const boundingBoxBValues = useMemo(() => {
    return Array.from({ length: 6 }, () => new THREE.Vector3());
  }, []);
  const { segmentAPositions, segmentBPositions } = useMemo(() => {
    const segmentAPositionsArray: THREE.Vector3[] = [];
    const segmentBPositionsArray: THREE.Vector3[] = [];
    for (let digitIndex = 0; digitIndex < 6; digitIndex++) {
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
  const digitSpringScales = useMemo(() => {
    return Array.from({ length: 6 }, () => 1);
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
      uActiveSegments: { value: getActiveSegments() },
      uSegmentAPositions: { value: segmentAPositions },
      uSegmentBPositions: { value: segmentBPositions },
      uDigitSpringScales: { value: digitSpringScales },
      // uLightColor: { value: new THREE.Color("#101010") },
      uLightColor01: { value: new THREE.Color("#ffa3a3") },
      uLightColor02: { value: new THREE.Color("#ffc99d") },
      // uMaterialColor: { value: new THREE.Color("#b4b4b4") },
      uMaterialColor: { value: new THREE.Color("#ffffff") },
      uMaterialSubsurfaceColor: { value: new THREE.Color("#ff0039") },
      // uSubsurfaceRadius: { value: 2.42 },
      uSubsurfaceRadius: { value: 1.72 },
      uRoughness: { value: 0.0 },
      uRefractionIndex: { value: 2.17 },
      uFogColor: { value: new THREE.Color("#c76b80") },
      uSkyLowColor: { value: new THREE.Color("#000000") },
      uSkyHighColor: { value: new THREE.Color("#000000") },
      uPlatformColor: { value: new THREE.Color("#be0225") },
      uSeaLowColor: { value: new THREE.Color("#c73e4e") },
      uSeaHighColor: { value: new THREE.Color("#02153b") },
      uNormalMix: { value: 0.68 },
      uSkyRangeMin: { value: 0.0 },
      uSkyRangeMax: { value: 0.2 },
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
      value: "#ff0039",
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
      value: "#000000",
      onChange: (value) => {
        uniforms.uSkyLowColor.value = new THREE.Color(value);
      },
    },
    skyHighColor: {
      value: "#000000",
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

  useFrame(({ camera }, delta) => {
    uDeltaRef.current = Math.min(delta, 0.1);
    uTimeRef.current += uDeltaRef.current;

    camera.getWorldPosition(cameraPosition);

    uniforms.uDelta.value = uDeltaRef.current;
    uniforms.uTime.value = uTimeRef.current;
    uniforms.uCameraPosition.value.copy(cameraPosition);
    uniforms.uResolution.value.set(window.innerWidth, window.innerHeight);
    uniforms.uBoundingBoxCenters.value = boundingBoxCenters;
    uniforms.uBoundingBoxBValues.value = boundingBoxBValues;
    uniforms.uSegmentAPositions.value = segmentAPositions;
    uniforms.uSegmentBPositions.value = segmentBPositions;
    uniforms.uDigitSpringScales.value = digitSpringScales;
  });

  useEffect(() => {
    const unsubCurrentTimeValue = useAppStore.subscribe(
      (state) => state.currentTimeValue,
      (value, previousValue) => {
        const timeString = value.toFormat("HHmmss");
        const prevTimeString = previousValue.toFormat("HHmmss");

        if (timeString === prevTimeString) return;

        const timeoutId = setTimeout(() => {
          uniforms.uActiveSegments.value = getActiveSegments();
        }, 100);

        return () => {
          clearTimeout(timeoutId);
        };
      },
    );
    return () => {
      unsubCurrentTimeValue();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <group>
      {[0, 1, 2, 3, 4, 5].map((digitIndex) => (
        <SpringyDigit
          key={digitIndex}
          digitIndex={digitIndex}
          boundingBoxCenters={boundingBoxCenters}
          boundingBoxBValues={boundingBoxBValues}
          segmentAPositions={segmentAPositions}
          segmentBPositions={segmentBPositions}
          digitSpringScales={digitSpringScales}
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

function ActiveSegmentsListener() {
  useEffect(() => {
    const unsubCurrentTimeValue = useAppStore.subscribe(
      (state) => state.currentTimeValue,
      () => {
        useVoxelAttractorStore.setState({
          activeSegments: getActiveSegments(),
        });
      },
    );
    return () => {
      unsubCurrentTimeValue();
    };
  }, []);

  return null;
}

export default function VoxelAttractorScene() {
  const canvasRef = useRef<HTMLCanvasElement>(null!);

  useEffect(() => {
    document.title = "Clock Envy - Voxel Attractor";

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
        shadows
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
          {/* <Environment preset="lobby" resolution={2048} /> */}
          <VoxelAttractor />
          <ActiveSegmentsListener />
        </Suspense>
        <OrbitControls makeDefault />
      </Canvas>
      <Loader />
    </>
  );
}
