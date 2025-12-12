import {
  Loader,
  OrbitControls,
  Plane,
  useFBO,
  useHelper,
} from "@react-three/drei";
import { Canvas, createPortal, useFrame } from "@react-three/fiber";
import { useControls } from "leva";
import { Suspense, useEffect, useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import useAppStore from "../../../stores/useAppStore";
import CustomStatsComponent from "../../misc/CustomStatsComponent";
import ClockDisplay from "./ClockDisplay";
import {
  CUBE_COUNT_X,
  CUBE_COUNT_Y,
  CUBE_COUNT_Z,
  CUBE_SIZE,
  TEXTURE_SIZE,
  TOTAL_CUBES,
} from "./constants/constants";
import useGPGPU from "./useGPGPU";

const texturePlaneUniforms = {
  uWindowResolution: { value: new THREE.Vector2(1, 1) },
};

const cubeUniforms = {
  uGPGPUTexture: { value: new THREE.Texture() },
  uTotalCubes: { value: TOTAL_CUBES },
  uCubeCountX: { value: CUBE_COUNT_X },
  uCubeCountY: { value: CUBE_COUNT_Y },
  uCubeCountZ: { value: CUBE_COUNT_Z },
  uCubeSize: { value: CUBE_SIZE },
  uWindowResolution: { value: new THREE.Vector2(1, 1) },
  uClockTexture: { value: new THREE.Texture() },
};

function Cavity() {
  const { gpgpuActualTexture: gpgpuActualTexture00 } = useGPGPU({
    cubeCounts: [CUBE_COUNT_X, CUBE_COUNT_Y, CUBE_COUNT_Z],
  });

  const instancedMeshRef00 = useRef<THREE.InstancedMesh>(null!);
  const instancedMeshRef01 = useRef<THREE.InstancedMesh>(null!);

  const gpgpuDisplayPlaneRef = useRef<THREE.Mesh>(null!);
  const clockDisplayPlaneRef = useRef<THREE.Mesh>(null!);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [window.innerWidth, window.innerHeight],
  );
  const clockRenderTarget = useFBO(window.innerWidth, window.innerHeight, {
    minFilter: THREE.NearestFilter,
    magFilter: THREE.NearestFilter,
    format: THREE.RGBAFormat,
    stencilBuffer: false,
    depthBuffer: false,
    type: THREE.UnsignedByteType,
  });

  const cubesGeometry00 = useMemo(() => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const notGonnaUseThisGeometry = new RoundedBoxGeometry(
      CUBE_SIZE,
      CUBE_SIZE,
      CUBE_SIZE,
      1,
      0.05,
    );
    const geometry = new THREE.BoxGeometry(CUBE_SIZE, CUBE_SIZE, CUBE_SIZE);
    const gpgpuUvs = new Float32Array(TOTAL_CUBES * 2);
    const cubePositions = new Float32Array(TOTAL_CUBES * 3);
    const normalizedCubePositions = new Float32Array(TOTAL_CUBES * 3);

    for (let i = 0; i < TOTAL_CUBES; i++) {
      const i2 = i * 2;
      const i3 = i * 3;

      gpgpuUvs[i2 + 0] = (i % TEXTURE_SIZE) / (TEXTURE_SIZE - 1);
      gpgpuUvs[i2 + 1] = ~~(i / TEXTURE_SIZE) / (TEXTURE_SIZE - 1);

      cubePositions[i3 + 0] =
        ((i % CUBE_COUNT_X) - (CUBE_COUNT_X - 1) / 2) * CUBE_SIZE;
      cubePositions[i3 + 1] =
        (Math.floor(i / (CUBE_COUNT_X * CUBE_COUNT_Z)) -
          (CUBE_COUNT_Y - 1) / 2) *
        CUBE_SIZE;
      cubePositions[i3 + 2] =
        ((Math.floor(i / CUBE_COUNT_X) % CUBE_COUNT_Z) -
          (CUBE_COUNT_Z - 1) / 2) *
        CUBE_SIZE;

      normalizedCubePositions[i3 + 0] =
        cubePositions[i3 + 0] / ((CUBE_COUNT_X - 1) * CUBE_SIZE);
      normalizedCubePositions[i3 + 1] =
        cubePositions[i3 + 1] / ((CUBE_COUNT_Y - 1) * CUBE_SIZE);
      normalizedCubePositions[i3 + 2] =
        cubePositions[i3 + 2] / ((CUBE_COUNT_Z - 1) * CUBE_SIZE);
    }

    geometry.setAttribute(
      "aGpgpuUv",
      new THREE.InstancedBufferAttribute(gpgpuUvs, 2),
    );
    geometry.setAttribute(
      "aNormalizedCubePosition",
      new THREE.InstancedBufferAttribute(normalizedCubePositions, 3),
    );

    return geometry;
  }, []);

  const cubesGeometry01 = useMemo(() => {
    const geometry = new THREE.BoxGeometry(CUBE_SIZE, CUBE_SIZE, CUBE_SIZE);
    const gpgpuUvs = new Float32Array(TOTAL_CUBES * 2);
    const cubePositions = new Float32Array(TOTAL_CUBES * 3);
    const normalizedCubePositions = new Float32Array(TOTAL_CUBES * 3);

    for (let i = 0; i < TOTAL_CUBES; i++) {
      const i2 = i * 2;
      const i3 = i * 3;

      gpgpuUvs[i2 + 0] = (i % TEXTURE_SIZE) / (TEXTURE_SIZE - 1);
      gpgpuUvs[i2 + 1] = ~~(i / TEXTURE_SIZE) / (TEXTURE_SIZE - 1);

      cubePositions[i3 + 0] =
        ((i % CUBE_COUNT_X) - (CUBE_COUNT_X - 1) / 2) * CUBE_SIZE;
      cubePositions[i3 + 1] =
        (Math.floor(i / (CUBE_COUNT_X * CUBE_COUNT_Z)) -
          (CUBE_COUNT_Y - 1) / 2) *
        CUBE_SIZE;
      cubePositions[i3 + 2] =
        ((Math.floor(i / CUBE_COUNT_X) % CUBE_COUNT_Z) -
          (CUBE_COUNT_Z - 1) / 2) *
        CUBE_SIZE;

      normalizedCubePositions[i3 + 0] =
        cubePositions[i3 + 0] / ((CUBE_COUNT_X - 1) * CUBE_SIZE);
      normalizedCubePositions[i3 + 1] =
        cubePositions[i3 + 1] / ((CUBE_COUNT_Y - 1) * CUBE_SIZE);
      normalizedCubePositions[i3 + 2] =
        cubePositions[i3 + 2] / ((CUBE_COUNT_Z - 1) * CUBE_SIZE);
    }

    geometry.setAttribute(
      "aGpgpuUv",
      new THREE.InstancedBufferAttribute(gpgpuUvs, 2),
    );
    geometry.setAttribute(
      "aNormalizedCubePosition",
      new THREE.InstancedBufferAttribute(normalizedCubePositions, 3),
    );

    return geometry;
  }, []);

  useLayoutEffect(() => {
    const zOffsets: Record<string, number> = {};
    let x = -1;
    let y = -1;
    let key = "";
    let z = -999;
    for (let i = 0; i < TOTAL_CUBES; i++) {
      x = ((i % CUBE_COUNT_X) - CUBE_COUNT_X / 2) * CUBE_SIZE;
      y =
        (Math.floor(i / (CUBE_COUNT_X * CUBE_COUNT_Z)) - CUBE_COUNT_Y / 2) *
        CUBE_SIZE;
      key = `${x.toFixed(8)}_${y.toFixed(8)}`;
      if (zOffsets[key] === undefined) {
        zOffsets[key] = (Math.random() - 0.5) * CUBE_SIZE * 0.3;
      }
      z =
        ((Math.floor(i / CUBE_COUNT_X) % CUBE_COUNT_Z) - CUBE_COUNT_Z / 2) *
          CUBE_SIZE +
        zOffsets[key];
      instancedMeshRef00.current.setMatrixAt(
        i,
        new THREE.Matrix4().setPosition(x, y, z),
      );
    }
    instancedMeshRef00.current.instanceMatrix.needsUpdate = true;
    instancedMeshRef00.current.matrixWorldNeedsUpdate = true;
  }, []);

  useLayoutEffect(() => {
    for (let i = 0; i < TOTAL_CUBES; i++) {
      instancedMeshRef01.current.setMatrixAt(
        i,
        new THREE.Matrix4().setPosition(
          ((i % CUBE_COUNT_X) - CUBE_COUNT_X / 2) * CUBE_SIZE,
          (Math.floor(i / (CUBE_COUNT_X * CUBE_COUNT_Z)) - CUBE_COUNT_Y / 2) *
            CUBE_SIZE,
          ((Math.floor(i / CUBE_COUNT_X) % CUBE_COUNT_Z) - CUBE_COUNT_Z / 2) *
            CUBE_SIZE -
            15,
        ),
      );
    }
    instancedMeshRef01.current.instanceMatrix.needsUpdate = true;
    instancedMeshRef01.current.matrixWorldNeedsUpdate = true;
  }, []);

  useEffect(() => {
    if (window.innerWidth && window.innerHeight) {
      texturePlaneUniforms.uWindowResolution.value.set(
        window.innerWidth,
        window.innerHeight,
      );
      cubeUniforms.uWindowResolution.value.set(
        window.innerWidth,
        window.innerHeight,
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [window.innerWidth, window.innerHeight]);

  useFrame(({ gl }) => {
    if (gpgpuActualTexture00.current) {
      cubeUniforms.uGPGPUTexture.value = gpgpuActualTexture00.current;
    }

    gl.setRenderTarget(clockRenderTarget);
    gl.clear();
    gl.render(clockScene, clockCamera);

    cubeUniforms.uClockTexture.value = clockRenderTarget.texture;

    gl.setRenderTarget(null);

    if (gpgpuDisplayPlaneRef.current && gpgpuActualTexture00.current) {
      // @ts-expect-error 'map' does exist.
      gpgpuDisplayPlaneRef.current.material.map = gpgpuActualTexture00.current;
    }
    // @ts-expect-error `map` does exist.
    clockDisplayPlaneRef.current.material.map = clockRenderTarget.texture;
  });

  return (
    <>
      {createPortal(<ClockDisplay />, clockScene)}
      <instancedMesh
        ref={instancedMeshRef00}
        geometry={cubesGeometry00!}
        castShadow
        receiveShadow
        args={[undefined, undefined, TOTAL_CUBES]}
      >
        <meshPhysicalMaterial
          attach="material"
          color={"#363946"}
          metalness={0.02}
          roughness={0.9}
          clearcoat={1}
          clearcoatRoughness={0.3}
          onBeforeCompile={(shader) => {
            shader.uniforms.uGPGPUTexture = cubeUniforms.uGPGPUTexture;
            shader.uniforms.uClockTexture = cubeUniforms.uClockTexture;
            shader.vertexShader = shader.vertexShader.replace(
              "#include <common>",
              /* glsl */ `
              #include <common>

              uniform sampler2D uGPGPUTexture;
              uniform sampler2D uClockTexture;

              attribute vec2 aGpgpuUv;
              attribute vec3 aNormalizedCubePosition;
              `,
            );
            shader.vertexShader = shader.vertexShader.replace(
              "#include <begin_vertex>",
              /* glsl */ `
              #include <begin_vertex>

              vec4 sizeInfo = texture(uGPGPUTexture, aGpgpuUv);
              sizeInfo = smoothstep(0.0, 1.0, sizeInfo);
              float sizeIn = smoothstep(0.0, 0.1, sizeInfo.x);
              float sizeOut = 1.0 - smoothstep(0.9, 1.0, sizeInfo.x);
              float size = min(sizeIn, sizeOut);
              
              float wall = smoothstep(0.6, 1.0, (aNormalizedCubePosition.z + 0.5));
              wall = wall;
              size = max(size, wall);
              
              vec2 clockUv = aNormalizedCubePosition.xy + 0.5;
              vec4 clockInfo = texture(uClockTexture, clockUv);
              size *= smoothstep(1.0, 0.0, clockInfo.r);

              transformed *= vec3(size);
              `,
            );
          }}
        />
        <meshDepthMaterial
          attach={"customDepthMaterial"}
          depthPacking={THREE.RGBADepthPacking}
          onBeforeCompile={(shader) => {
            shader.uniforms.uGPGPUTexture = cubeUniforms.uGPGPUTexture;
            shader.uniforms.uClockTexture = cubeUniforms.uClockTexture;
            shader.vertexShader = shader.vertexShader.replace(
              "#include <common>",
              /* glsl */ `
              #include <common>

              uniform sampler2D uGPGPUTexture;
              uniform sampler2D uClockTexture;

              attribute vec2 aGpgpuUv;
              attribute vec3 aNormalizedCubePosition;
              `,
            );
            shader.vertexShader = shader.vertexShader.replace(
              "#include <begin_vertex>",
              /* glsl */ `
              #include <begin_vertex>

              vec4 sizeInfo = texture(uGPGPUTexture, aGpgpuUv);
              sizeInfo = smoothstep(0.0, 1.0, sizeInfo);
              float sizeIn = smoothstep(0.0, 0.1, sizeInfo.x);
              float sizeOut = 1.0 - smoothstep(0.9, 1.0, sizeInfo.x);
              float size = min(sizeIn, sizeOut);
              
              float wall = smoothstep(0.6, 1.0, (aNormalizedCubePosition.z + 0.5));
              wall = wall;
              size = max(size, wall);
              
              vec2 clockUv = aNormalizedCubePosition.xy + 0.5;
              vec4 clockInfo = texture(uClockTexture, clockUv);
              size *= smoothstep(1.0, 0.0, clockInfo.r);

              transformed *= vec3(size);
              `,
            );
          }}
        />
        <meshDistanceMaterial
          attach={"customDistanceMaterial"}
          onBeforeCompile={(shader) => {
            shader.uniforms.uGPGPUTexture = cubeUniforms.uGPGPUTexture;
            shader.uniforms.uClockTexture = cubeUniforms.uClockTexture;
            shader.vertexShader = shader.vertexShader.replace(
              "#include <common>",
              /* glsl */ `
              #include <common>

              uniform sampler2D uGPGPUTexture;
              uniform sampler2D uClockTexture;

              attribute vec2 aGpgpuUv;
              attribute vec3 aNormalizedCubePosition;
              `,
            );
            shader.vertexShader = shader.vertexShader.replace(
              "#include <begin_vertex>",
              /* glsl */ `
              #include <begin_vertex>

              vec4 sizeInfo = texture(uGPGPUTexture, aGpgpuUv);
              sizeInfo = smoothstep(0.0, 1.0, sizeInfo);
              float sizeIn = smoothstep(0.0, 0.1, sizeInfo.x);
              float sizeOut = 1.0 - smoothstep(0.9, 1.0, sizeInfo.x);
              float size = min(sizeIn, sizeOut);
              
              float wall = smoothstep(0.6, 1.0, (aNormalizedCubePosition.z + 0.5));
              wall = wall;
              size = max(size, wall);
              
              vec2 clockUv = aNormalizedCubePosition.xy + 0.5;
              vec4 clockInfo = texture(uClockTexture, clockUv);
              size *= smoothstep(1.0, 0.0, clockInfo.r);

              transformed *= vec3(size);
              `,
            );
          }}
        />
      </instancedMesh>
      {/* ****************************************************************** */}
      {/* ****************************************************************** */}
      {/* ****************************************************************** */}
      <instancedMesh
        ref={instancedMeshRef01}
        geometry={cubesGeometry01!}
        castShadow
        receiveShadow
        args={[undefined, undefined, TOTAL_CUBES]}
        scale={[2, 2, 1]}
        rotation={[0, 0, Math.PI]}
      >
        <meshStandardMaterial
          attach="material"
          color={"#31E981"}
          metalness={0.02}
          roughness={0.1}
          // flatShading={true}
          onBeforeCompile={(shader) => {
            shader.uniforms.uGPGPUTexture = cubeUniforms.uGPGPUTexture;
            shader.uniforms.uClockTexture = cubeUniforms.uClockTexture;
            shader.vertexShader = shader.vertexShader.replace(
              "#include <common>",
              /* glsl */ `
              #include <common>

              uniform sampler2D uGPGPUTexture;
              uniform sampler2D uClockTexture;

              attribute vec2 aGpgpuUv;
              attribute vec3 aNormalizedCubePosition;
              `,
            );
            shader.vertexShader = shader.vertexShader.replace(
              "#include <begin_vertex>",
              /* glsl */ `
              #include <begin_vertex>

              vec4 sizeInfo = texture(uGPGPUTexture, aGpgpuUv);
              sizeInfo = smoothstep(0.0, 1.0, sizeInfo);
              float sizeIn = smoothstep(0.0, 0.1, sizeInfo.x);
              float sizeOut = 1.0 - smoothstep(0.9, 1.0, sizeInfo.x);
              float size = min(sizeIn, sizeOut);
              
              float wall = smoothstep(0.6, 1.0, 1.0 - (aNormalizedCubePosition.z + 0.5));
              wall = wall;
              size = max(size, wall);

              transformed *= vec3(size);
              `,
            );
          }}
        />
        <meshDepthMaterial
          attach={"customDepthMaterial"}
          depthPacking={THREE.RGBADepthPacking}
          onBeforeCompile={(shader) => {
            shader.uniforms.uGPGPUTexture = cubeUniforms.uGPGPUTexture;
            shader.uniforms.uClockTexture = cubeUniforms.uClockTexture;
            shader.vertexShader = shader.vertexShader.replace(
              "#include <common>",
              /* glsl */ `
              #include <common>

              uniform sampler2D uGPGPUTexture;
              uniform sampler2D uClockTexture;

              attribute vec2 aGpgpuUv;
              attribute vec3 aNormalizedCubePosition;
              `,
            );
            shader.vertexShader = shader.vertexShader.replace(
              "#include <begin_vertex>",
              /* glsl */ `
              #include <begin_vertex>

              vec4 sizeInfo = texture(uGPGPUTexture, aGpgpuUv);
              sizeInfo = smoothstep(0.0, 1.0, sizeInfo);
              float sizeIn = smoothstep(0.0, 0.1, sizeInfo.x);
              float sizeOut = 1.0 - smoothstep(0.9, 1.0, sizeInfo.x);
              float size = min(sizeIn, sizeOut);
              
              float wall = smoothstep(0.6, 1.0, 1.0 - (aNormalizedCubePosition.z + 0.5));
              wall = wall;
              size = max(size, wall);

              transformed *= vec3(size);
              `,
            );
          }}
        />
        <meshDistanceMaterial
          attach={"customDistanceMaterial"}
          onBeforeCompile={(shader) => {
            shader.uniforms.uGPGPUTexture = cubeUniforms.uGPGPUTexture;
            shader.uniforms.uClockTexture = cubeUniforms.uClockTexture;
            shader.vertexShader = shader.vertexShader.replace(
              "#include <common>",
              /* glsl */ `
              #include <common>

              uniform sampler2D uGPGPUTexture;
              uniform sampler2D uClockTexture;

              attribute vec2 aGpgpuUv;
              attribute vec3 aNormalizedCubePosition;
              `,
            );
            shader.vertexShader = shader.vertexShader.replace(
              "#include <begin_vertex>",
              /* glsl */ `
              #include <begin_vertex>

              vec4 sizeInfo = texture(uGPGPUTexture, aGpgpuUv);
              sizeInfo = smoothstep(0.0, 1.0, sizeInfo);
              float sizeIn = smoothstep(0.0, 0.1, sizeInfo.x);
              float sizeOut = 1.0 - smoothstep(0.9, 1.0, sizeInfo.x);
              float size = min(sizeIn, sizeOut);
              
              float wall = smoothstep(0.6, 1.0, 1.0 - (aNormalizedCubePosition.z + 0.5));
              wall = wall;
              size = max(size, wall);

              transformed *= vec3(size);
              `,
            );
          }}
        />
      </instancedMesh>
      <Plane ref={gpgpuDisplayPlaneRef}>
        <meshBasicMaterial
          attach="material"
          map={gpgpuActualTexture00.current}
          depthTest={false}
          depthWrite={false}
          onBeforeCompile={(shader) => {
            shader.uniforms.uWindowResolution =
              texturePlaneUniforms.uWindowResolution;
            shader.vertexShader = shader.vertexShader.replace(
              "#include <common>",
              /* glsl */ `
              #include <common>
              uniform vec2 uWindowResolution;
              `,
            );
            shader.vertexShader = shader.vertexShader.replace(
              "#include <project_vertex>",
              /* glsl */ `
              #include <project_vertex>
              gl_Position = vec4(position, 1.0) * vec4(0.4 * (uWindowResolution.y / uWindowResolution.x), 0.4, 1.0, 1.0) + vec4(1.0 - (0.4 * (uWindowResolution.y / uWindowResolution.x)) * 0.5, 0.8, 0.0, 0.0);
              `,
            );
          }}
        />
      </Plane>
      <Plane ref={clockDisplayPlaneRef}>
        <meshBasicMaterial
          attach="material"
          map={clockRenderTarget.texture}
          depthTest={false}
          depthWrite={false}
          onBeforeCompile={(shader) => {
            shader.uniforms.uWindowResolution =
              texturePlaneUniforms.uWindowResolution;
            shader.vertexShader = shader.vertexShader.replace(
              "#include <common>",
              /* glsl */ `
              #include <common>
              uniform vec2 uWindowResolution;
              `,
            );
            shader.vertexShader = shader.vertexShader.replace(
              "#include <project_vertex>",
              /* glsl */ `
              #include <project_vertex>
              gl_Position = vec4(position, 1.0) * vec4(0.4 * (uWindowResolution.y / uWindowResolution.x), 0.4, 1.0, 1.0) + vec4(1.0 - (0.4 * (uWindowResolution.y / uWindowResolution.x)) * 0.5, 0.4, 0.0, 0.0);
              `,
            );
          }}
        />
      </Plane>
    </>
  );
}

function Lights() {
  const spotLightRef00 = useRef<THREE.SpotLight>(null!);
  const helpersEnabled = true;
  useHelper(helpersEnabled && spotLightRef00, THREE.SpotLightHelper);

  const spotLight00Values = useControls("SpotLight 00", {
    positionX: { value: 0, min: -30, max: 30 },
    positionY: { value: 0, min: -30, max: 30 },
    positionZ: { value: -8, min: -30, max: 30 },
    near: { value: 0.1, min: 0.1, max: 10 },
    far: { value: 100, min: 10, max: 1000 },
    fov: { value: 45, min: 1, max: 180 },
    angle: { value: Math.PI / 4, min: 0, max: Math.PI / 2 },
    penumbra: { value: 0, min: 0, max: 1 },
    decay: { value: 0.1, min: 0, max: 10 },
    intensity: { value: 10, min: 0, max: 50 },
  });

  return (
    <>
      <spotLight
        ref={spotLightRef00}
        position={[
          spotLight00Values.positionX,
          spotLight00Values.positionY,
          spotLight00Values.positionZ,
        ]}
        color={"#31E981"}
        intensity={spotLight00Values.intensity}
        angle={spotLight00Values.angle}
        penumbra={spotLight00Values.penumbra}
        decay={spotLight00Values.decay}
        shadow-camera-near={spotLight00Values.near}
        shadow-camera-far={spotLight00Values.far}
        shadow-camera-fov={spotLight00Values.fov}
        castShadow
      />
      <directionalLight
        position={[9, 10, 10]}
        color={"lightblue"}
        intensity={0.5}
        castShadow
      />
    </>
  );
}

export default function CavityScene() {
  const interactionState = useAppStore((state) => state.interactionState);

  return (
    <>
      <Canvas
        shadows
        dpr={Math.min(window.devicePixelRatio, 2)}
        camera={{
          position: [0, 0, 35],
          // rotation: [0.05, 0, 0],
          fov: 8,
        }}
        style={{
          touchAction: "none",
          cursor: interactionState === "active" ? "default" : "none",
        }}
      >
        <CustomStatsComponent />
        <Suspense fallback={null}>
          {/* <Environment preset="city" resolution={2048} /> */}
          {/* <Environment
            files="./environments/photo_studio_loft_hall_4k.exr"
            resolution={2048}
          /> */}
          <ambientLight intensity={0.8} />
          <Cavity />
          <Lights />
          <OrbitControls makeDefault />
        </Suspense>
      </Canvas>
      <Loader />
    </>
  );
}
