import {
  Bounds,
  Box,
  createInstances,
  Environment,
  Loader,
  OrbitControls,
  Plane,
} from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import { Suspense, useEffect, useMemo, useRef, type FC } from "react";
import * as THREE from "three";
import useAppStore from "../../../stores/useAppStore";
import CustomStatsComponent from "../../misc/CustomStatsComponent";
import {
  DISC_RADIUS,
  DISC_THICKNESS,
  HEIGHT_COUNT,
  HEX_RADIUS,
  HEX_SCALE,
  HEX_THICKNESS,
  WIDTH_COUNT,
} from "./constants/constants";

function HexPanel({
  index,
  row,
  col,
  x,
  y,
  RodInstance,
  HexInstance,
  DiscInstance,
}: {
  index: number;
  row: number;
  col: number;
  x: number;
  y: number;
  RodInstance: any;
  HexInstance: any;
  DiscInstance: any;
}) {
  const groupRotation = useMemo(
    () =>
      new THREE.Euler(0, 0, (Math.floor(Math.random() * 6) / 6) * Math.PI * 2),
    [],
  );
  const hexRef = useRef<THREE.Mesh>(null!);
  useFrame(({ clock }) => {
    const time = clock.getElapsedTime();
    const hexRotation = ((time + index) * 0.5) % (Math.PI * 2);
    hexRef.current.rotation.z = hexRotation;
  });
  return (
    <group position={[x, y, 0]} rotation={groupRotation}>
      <HexInstance ref={hexRef} rotation={[Math.PI / 2, 0, 0]} />
    </group>
  );
}

function Hex() {
  const uDeltaRef = useRef(0);
  const uTimeRef = useRef(0);

  const [RodInstances, RodInstance] = createInstances();
  const [HexInstances, HexInstance] = createInstances();
  const [DiscInstances, DiscInstance] = createInstances();

  useFrame((_, delta) => {
    uDeltaRef.current = Math.min(delta, 0.1);
    uTimeRef.current = (uTimeRef.current + uDeltaRef.current) % 100000;
  });

  return (
    <group>
      <Plane args={[5, 5]} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
        <meshBasicMaterial color={"#666"} />
      </Plane>
      <group position={[0, HEX_RADIUS, -0.75]}>
        <RodInstances limit={WIDTH_COUNT * HEIGHT_COUNT * 2}>
          <cylinderGeometry />
          <meshBasicMaterial color={"#888"} />
          <HexInstances limit={WIDTH_COUNT * HEIGHT_COUNT}>
            <cylinderGeometry
              args={[
                HEX_RADIUS * HEX_SCALE,
                HEX_RADIUS * HEX_SCALE,
                HEX_THICKNESS,
                6,
              ]}
            />
            <meshStandardMaterial color={"#cff"} />
            <DiscInstances limit={WIDTH_COUNT * HEIGHT_COUNT * 2}>
              <cylinderGeometry
                args={[DISC_RADIUS, DISC_RADIUS, DISC_THICKNESS, 32]}
              />
              <meshBasicMaterial color={"#ff0"} />
              {Array.from({ length: HEIGHT_COUNT }).map((_, row) =>
                Array.from({ length: WIDTH_COUNT }).map((_, col) => {
                  const xOffset =
                    row % 2 === 0 ? 0 : (HEX_RADIUS * Math.sqrt(3)) / 2;
                  const x =
                    col * HEX_RADIUS * Math.sqrt(3) +
                    xOffset -
                    (WIDTH_COUNT * HEX_RADIUS * Math.sqrt(3)) / 2;
                  const y = row * HEX_RADIUS * 1.5;
                  const index = row * WIDTH_COUNT + col;
                  return (
                    <HexPanel
                      key={`hex-panel-${row}-${col}`}
                      index={index}
                      row={row}
                      col={col}
                      x={x}
                      y={y}
                      RodInstance={RodInstance}
                      HexInstance={HexInstance}
                      DiscInstance={DiscInstance}
                    />
                  );
                }),
              )}
            </DiscInstances>
          </HexInstances>
        </RodInstances>
      </group>
      <Box
        args={[4, 2.5, 0.75]}
        position={[0, 1.25, -1.25]}
        material-wireframe
      />
    </group>
  );
}

export default function HexScene() {
  const canvasRef = useRef<HTMLCanvasElement>(null!);

  useEffect(() => {
    document.title = "Clock Envy - Hex";

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
        dpr={Math.min(window.devicePixelRatio, 2)}
        camera={{
          position: [10, 5, 10],
        }}
        orthographic
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
          <Environment preset="warehouse" resolution={1024} />
          <Bounds fit clip observe margin={1.2}>
            <Hex />
          </Bounds>
        </Suspense>
        <OrbitControls makeDefault />
      </Canvas>
      <Loader />
    </>
  );
}
