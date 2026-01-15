import {
  Icosahedron,
  Instance,
  Instances,
  Loader,
  OrbitControls,
} from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import { Suspense, useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import useAppStore from "../../../stores/useAppStore";
import CustomStatsComponent from "../../misc/CustomStatsComponent";
import { FOV } from "./constants/constants";
import voxelsFragmentShader from "./shaders/voxels/voxels.frag";
import voxelsVertexShader from "./shaders/voxels/voxels.vert";

const OFFSET_SCALE = 1.2;
const DIGIT_CENTER_OFFSETS = [
  -5.0 * OFFSET_SCALE,
  -3.0 * OFFSET_SCALE,
  -1.0 * OFFSET_SCALE,
  1.0 * OFFSET_SCALE,
  3.0 * OFFSET_SCALE,
  5.0 * OFFSET_SCALE,
];
const SEGMENT_X_OFFSET = 0.7;
const SEGMENT_Y_OFFSET = 1.2;
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
const SEGMENT_RADIUS = 0.2;

const PARTICLE_COUNT = 500;

function sdgSegment(
  p: THREE.Vector3,
  a: THREE.Vector3,
  b: THREE.Vector3,
  r: number,
): THREE.Vector4 {
  const ba = b.clone().sub(a);
  const pa = p.clone().sub(a);
  const h = Math.max(0.0, Math.min(1.0, pa.clone().dot(ba) / ba.lengthSq()));
  const q = pa.clone().sub(ba.clone().multiplyScalar(h));
  const d = q.length();
  return new THREE.Vector4(d - r, q.x / d, q.y / d, q.z / d);
}

function getActiveSegments(): number[] {
  const timeValue = useAppStore.getState().currentTimeValue;
  const segments: number[] = [];
  for (let i = 0; i < 6; i++) {
    const char = timeValue.toFormat("HHmmss").charAt(i);
    const segmentMap: Record<string, number[]> = {
      "0": [1, 1, 1, 1, 1, 1, 0],
      "1": [0, 1, 1, 0, 0, 0, 0],
      "2": [1, 1, 0, 1, 1, 0, 1],
      "3": [1, 1, 1, 1, 0, 0, 1],
      "4": [0, 1, 1, 0, 0, 1, 1],
      "5": [1, 0, 1, 1, 0, 1, 1],
      "6": [1, 0, 1, 1, 1, 1, 1],
      "7": [1, 1, 1, 0, 0, 0, 0],
      "8": [1, 1, 1, 1, 1, 1, 1],
      "9": [1, 1, 1, 1, 0, 1, 1],
    };
    segments.push(...(segmentMap[char] || [0, 0, 0, 0, 0, 0, 0]));
  }
  return segments;
}

function getClockSdg(
  p: THREE.Vector3,
  activeSegments: number[],
  pDigitIndex: number,
  pSegmentIndex: number,
): THREE.Vector4 {
  // const minSdg = new THREE.Vector4(Infinity, 0, 0, 0);
  // let minDigitOffset = 9999;
  // let minDigitOffsetIndex = -1;
  // for (let digitIndex = 0; digitIndex < 6; digitIndex++) {
  //   const digitOffset = DIGIT_CENTER_OFFSETS[digitIndex];
  //   const distanceToDigit = p.distanceTo(new THREE.Vector3(digitOffset, 0, 0));
  //   if (distanceToDigit < minDigitOffset) {
  //     minDigitOffset = distanceToDigit;
  //     minDigitOffsetIndex = digitIndex;
  //   }
  // }

  // const digitOffset = DIGIT_CENTER_OFFSETS[minDigitOffsetIndex];
  // for (let segmentIndex = 0; segmentIndex < 7; segmentIndex++) {
  //   if (activeSegments[minDigitOffsetIndex * 7 + segmentIndex] === 0) continue;

  //   const segmentPos = new THREE.Vector3(
  //     digitOffset + SEGMENT_OFFSETS[segmentIndex].x,
  //     SEGMENT_OFFSETS[segmentIndex].y,
  //     0,
  //   );
  //   const orientation = SEGMENT_ORIENTATIONS[segmentIndex];
  //   const segmentOffset = new THREE.Vector3(
  //     orientation === "H" ? -SEGMENT_X_OFFSET : 0,
  //     orientation === "V" ? -SEGMENT_Y_OFFSET / 2 : 0,
  //     0,
  //   );
  //   const sdg = sdgSegment(
  //     p,
  //     segmentPos.clone().add(segmentOffset),
  //     segmentPos.clone().sub(segmentOffset),
  //     SEGMENT_RADIUS,
  //   );
  //   if (sdg.x < minSdg.x) {
  //     minSdg.copy(sdg);
  //   }
  // }

  const digitOffset = DIGIT_CENTER_OFFSETS[pDigitIndex];
  const activeDigitSegments = activeSegments.slice(
    pDigitIndex * 7,
    pDigitIndex * 7 + 7,
  );
  let useSegmentIndex = pSegmentIndex;
  while (activeDigitSegments[useSegmentIndex] === 0) {
    useSegmentIndex = (useSegmentIndex + 1) % 7;
  }
  const segmentPos = new THREE.Vector3(
    digitOffset + SEGMENT_OFFSETS[useSegmentIndex].x,
    SEGMENT_OFFSETS[useSegmentIndex].y,
    0,
  );
  const orientation = SEGMENT_ORIENTATIONS[useSegmentIndex];
  const segmentOffset = new THREE.Vector3(
    orientation === "H" ? -SEGMENT_X_OFFSET : 0,
    orientation === "V" ? -SEGMENT_Y_OFFSET / 2 : 0,
    0,
  );
  const sdg = sdgSegment(
    p,
    segmentPos.clone().add(segmentOffset),
    segmentPos.clone().sub(segmentOffset),
    SEGMENT_RADIUS,
  );

  return sdg;
}

function DigitAttractor({
  digitIndex,
  visible = false,
}: {
  digitIndex: number;
  visible?: boolean;
}) {
  return (
    <group
      position={[DIGIT_CENTER_OFFSETS[digitIndex], 0, 0]}
      visible={visible}
    >
      {SEGMENT_OFFSETS.map((offset, segmentIndex) => (
        <Icosahedron
          key={segmentIndex}
          args={[0.1, 0]}
          position={[offset.x, offset.y, 0]}
        />
      ))}
    </group>
  );
}

function Particle({
  position,
  velocity,
  digitIndex,
  segmentIndex,
}: {
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  digitIndex: number;
  segmentIndex: number;
}) {
  const particleRef = useRef<THREE.Mesh>(null!);
  const particleVelocityRef = useRef(velocity);

  useFrame((_, delta) => {
    const sdg = getClockSdg(
      particleRef.current.position,
      getActiveSegments(),
      digitIndex,
      segmentIndex,
    );
    if (sdg.x > 0) {
      particleVelocityRef.current.add(
        new THREE.Vector3(sdg.y, sdg.z, sdg.w).multiplyScalar(
          -Math.min(delta, 0.1) * sdg.x,
          // -Math.min(delta, 0.1) * 0.7,
          // -Math.min(delta, 0.1) * (1 - (1 / Math.exp(sdg.x)) * 5),
        ),
      );
    }
    particleVelocityRef.current.multiplyScalar(
      0.95 * (1 - Math.min(delta, 0.1)),
    );
    particleRef.current.position.add(particleVelocityRef.current);
  });

  return <Instance ref={particleRef} position={position} />;
}

function VoxelAttractor() {
  const uniforms = useMemo(() => {
    return {
      uDelta: { value: 0 },
      uTime: { value: 0 },
      uCameraPosition: { value: new THREE.Vector3() },
      uResolution: { value: new THREE.Vector2() },
      uGlZ: { value: -1 / (2 * Math.tan(FOV * (Math.PI / 180) * 0.5)) },
      uActiveSegments: { value: getActiveSegments() },
    };
  }, []);

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
  });

  useEffect(() => {
    const unsubCurrentTimeValue = useAppStore.subscribe(
      (state) => state.currentTimeValue,
      (value, previousValue) => {
        const timeString = value.toFormat("HHmmss");
        const prevTimeString = previousValue.toFormat("HHmmss");

        if (timeString === prevTimeString) return;

        uniforms.uActiveSegments.value = getActiveSegments();
      },
    );
    return () => {
      unsubCurrentTimeValue();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const initialParticles = useMemo(() => {
    const particles = [];
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const digitIndex = i % 6;
      const segmentIndex = Math.floor(i / 6) % 7;
      const segmentPosition = new THREE.Vector3(
        DIGIT_CENTER_OFFSETS[digitIndex] + SEGMENT_OFFSETS[segmentIndex].x,
        SEGMENT_OFFSETS[segmentIndex].y,
        0,
      );

      particles.push({
        segmentIndex: segmentIndex,
        digitIndex: digitIndex,
        position: new THREE.Vector3(
          segmentPosition.x + (Math.random() - 0.5) * 0.5,
          segmentPosition.y + (Math.random() - 0.5) * 0.5,
          (Math.random() - 0.5) * 0.5,
        ),
        velocity: new THREE.Vector3(
          Math.random() * 0.5 - 0.25,
          Math.random() * 0.5 - 0.25,
          Math.random() * 0.5 - 0.25,
        ),
      });
    }
    return particles;
  }, []);

  return (
    <group>
      <Instances limit={PARTICLE_COUNT} range={PARTICLE_COUNT}>
        <icosahedronGeometry args={[0.05, 0]} />
        <meshBasicMaterial color="white" wireframe />
        {initialParticles.map((particle, index) => (
          <Particle
            key={index}
            position={particle.position}
            velocity={particle.velocity}
            digitIndex={particle.digitIndex}
            segmentIndex={particle.segmentIndex}
          />
        ))}
      </Instances>
      {[0, 1, 2, 3, 4, 5].map((digitIndex) => (
        <DigitAttractor
          key={digitIndex}
          digitIndex={digitIndex}
          visible={true}
        />
      ))}
      <mesh visible={false}>
        <planeGeometry />
        <shaderMaterial
          vertexShader={voxelsVertexShader}
          fragmentShader={voxelsFragmentShader}
          uniforms={uniforms}
        />
      </mesh>
    </group>
  );
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
          position: [0, 5, 10],
          // position: [0, 0, 10],
          fov: FOV,
        }}
        style={{
          touchAction: "none",
        }}
      >
        <CustomStatsComponent />
        <Suspense fallback={null}>
          {/* <Environment preset="lobby" resolution={2048} /> */}
          <VoxelAttractor />
        </Suspense>
        <OrbitControls makeDefault />
      </Canvas>
      <Loader />
    </>
  );
}
