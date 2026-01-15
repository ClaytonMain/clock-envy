import { Instance, Instances, Loader, OrbitControls } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
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
const SUB_SEGMENT_COUNT = 3;
const SUB_SEGMENT_RADIUS = 0.2;

const PARTICLE_COUNT = 6 * 7 * SUB_SEGMENT_COUNT;

function getParticleTargetPosition(
  digitIndex: number,
  segmentIndex: number,
  subSegmentIndex: number,
  increment: number,
): THREE.Vector3 {
  const digitOffset = DIGIT_CENTER_OFFSETS[digitIndex];
  const activeSegments = useVoxelAttractorStore
    .getState()
    .activeSegments.slice(digitIndex * 7, digitIndex * 7 + 7);
  let targetSegmentIndex = segmentIndex;
  while (activeSegments[targetSegmentIndex] === 0) {
    targetSegmentIndex = (targetSegmentIndex + 7 + increment) % 7;
  }
  const segmentPos = new THREE.Vector3(
    digitOffset + SEGMENT_OFFSETS[targetSegmentIndex].x,
    SEGMENT_OFFSETS[targetSegmentIndex].y,
    0,
  );
  const orientation = SEGMENT_ORIENTATIONS[targetSegmentIndex];
  const subSegmentOffset = new THREE.Vector3(
    orientation === "H"
      ? (subSegmentIndex / (SUB_SEGMENT_COUNT - 1) - 0.5) *
        SEGMENT_X_OFFSET *
        0.75 *
        2
      : 0,
    orientation === "V"
      ? (subSegmentIndex / (SUB_SEGMENT_COUNT - 1) - 0.5) *
        SEGMENT_Y_OFFSET *
        0.75
      : 0,
    0,
  );
  return segmentPos.clone().add(subSegmentOffset);
}

function Particle({
  position,
  velocity,
  digitIndex,
  segmentIndex,
  subSegmentIndex,
  uniformPosition,
}: {
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  digitIndex: number;
  segmentIndex: number;
  subSegmentIndex: number;
  uniformPosition: THREE.Vector3;
}) {
  const particleRef = useRef<THREE.Mesh>(null!);
  const particleVelocityRef = useRef(velocity);

  const increment = useMemo(() => {
    return Math.floor(Math.random() * 2 + 1) * (Math.random() < 0.5 ? -1 : 1);
  }, []);

  const randVectorRef = useRef(
    new THREE.Vector3(
      Math.random() * 0.5 - 0.25,
      Math.random() * 0.5 - 0.25,
      Math.random() * 0.5 - 0.25,
    ),
  );
  const targetPositionRef = useRef(
    getParticleTargetPosition(
      digitIndex,
      segmentIndex,
      subSegmentIndex,
      increment,
    ),
  );

  useFrame((_, delta) => {
    targetPositionRef.current.copy(
      getParticleTargetPosition(
        digitIndex,
        segmentIndex,
        subSegmentIndex,
        increment,
      ),
    );
    if (particleRef.current) {
      const toTarget = targetPositionRef.current
        .clone()
        .sub(particleRef.current.position);
      const distanceToTarget = toTarget.length();
      if (distanceToTarget > SUB_SEGMENT_RADIUS) {
        particleVelocityRef.current.add(
          toTarget
            .normalize()
            .multiplyScalar(
              Math.min(
                delta * Math.pow(distanceToTarget - SUB_SEGMENT_RADIUS, 0.5),
                0.5,
              ),
            ),
        );
      }
    }
    randVectorRef.current.set(
      Math.max(
        -0.1,
        Math.min(0.1, randVectorRef.current.x + (Math.random() - 0.5) * delta),
      ),
      Math.max(
        -0.1,
        Math.min(0.1, randVectorRef.current.y + (Math.random() - 0.5) * delta),
      ),
      Math.max(
        -0.1,
        Math.min(0.1, randVectorRef.current.z + (Math.random() - 0.5) * delta),
      ),
    );
    particleVelocityRef.current.add(
      randVectorRef.current.clone().multiplyScalar(delta),
    );
    particleVelocityRef.current.multiplyScalar(
      0.9 * (1 - Math.min(delta, 0.1)),
    );
    particleRef.current.position.add(particleVelocityRef.current);
    uniformPosition.copy(particleRef.current.position);
  });

  return <Instance ref={particleRef} position={position} visible={false} />;
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
      uParticlePositions: {
        value: Array.from(
          { length: PARTICLE_COUNT },
          () => new THREE.Vector3(),
        ),
      },
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
      const subSegmentIndex = Math.floor(i / (6 * 7)) % SUB_SEGMENT_COUNT;
      const segmentPosition = new THREE.Vector3(
        DIGIT_CENTER_OFFSETS[digitIndex] + SEGMENT_OFFSETS[segmentIndex].x,
        SEGMENT_OFFSETS[segmentIndex].y,
        0,
      );
      particles.push({
        segmentIndex: segmentIndex,
        digitIndex: digitIndex,
        subSegmentIndex: subSegmentIndex,
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
            subSegmentIndex={particle.subSegmentIndex}
            uniformPosition={uniforms.uParticlePositions.value[index]}
          />
        ))}
      </Instances>
      {/* {[0, 1, 2, 3, 4, 5].map((digitIndex) => (
        <DigitAttractor
          key={digitIndex}
          digitIndex={digitIndex}
          visible={true}
        />
      ))} */}
      <mesh>
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
          <ActiveSegmentsListener />
        </Suspense>
        <OrbitControls makeDefault />
      </Canvas>
      <Loader />
    </>
  );
}
