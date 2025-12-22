import { Instance, Instances, Loader, Plane, Trail } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import { useControls } from "leva";
import { Suspense, useEffect, useRef } from "react";
import * as THREE from "three";
import useAppStore from "../../../stores/useAppStore";
import useFourierStore from "../../../stores/useFourierStore";
import CustomStatsComponent from "../../misc/CustomStatsComponent";
import { RENDER_EPICYCLES, TOTAL_EPICYCLES } from "./constants/constants";
import useGPGPU from "./useGPGPU";
import {
  getEpicycleData,
  getFourier,
  getHourMinuteSecondPoints,
} from "./utils/utils";

function EpicycleCircle({ index }: { index: number }) {
  const instanceRef = useRef<THREE.InstancedMesh>(null!);

  useFrame(() => {
    const epicycleData = useFourierStore.getState().epicycleData[index];
    if (instanceRef.current) {
      instanceRef.current.position.set(
        epicycleData.center.x,
        epicycleData.center.y,
        0,
      );
      instanceRef.current.scale.set(
        epicycleData.scale * 2,
        epicycleData.scale * 2,
        1,
      );
      instanceRef.current.rotation.set(0, 0, epicycleData.rotation);
    }
  });

  return <Instance ref={instanceRef} />;
}

function EpicycleLine({ index }: { index: number }) {
  const instanceRef = useRef<THREE.InstancedMesh>(null!);

  useFrame(() => {
    const epicycleData = useFourierStore.getState().epicycleData[index];
    if (instanceRef.current) {
      const center = epicycleData.center;
      const outerPoint = epicycleData.outerPoint;
      const midPoint = new THREE.Vector2(
        (center.x + outerPoint.x) / 2,
        (center.y + outerPoint.y) / 2,
      );
      const length = center.distanceTo(outerPoint);
      const angle = Math.atan2(
        outerPoint.y - center.y,
        outerPoint.x - center.x,
      );
      instanceRef.current.position.set(midPoint.x, midPoint.y, 0);
      instanceRef.current.scale.set(length, 0.01, 1);
      instanceRef.current.rotation.set(0, 0, angle);
    }
  });

  return <Instance ref={instanceRef} />;
}

const uniforms = {
  uBackgroundColor: { value: new THREE.Color("#000000") },
  uEpicycleColor: { value: new THREE.Color("#ffffff") },
  uRadiusColor: { value: new THREE.Color("#888888") },
  uTrailColor: { value: new THREE.Color("#ff0000") },
};

