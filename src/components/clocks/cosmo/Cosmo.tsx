import { Box, Loader, OrbitControls, useFBO } from "@react-three/drei";
import { Canvas, createPortal, useFrame } from "@react-three/fiber";
import { Suspense, useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import useAppStore from "../../../stores/useAppStore";
import CustomStatsComponent from "../../misc/CustomStatsComponent";
import BlackHoleComponent from "./BlackHoleComponent";
import { FOV } from "./constants/constants";
import cosmoFragmentShader from "./shaders/cosmo/cosmo.frag";
import cosmoVertexShader from "./shaders/cosmo/cosmo.vert";
import type { BlackHoleUniforms } from "./types/types";
import * as UTILS from "./utils/utils";
import { getActiveSegments } from "./utils/utils";

const OFFSET_SCALE = 1.45;
const DIGIT_CENTER_OFFSETS = [
  -3.5 * OFFSET_SCALE,
  -1.5 * OFFSET_SCALE,
  1.5 * OFFSET_SCALE,
  3.5 * OFFSET_SCALE,
];
const SEGMENT_X_OFFSET = 0.7;
const SEGMENT_Y_OFFSET = 2.5;
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
const SEGMENT_THICKNESS = 0.3;

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

  return <object3D position={segmentPosition} name={`pos-${segmentIndex}`} />;
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
  segmentPositions,
  segmentBValues,
  activeSegments,
}: {
  digitIndex: number;
  boundingBoxCenters: THREE.Vector3[];
  boundingBoxBValues: THREE.Vector3[];
  segmentPositions: THREE.Vector3[];
  segmentBValues: THREE.Vector3[];
  activeSegments: number[];
}) {
  const baseGroupRef = useRef<THREE.Group>(null!);
  const innerGroupRef = useRef<THREE.Group>(null!);
  const currentDigitsRef = useRef(getCurrentDigits());
  const innerGroupXOffset = useRef(
    getInnerGroupXOffset(currentDigitsRef.current[digitIndex]),
  );

  // digitCenter does not change.
  const digitCenter = useMemo(() => {
    return new THREE.Vector3(DIGIT_CENTER_OFFSETS[digitIndex], 0, 0);
  }, [digitIndex]);

  const deltaRef = useRef(0);
  const timeRef = useRef(0);

  useFrame((_, delta) => {
    deltaRef.current = Math.min(delta, 0.1);
    timeRef.current = (timeRef.current + deltaRef.current) % 100000;

    const targetDigits = getCurrentDigits();
    const currentDigits = currentDigitsRef.current;
    const changedDigitCount = getChangedDigitCount(currentDigits, targetDigits);

    if (changedDigitCount > 0) {
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

    if (baseGroupRef.current) {
      baseGroupRef.current.position.x = digitCenter.x;
      baseGroupRef.current.position.y = digitCenter.y;
      baseGroupRef.current.position.z = digitCenter.z;
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
        const posObject = baseGroupRef.current.getObjectByName(
          `pos-${segmentIndex}`,
        );
        if (posObject) {
          const globalSegmentPosition = new THREE.Vector3();
          posObject.getWorldPosition(globalSegmentPosition);
          const globalSegmentIndex = digitIndex * 7 + segmentIndex;
          segmentPositions[globalSegmentIndex].copy(globalSegmentPosition);
          segmentBValues[globalSegmentIndex].copy(
            SEGMENT_ORIENTATIONS[segmentIndex] === "H"
              ? new THREE.Vector3(
                  SEGMENT_X_OFFSET + SEGMENT_THICKNESS,
                  SEGMENT_THICKNESS,
                  SEGMENT_THICKNESS / 2,
                )
              : new THREE.Vector3(
                  SEGMENT_THICKNESS,
                  SEGMENT_Y_OFFSET / 2 + SEGMENT_THICKNESS,
                  SEGMENT_THICKNESS / 2,
                ),
          );
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

function Cosmo() {
  const boundingBoxCenters = useMemo(() => {
    return Array.from({ length: 4 }, () => new THREE.Vector3());
  }, []);
  const boundingBoxBValues = useMemo(() => {
    return Array.from({ length: 4 }, () => new THREE.Vector3());
  }, []);
  const { segmentPositions, segmentBValues } = useMemo(() => {
    const segmentPositionsArray: THREE.Vector3[] = [];
    const segmentBValuesArray: THREE.Vector3[] = [];
    for (let digitIndex = 0; digitIndex < 4; digitIndex++) {
      const digitOffset = DIGIT_CENTER_OFFSETS[digitIndex];
      for (let segmentIndex = 0; segmentIndex < 7; segmentIndex++) {
        const segmentPos = new THREE.Vector3(
          digitOffset + SEGMENT_OFFSETS[segmentIndex].x,
          SEGMENT_OFFSETS[segmentIndex].y,
          0,
        );
        const orientation = SEGMENT_ORIENTATIONS[segmentIndex];
        const segmentPosition = new THREE.Vector3();
        const segmentBValue = new THREE.Vector3();
        if (orientation === "H") {
          segmentPosition.set(
            segmentPos.x - SEGMENT_X_OFFSET * 0.5,
            segmentPos.y,
            0,
          );
          segmentBValue.set(
            segmentPos.x + SEGMENT_X_OFFSET * 0.5,
            segmentPos.y,
            0,
          );
        } else {
          segmentPosition.set(
            segmentPos.x,
            segmentPos.y - SEGMENT_Y_OFFSET * 0.5,
            0,
          );
          segmentBValue.set(
            segmentPos.x,
            segmentPos.y + SEGMENT_Y_OFFSET * 0.5,
            0,
          );
        }
        segmentPositionsArray.push(segmentPosition);
        segmentBValuesArray.push(segmentBValue);
      }
    }
    return {
      segmentPositions: segmentPositionsArray,
      segmentBValues: segmentBValuesArray,
    };
  }, []);
  const activeSegments = useMemo(() => {
    return getActiveSegments();
  }, []);
  const colonCenters = useMemo(() => {
    return [new THREE.Vector3(0.0, 0.75, 0), new THREE.Vector3(0.0, -0.75, 0)];
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
      uSegmentPositions: { value: segmentPositions },
      uSegmentBValues: { value: segmentBValues },
      uColonCenters: { value: colonCenters },
      uColonScales: { value: [1.0, 1.0] },
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Black hole setup.
  // const blackHoleScene = useMemo(() => new THREE.Scene(), []);
  // const blackHoleRenderTarget = useFBO(
  //   1920,
  //   1080,
  //   {
  //     minFilter: THREE.NearestFilter,
  //     magFilter: THREE.NearestFilter,
  //     format: THREE.RGBAFormat,
  //     stencilBuffer: false,
  //     depthBuffer: false,
  //     type: THREE.UnsignedByteType,
  //   }
  // )
  const blackHoleUniforms: BlackHoleUniforms = useMemo(() => {
    return {
      uTime: { value: 0 },
      uCameraPosition: { value: new THREE.Vector3() },
      uResolution: {
        value: new THREE.Vector2(window.innerWidth, window.innerHeight),
      },
      uGlZ: { value: -1 / (2 * Math.tan(FOV * (Math.PI / 180) * 0.5)) },
    };
  }, []);

  const cameraPosition = new THREE.Vector3();
  const uDeltaRef = useRef(0);
  const uTimeRef = useRef(0);

  useFrame(({ camera, gl }, delta) => {
    uDeltaRef.current = Math.min(delta, 0.1);
    uTimeRef.current = (uTimeRef.current + uDeltaRef.current) % 100000;

    camera.getWorldPosition(cameraPosition);

    uniforms.uDelta.value = uDeltaRef.current;
    uniforms.uTime.value = uTimeRef.current;
    uniforms.uCameraPosition.value.copy(cameraPosition);
    uniforms.uResolution.value.set(window.innerWidth, window.innerHeight);
    uniforms.uBoundingBoxCenters.value = boundingBoxCenters;
    uniforms.uBoundingBoxBValues.value = boundingBoxBValues;
    uniforms.uSegmentPositions.value = segmentPositions;
    uniforms.uSegmentBValues.value = segmentBValues;
    uniforms.uActiveSegments.value = activeSegments;

    blackHoleUniforms.uTime.value = uTimeRef.current;
    blackHoleUniforms.uCameraPosition.value.copy(cameraPosition);
    blackHoleUniforms.uResolution.value.set(
      window.innerWidth,
      window.innerHeight,
    );
  });

  return (
    <group>
      {/* {[0, 1, 2, 3].map((digitIndex) => (
        <Digit
          key={digitIndex}
          digitIndex={digitIndex}
          boundingBoxCenters={boundingBoxCenters}
          boundingBoxBValues={boundingBoxBValues}
          segmentPositions={segmentPositions}
          segmentBValues={segmentBValues}
          activeSegments={activeSegments}
        />
      ))}
      <mesh visible={true}>
        <planeGeometry />
        <shaderMaterial
          vertexShader={cosmoVertexShader}
          fragmentShader={cosmoFragmentShader}
          uniforms={uniforms}
          toneMapped={false}
        />
      </mesh>
      {createPortal(<BlackHoleComponent />, blackHoleScene)} */}
      <BlackHoleComponent uniforms={blackHoleUniforms} />
    </group>
  );
}

export default function CosmoScene() {
  const canvasRef = useRef<HTMLCanvasElement>(null!);

  useEffect(() => {
    document.title = "Clock Envy - Cosmo";
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
          position: [0.01, 0.5, 8],
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
          <Cosmo />
        </Suspense>
        <OrbitControls makeDefault />
      </Canvas>
      <Loader />
    </>
  );
}
