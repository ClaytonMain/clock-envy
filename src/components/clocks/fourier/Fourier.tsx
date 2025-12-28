import { Bounds, Loader, Plane } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import { useControls } from "leva";
import { Suspense, useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import useAppStore from "../../../stores/useAppStore";
import CustomStatsComponent from "../../misc/CustomStatsComponent";
import { COLOR_PALETTE, MAX_FADE_TIME, TICK_RATE } from "./constants/constants";
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
      uDelta: { value: 0 },
      uMaxFadeTime: { value: MAX_FADE_TIME },
      uGpgpuTexture: { value: new THREE.Texture() },
      // uBackgroundColor: { value: new THREE.Color("#56565f") },
      uEpicycleColor: { value: new THREE.Color("#939393") },
      uRadialColor: { value: new THREE.Color("#e8e8e8") },
      // uTrailColor: { value: new THREE.Color("#ff0078") },
      // uBackgroundColor: { value: new THREE.Color("#edff00") },
      // uEpicycleColor: { value: new THREE.Color("#b77aae") },
      // uRadialColor: { value: new THREE.Color("#ff0094") },
      // uTrailColor: { value: new THREE.Color("#7600b1") },
      // uBackgroundColor: { value: new THREE.Color("#4e575c") },
      uPaletteA: { value: new THREE.Vector3(...COLOR_PALETTE.a) },
      uPaletteB: { value: new THREE.Vector3(...COLOR_PALETTE.b) },
      uPaletteC: { value: new THREE.Vector3(...COLOR_PALETTE.c) },
      uPaletteD: { value: new THREE.Vector3(...COLOR_PALETTE.d) },
    };
  }, []);

  useControls({
    // uBackgroundColor: {
    //   value: `#${uniforms.uBackgroundColor.value.getHexString()}`,
    //   onChange: (value: string) => {
    //     uniforms.uBackgroundColor.value.set(new THREE.Color(value));
    //     console.log(uniforms);
    //   },
    // },
    uEpicycleColor: {
      value: `#${uniforms.uEpicycleColor.value.getHexString()}`,
      onChange: (value: string) => {
        uniforms.uEpicycleColor.value.set(new THREE.Color(value));
      },
    },
    uRadialColor: {
      value: `#${uniforms.uRadialColor.value.getHexString()}`,
      onChange: (value: string) => {
        uniforms.uRadialColor.value.set(new THREE.Color(value));
      },
    },
    // uTrailColor: {
    //   value: `#${uniforms.uTrailColor.value.getHexString()}`,
    //   onChange: (value: string) => {
    //     uniforms.uTrailColor.value.set(new THREE.Color(value));
    //   },
    // },
  });

  const frameDurationRef = useRef(1);
  const timeRef = useRef(0);
  useFrame((_, delta) => {
    if (!(gpgpuTexture.current && shaderRef.current)) return;

    frameDurationRef.current += delta;

    if (frameDurationRef.current >= 1 / TICK_RATE) {
      timeRef.current += frameDurationRef.current;
      frameDurationRef.current = 0;
      shaderRef.current.uniforms.uTime.value = timeRef.current;
    }

    shaderRef.current.uniforms.uGpgpuTexture.value = gpgpuTexture.current;
    // shaderRef.current.uniforms.uBackgroundColor.value =
    //   uniforms.uBackgroundColor.value;
    shaderRef.current.uniforms.uEpicycleColor.value =
      uniforms.uEpicycleColor.value;
    shaderRef.current.uniforms.uRadialColor.value = uniforms.uRadialColor.value;
    // shaderRef.current.uniforms.uTrailColor.value = uniforms.uTrailColor.value;
  });

  return (
    <Bounds fit clip observe>
      <group scale={1}>
        <Plane ref={displayPlaneRef} args={[1.5, 1.5]}>
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
      </group>
    </Bounds>
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
        dpr={Math.min(window.devicePixelRatio, 1)}
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
