import { Loader, Plane } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import { Suspense, useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import useAppStore from "../../../stores/useAppStore";
import { getDisplayScale } from "../../../utils/utils";
import CustomStatsComponent from "../../misc/CustomStatsComponent";
import DebugOrbitControls from "../../misc/DebugOrbitControls";
import { COLOR_PALETTE, TICK_RATE } from "./constants/constants";
import displayFragmentShader from "./shaders/display/display.frag";
import displayVertexShader from "./shaders/display/display.vert";
import useGPGPU from "./useGPGPU";

function Fourier() {
  const displayPlaneRef = useRef<THREE.Mesh>(null!);
  const shaderRef = useRef<THREE.ShaderMaterial>(null!);

  const { gpgpuTexture } = useGPGPU();

  const uniforms = useMemo(() => {
    return {
      uTime: { value: 0 },
      uGpgpuTexture: { value: new THREE.Texture() },
      uPaletteA: { value: new THREE.Vector3(...COLOR_PALETTE.a) },
      uPaletteB: { value: new THREE.Vector3(...COLOR_PALETTE.b) },
      uPaletteC: { value: new THREE.Vector3(...COLOR_PALETTE.c) },
      uPaletteD: { value: new THREE.Vector3(...COLOR_PALETTE.d) },
      uDisplayScale: {
        value: getDisplayScale({ targetAspect: 1 }),
      },
      uZoom: { value: 1 },
    };
  }, []);

  const frameDurationRef = useRef(1);
  const timeRef = useRef(0);
  useFrame(({ camera }, delta) => {
    if (!(gpgpuTexture.current && shaderRef.current)) return;

    frameDurationRef.current += delta;

    shaderRef.current.uniforms.uDisplayScale.value = getDisplayScale({
      targetAspect: 1,
    });
    shaderRef.current.uniforms.uZoom.value = camera.zoom;

    if (frameDurationRef.current >= 1 / TICK_RATE) {
      timeRef.current += frameDurationRef.current;
      frameDurationRef.current = 0;
      shaderRef.current.uniforms.uTime.value = timeRef.current;
    }

    shaderRef.current.uniforms.uGpgpuTexture.value = gpgpuTexture.current;
  });

  return (
    <Plane ref={displayPlaneRef}>
      <shaderMaterial
        ref={shaderRef}
        vertexShader={displayVertexShader}
        fragmentShader={displayFragmentShader}
        uniforms={uniforms}
        transparent
        depthTest={false}
        depthWrite={false}
      />
    </Plane>
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
        orthographic
        style={{
          touchAction: "none",
        }}
      >
        <CustomStatsComponent />
        <Suspense fallback={null}>
          <ambientLight intensity={0.1} />
          <Fourier />
        </Suspense>
        <DebugOrbitControls
          enableRotate={false}
          enablePan={false}
          minZoom={0.5}
          maxZoom={10}
        />
      </Canvas>
      <Loader />
    </>
  );
}