function Fourier() {
  const meshRef = useRef<THREE.Mesh>(null!);
  const fourierDataDisplayPlaneRef = useRef<THREE.Mesh>(null!);
  const { gpgpuTexture } = useGPGPU();

  const controlValues = useControls({
    uBackgroundColor: {
      value: `#${uniforms.uBackgroundColor.value.getHexString()}`,
      onEdit: (value: string) => {
        uniforms.uBackgroundColor.value.set(new THREE.Color(value));
      },
    },
    uEpicycleColor: {
      value: `#${uniforms.uEpicycleColor.value.getHexString()}`,
      onEdit: (value: string) => {
        uniforms.uEpicycleColor.value.set(new THREE.Color(value));
      },
    },
    uRadiusColor: {
      value: `#${uniforms.uRadiusColor.value.getHexString()}`,
      onEdit: (value: string) => {
        uniforms.uRadiusColor.value.set(new THREE.Color(value));
      },
    },
    uTrailColor: {
      value: `#${uniforms.uTrailColor.value.getHexString()}`,
      onEdit: (value: string) => {
        uniforms.uTrailColor.value.set(new THREE.Color(value));
      },
    },
  });

  useEffect(() => {
    const points = getHourMinuteSecondPoints({ totalPoints: TOTAL_EPICYCLES });
    const fourier = getFourier(points);
    const { epicycleData } = getEpicycleData(fourier, 0, RENDER_EPICYCLES);
    useFourierStore.setState({ epicycleData });
  }, []);

  const framerate = 60;
  const frameDurationRef = useRef(0);
  const timeRef = useRef(0);
  useFrame((_, delta) => {
    frameDurationRef.current += Math.min(delta, 0.1);
    if (frameDurationRef.current < 1 / framerate) {
      return;
    }
    frameDurationRef.current = 0;
    timeRef.current += (2 * Math.PI) / TOTAL_EPICYCLES;
    if (timeRef.current > 2 * Math.PI) {
      timeRef.current = 0;
    }
    const points = getHourMinuteSecondPoints({ totalPoints: TOTAL_EPICYCLES });
    const fourier = getFourier(points);
    const { epicycleData, position } = getEpicycleData(
      fourier,
      timeRef.current,
      RENDER_EPICYCLES,
    );
    meshRef.current.position.set(position.x, position.y, 0);
    useFourierStore.setState({ epicycleData });

    if (fourierDataDisplayPlaneRef.current && gpgpuTexture.current) {
      // @ts-expect-error 'map' does exist.
      fourierDataDisplayPlaneRef.current.material.map = gpgpuTexture.current;
      fourierDataDisplayPlaneRef.current.material.needsUpdate = true;
    }
  });

  return (
    <group scale={1}>
      <Plane
        ref={fourierDataDisplayPlaneRef}
        args={[1, 1]}
        position={[0, 0, -0.01]}
      />
      {/* <meshBasicMaterial transparent={true} />
      </Plane> */}
      {/* <Instances limit={RENDER_EPICYCLES} range={RENDER_EPICYCLES}>
        <planeGeometry args={[1, 1]} />
        <meshBasicMaterial color="blue" wireframe />
        {Array.from({ length: RENDER_EPICYCLES }).map((_, index) => (
          <EpicycleCircle index={index} key={index} />
        ))}
      </Instances> */}
      <Instances limit={RENDER_EPICYCLES} range={RENDER_EPICYCLES}>
        <planeGeometry args={[1, 1]} />
        <meshBasicMaterial color="red" />
        {Array.from({ length: RENDER_EPICYCLES }).map((_, index) => (
          <EpicycleLine index={index} key={index} />
        ))}
      </Instances>
      <Trail color="hotpink" length={50} width={1} interval={5}>
        <mesh ref={meshRef}>
          <sphereGeometry args={[0.005, 16, 16]} />
          <meshBasicMaterial color="yellow" />
        </mesh>
      </Trail>
      {/* <Instances limit={numPoints} range={numPoints}>
        <planeGeometry args={[0.1, 0.1]} />
        <meshBasicMaterial color="yellow" />
        {points.map((value, index) => (
          <Instance position={[value.x, -value.y, -0.1]} key={index} />
        ))}
      </Instances> */}
    </group>
  );
}

export default function FourierScene() {
  const canvasRef = useRef<HTMLCanvasElement>(null!);

  useEffect(() => {
    const unsubInteractionState = useAppStore.subscribe(
      (state) => state.interactionState,
      (value) => {
        if (value === "active") {
          document.body.style.cursor = "default";
        } else {
          document.body.style.cursor = "none";
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
        dpr={Math.min(window.devicePixelRatio, 2)}
        camera={{
          position: [0, 0, 19],
          fov: 8,
        }}
        style={{
          touchAction: "none",
        }}
      >
        <CustomStatsComponent />
        <Suspense fallback={null}>
          {/* <Environment preset="city" resolution={2048} /> */}
          {/* <Environment
            files="./environments/photo_studio_loft_hall_4k.exr"
            resolution={2048}
          /> */}
          <ambientLight intensity={0.1} />
          {/* <OrbitControls makeDefault /> */}
          <Fourier />
        </Suspense>
      </Canvas>
      <Loader />
    </>
  );
}
