import { Bvh, Instance, Loader, Plane, useFBO } from "@react-three/drei";
import {
  Canvas,
  createPortal,
  useFrame,
  type ThreeEvent,
} from "@react-three/fiber";
import { Suspense, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import useMncaStore from "../../../stores/useMncaStore";
import CustomStatsComponent from "../../misc/CustomStatsComponent";
import ClockDisplay from "./ClockDisplay";
import useGPGPU from "./useGPGPU";

// Thanks to Acerola for the inspiration.
// https://www.youtube.com/watch?v=I1JBiZrZ_XM

function NeighborhoodTile({
  ruleIndex,
  x,
  y,
  isCenter,
}: {
  ruleIndex: number;
  x: number;
  y: number;
  isCenter: boolean;
}) {
  const instanceRef = useRef<typeof Instance>(null!);
  const [hovered, setHovered] = useState(false);
  const [alive, setAlive] = useState(
    useMncaStore.getState().rules[ruleIndex].neighborhood[y][x] === 1,
  );
  const color = new THREE.Color("#808080");

  function handleOnPointer(e: ThreeEvent<PointerEvent>, isHovered: boolean) {
    if (isHovered) {
      e.stopPropagation();
    }
    setHovered(isHovered);
  }

  useFrame(() => {
    if (!instanceRef.current) return;
    if (isCenter) return;
    // @ts-expect-error this is probably fine
    instanceRef.current.color.lerp(
      color.set(
        alive
          ? hovered
            ? "#c2c2c2"
            : "#ffffff"
          : hovered
            ? "#454545"
            : "#1a1a1a",
      ),
      0.1,
    );
  });

  return (
    <Instance
      ref={instanceRef}
      onPointerOver={(e) => handleOnPointer(e, true)}
      onPointerOut={(e) => handleOnPointer(e, false)}
    />
  );
}

function NeighborhoodCanvas({ ruleIndex }: { ruleIndex: number }) {
  return null;
}

function MNCA() {
  const clockTextureRef = useRef<THREE.Texture>(new THREE.Texture());
  const gpgpu = useGPGPU({ clockTextureRef });
  const displayPlaneRef = useRef<THREE.Mesh>(null!);

  const clockScene = useMemo(() => new THREE.Scene(), []);
  const clockCamera = useMemo(
    () =>
      new THREE.OrthographicCamera(
        -256 / 2,
        256 / 2,
        256 / 2,
        -256 / 2,
        1 / Math.pow(2, 53),
        1,
      ),
    [],
  );
  const clockRenderTarget = useFBO(512, 512, {
    minFilter: THREE.NearestFilter,
    magFilter: THREE.NearestFilter,
    format: THREE.RGBAFormat,
    stencilBuffer: false,
    depthBuffer: false,
    type: THREE.UnsignedByteType,
  });

  useFrame(({ gl }) => {
    if (!gpgpu.gpgpuTexture.current) return;
    gl.setRenderTarget(clockRenderTarget);
    gl.clear();
    gl.render(clockScene, clockCamera);

    clockTextureRef.current = clockRenderTarget.texture;

    gl.setRenderTarget(null);

    (displayPlaneRef.current.material as THREE.MeshBasicMaterial).map =
      gpgpu.gpgpuTexture.current;
  });

  return (
    <>
      {createPortal(<ClockDisplay />, clockScene)}
      <Bvh firstHitOnly>
        <NeighborhoodCanvas ruleIndex={0} />
        <NeighborhoodCanvas ruleIndex={1} />
      </Bvh>
      <Plane ref={displayPlaneRef} args={[2, 2]} rotation={[0, 0, 0]}>
        <meshBasicMaterial />
      </Plane>
    </>
  );
}

export default function MNCAScene() {
  return (
    <>
      <Canvas
        shadows
        dpr={Math.min(window.devicePixelRatio, 2)}
        orthographic
        camera={{
          position: [0, 0, 10],
          zoom: 1,
          left: -window.innerWidth / window.innerHeight,
          right: window.innerWidth / window.innerHeight,
          top: 1,
          bottom: -1,
        }}
        style={{
          touchAction: "none",
        }}
      >
        <CustomStatsComponent />
        <Suspense fallback={null}>
          <ambientLight intensity={0.1} />
          <MNCA />
        </Suspense>
      </Canvas>
      <Loader />
    </>
  );
}
