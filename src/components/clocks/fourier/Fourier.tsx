import { Instance, Instances, Loader, Trail } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import { Suspense, useEffect, useRef } from "react";
import * as THREE from "three";
import useAppStore from "../../../stores/useAppStore";
import useFourierStore from "../../../stores/useFourierStore";
import CustomStatsComponent from "../../misc/CustomStatsComponent";

// Props to The Coding Train for the Fourier code example.
// https://www.youtube.com/watch?v=7_vKzcgpfvU

type FourierData = {
  re: number;
  im: number;
  freq: number;
  amp: number;
  phase: number;
};

type EpicycleData = {
  center: THREE.Vector2;
  outerPoint: THREE.Vector2;
  scale: number;
  rotation: number;
};

class Complex {
  re: number;
  im: number;
  constructor(re: number, im: number) {
    this.re = re;
    this.im = im;
  }
  add(other: Complex): Complex {
    return new Complex(this.re + other.re, this.im + other.im);
  }
  multiply(other: Complex): Complex {
    return new Complex(
      this.re * other.re - this.im * other.im,
      this.re * other.im + this.im * other.re,
    );
  }
  amplitude(): number {
    return Math.sqrt(this.re * this.re + this.im * this.im);
  }
  phase(): number {
    return Math.atan2(this.im, this.re);
  }
}

function dft(x: Complex[]): FourierData[] {
  const X: FourierData[] = [];
  const N = x.length;
  for (let k = 0; k < N; k++) {
    let sum = new Complex(0, 0);
    for (let n = 0; n < N; n++) {
      const phi = (2 * Math.PI * k * n) / N;
      const c = new Complex(Math.cos(phi), -Math.sin(phi));
      sum = sum.add(x[n].multiply(c));
    }
    sum = new Complex(sum.re / N, sum.im / N);
    X.push({
      re: sum.re,
      im: sum.im,
      freq: k,
      amp: sum.amplitude(),
      phase: sum.phase(),
    });
  }
  return X;
}

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
      instanceRef.current.scale.set(epicycleData.scale, epicycleData.scale, 1);
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
      instanceRef.current.scale.set(length, 0.1, 1);
      instanceRef.current.rotation.set(0, 0, angle);
    }
  });

  return <Instance ref={instanceRef} />;
}

function getEpicycleData(
  fourier: FourierData[],
  time: number,
): { epicycleData: EpicycleData[]; position: THREE.Vector2 } {
  const epicycleData: EpicycleData[] = [];
  let x = 0;
  let y = 0;
  for (let i = 0; i < fourier.length; i++) {
    const prevX = x;
    const prevY = y;
    const freq = fourier[i].freq;
    const radius = fourier[i].amp;
    const phase = fourier[i].phase;
    x += radius * Math.cos(freq * time + phase);
    y -= radius * Math.sin(freq * time + phase);
    epicycleData.push({
      center: new THREE.Vector2(prevX, prevY),
      outerPoint: new THREE.Vector2(x, y),
      scale: radius,
      rotation: -freq * time + phase,
    });
  }
  return { epicycleData, position: new THREE.Vector2(x, y) };
}

function getFourier(pointsToUse: { x: number; y: number }[]) {
  const signal: Complex[] = pointsToUse.map((p) => new Complex(p.x, p.y));
  const fourier = dft(signal);
  fourier.sort((a, b) => b.amp - a.amp);
  return fourier;
}

function getHourMinuteSecondPoints({ totalPoints }: { totalPoints: number }) {
  const currentTimeValue = useAppStore.getState().currentTimeValue;
  const hour =
    (currentTimeValue.toMillis() / (1000 * 60 * 60) +
      currentTimeValue.offset / 60) %
    12;
  const minute = (currentTimeValue.toMillis() / (1000 * 60)) % 60;
  const hourAngle = (hour / 12) * 2 * Math.PI - Math.PI / 2;
  const minuteAngle = (minute / 60) * 2 * Math.PI - Math.PI / 2;

  const pointsPerHand = totalPoints / 2;
  const points: { x: number; y: number }[] = [];
  for (let i = 0; i < pointsPerHand; i++) {
    const maxHourLength = 30;
    const currentLength = -(
      (Math.abs(i - pointsPerHand / 2) - pointsPerHand / 2) /
      pointsPerHand
    );
    points.push({
      x: currentLength * maxHourLength * Math.cos(hourAngle),
      y: currentLength * maxHourLength * Math.sin(hourAngle),
    });
  }
  for (let i = 0; i < pointsPerHand; i++) {
    const maxMinuteLength = 40;
    const currentLength = -(
      (Math.abs(i - pointsPerHand / 2) - pointsPerHand / 2) /
      pointsPerHand
    );
    points.push({
      x: currentLength * maxMinuteLength * Math.cos(minuteAngle),
      y: currentLength * maxMinuteLength * Math.sin(minuteAngle),
    });
  }
  while (points.length < totalPoints) {
    points.push({ x: 0, y: 0 });
  }
  while (points.length > totalPoints) {
    points.pop();
  }
  return points;
}

function Fourier() {
  const numPoints = 500;
  const meshRef = useRef<THREE.Mesh>(null!);

  useEffect(() => {
    const points = getHourMinuteSecondPoints({ totalPoints: numPoints });
    const fourier = getFourier(points);
    const { epicycleData } = getEpicycleData(fourier, 0);
    useFourierStore.setState({ epicycleData });
  }, [numPoints]);

  const framerate = 60;
  const frameDurationRef = useRef(0);
  const timeRef = useRef(0);
  useFrame((_, delta) => {
    frameDurationRef.current += Math.min(delta, 0.1);
    if (frameDurationRef.current < 1 / framerate) {
      return;
    }
    frameDurationRef.current = 0;
    timeRef.current += (2 * Math.PI) / numPoints;
    if (timeRef.current > 2 * Math.PI) {
      timeRef.current = 0;
    }
    const points = getHourMinuteSecondPoints({ totalPoints: numPoints });
    const fourier = getFourier(points);
    const { epicycleData, position } = getEpicycleData(
      fourier,
      timeRef.current,
    );
    meshRef.current.position.set(position.x, position.y, 0);
    useFourierStore.setState({ epicycleData });
  });

  return (
    <group scale={0.05}>
      <Instances limit={numPoints} range={numPoints}>
        <planeGeometry args={[1, 1]} />
        <meshBasicMaterial color="blue" wireframe />
        {Array.from({ length: numPoints }).map((_, index) => (
          <EpicycleCircle index={index} key={index} />
        ))}
      </Instances>
      <Instances limit={numPoints} range={numPoints}>
        <planeGeometry args={[1, 1]} />
        <meshBasicMaterial color="red" />
        {Array.from({ length: numPoints }).map((_, index) => (
          <EpicycleLine index={index} key={index} />
        ))}
      </Instances>
      <Trail color="hotpink" length={20} width={1} interval={5}>
        <mesh ref={meshRef}>
          <sphereGeometry args={[0.05, 16, 16]} />
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
