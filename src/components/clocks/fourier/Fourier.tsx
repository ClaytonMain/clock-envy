import { Loader, Plane } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import { Suspense, useEffect, useMemo, useRef, type RefObject } from "react";
import * as THREE from "three";
import useAppStore from "../../../stores/useAppStore";
import CustomStatsComponent from "../../misc/CustomStatsComponent";

// Props to The Coding Train for the Fourier code example.
// https://www.youtube.com/watch?v=7_vKzcgpfvU

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

type EpicycleData = {
  re: number;
  im: number;
  freq: number;
  amp: number;
  phase: number;
  x: number;
  y: number;
};

function getXYValues(
  epicycleData: EpicycleData[],
  time: number,
): EpicycleData[] {
  let x = 0;
  let y = 0;
  for (let i = 0; i < epicycleData.length; i++) {
    epicycleData[i].x = x;
    epicycleData[i].y = y;

    const freq = epicycleData[i].freq;
    const radius = epicycleData[i].amp;
    const phase = epicycleData[i].phase;
    x += radius * Math.cos(freq * time + phase);
    y += radius * Math.sin(freq * time + phase);
  }
  return epicycleData;
}

function dft(x: Complex[]): EpicycleData[] {
  const X: EpicycleData[] = [];
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
      x: 0,
      y: 0,
    });
  }
  return X;
}

function Epicycle({
  index,
  epicyclesRef,
  timeRef,
}: {
  index: number;
  epicyclesRef: RefObject<EpicycleData[]>;
  timeRef: RefObject<number>;
}) {
  const meshRef = useRef<THREE.Mesh>(null!);

  useFrame(() => {
    if (!meshRef.current || !epicyclesRef.current) return;
    const epicycle = epicyclesRef.current[index];
    meshRef.current.position.x = epicycle.x;
    meshRef.current.position.y = epicycle.y;
    meshRef.current.scale.setScalar(epicycle.amp * 2);
    meshRef.current.rotation.z =
      timeRef.current * epicycle.freq + epicycle.phase;
  });

  return (
    <mesh ref={meshRef} position={[0, 0, index / epicyclesRef.current!.length]}>
      <planeGeometry args={[1, 1]} />
      <meshBasicMaterial wireframe />
    </mesh>
  );
}

function Fourier() {
  const numPoints = 256;
  const epicyclesRef = useRef<EpicycleData[]>(
    Array.from({ length: numPoints }, () => ({
      re: 1,
      im: 1,
      freq: 1,
      amp: 1.0,
      phase: 0,
      x: 0,
      y: 0,
    })),
  );

  const randOffsets = useMemo(() => {
    return Array.from({ length: numPoints }, () => Math.random() * 0.1);
  }, []);
  const initialSignal: Complex[] = useMemo(() => {
    return Array.from({ length: numPoints }, (_, i) => {
      const angle = (i / numPoints) * 2 * Math.PI;
      const radius = 0.5 + (Math.sin(7 * angle) + 0.5) * 0.2 + randOffsets[i];
      return new Complex(radius * Math.cos(angle), radius * Math.sin(angle));
    });
  }, [numPoints, randOffsets]);

  const timeRef = useRef(0);
  useFrame((_, delta) => {
    timeRef.current += Math.min(delta, 0.1);
    timeRef.current %= 2 * Math.PI;
    const signal: Complex[] = Array.from({ length: numPoints }, (_, i) => {
      const angle = (i / numPoints) * 2 * Math.PI;
      const radius = 0.5 + (Math.sin(7 * angle) + 0.5) * 0.2 + randOffsets[i];
      return new Complex(radius * Math.cos(angle), radius * Math.sin(angle));
    });
    let fourier = dft(signal);
    fourier = getXYValues(fourier, timeRef.current);
    fourier = fourier.sort((a, b) => b.amp - a.amp);
    epicyclesRef.current = fourier;
  });

  return (
    <>
      {Array.from({ length: numPoints }).map((_, index) => (
        <Epicycle
          key={index}
          index={index}
          epicyclesRef={epicyclesRef}
          timeRef={timeRef}
        />
      ))}
      {initialSignal.map((value, index) => (
        <Plane
          position={[value.re, value.im, -0.1]}
          args={[0.02, 0.02]}
          key={index}
        >
          <meshBasicMaterial color="yellow" />
        </Plane>
      ))}
    </>
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
