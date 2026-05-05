import { Loader, Plane, useFBO } from "@react-three/drei";
import { Canvas, createPortal, useFrame } from "@react-three/fiber";
import { Suspense, useMemo, useRef } from "react";
import * as THREE from "three";
import CustomStatsComponent from "../../misc/CustomStatsComponent";
import ClockDisplay from "./ClockDisplay";
import useGPGPU from "./useGPGPU";

function Bugs() {
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
      <Plane ref={displayPlaneRef} args={[2, 2]} rotation={[0, 0, 0]}>
        <meshBasicMaterial />
      </Plane>
    </>
  );
}

export default function BugsScene() {
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
          {/* <Environment preset="city" resolution={2048} /> */}
          {/* <Environment
              files="./environments/photo_studio_loft_hall_1k.hdr"
              resolution={1024}
            /> */}
          <ambientLight intensity={0.1} />
          <Bugs />
          {/* <OrbitControls makeDefault /> */}
        </Suspense>
      </Canvas>
      <Loader />
    </>
  );
}
