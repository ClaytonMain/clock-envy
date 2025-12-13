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
import CustomStatsComponent from "../../misc/CustomStatsComponent";
import ClockDisplay from "./ClockDisplay";
import {
  BACKGROUND_CONSTANTS,
  FOREGROUND_CONSTANTS,
} from "./constants/constants";
import useGPGPU from "./useGPGPU";

const texturePlaneUniforms = {
  uWindowResolution: { value: new THREE.Vector2(1, 1) },
};

const cubeUniforms00 = {
  uGPGPUTexture: { value: new THREE.Texture() },
  uClockTexture: { value: new THREE.Texture() },
};
const cubeUniforms01 = {
  uGPGPUTexture: { value: new THREE.Texture() },
};

function Cavity() {
  const clockTextureRef = useRef<THREE.Texture>(null!);
  const { gpgpuTexture: gpgpuTexture00 } = useGPGPU({
    cubeCounts: FOREGROUND_CONSTANTS.cubeCounts,
    clockTextureRef: clockTextureRef,
  });
  const { gpgpuTexture: gpgpuTexture01 } = useGPGPU({
    cubeCounts: BACKGROUND_CONSTANTS.cubeCounts,
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
        128 / 2,
        -128 / 2,
        1 / Math.pow(2, 53),
        1,
      ),
    [],
  );
  const clockRenderTarget = useFBO(512, 256, {
    minFilter: THREE.NearestFilter,
    magFilter: THREE.NearestFilter,
    format: THREE.RGBAFormat,
    stencilBuffer: false,
    depthBuffer: false,
    type: THREE.UnsignedByteType,
  });

  const cubesGeometry00 = useMemo(() => {
    const geometry = new RoundedBoxGeometry(
      FOREGROUND_CONSTANTS.cubeSize,
      FOREGROUND_CONSTANTS.cubeSize,
      FOREGROUND_CONSTANTS.cubeSize,
      1,
      0.005,
    );
    // const geometry = new THREE.BoxGeometry(
    //   FOREGROUND_CONSTANTS.cubeSize,
    //   FOREGROUND_CONSTANTS.cubeSize,
    //   FOREGROUND_CONSTANTS.cubeSize,
    // );
    const gpgpuUvs = new Float32Array(FOREGROUND_CONSTANTS.totalCubes * 2);

    for (let i = 0; i < FOREGROUND_CONSTANTS.totalCubes; i++) {
      const i2 = i * 2;

      gpgpuUvs[i2 + 0] =
        (i % FOREGROUND_CONSTANTS.textureSize) /
        (FOREGROUND_CONSTANTS.textureSize - 1);
      gpgpuUvs[i2 + 1] =
        ~~(i / FOREGROUND_CONSTANTS.textureSize) /
        (FOREGROUND_CONSTANTS.textureSize - 1);
    }

    geometry.setAttribute(
      "aGpgpuUv",
      new THREE.InstancedBufferAttribute(gpgpuUvs, 2),
    );

    return geometry;
  }, []);

  const cubesGeometry01 = useMemo(() => {
    const geometry = new THREE.BoxGeometry(
      BACKGROUND_CONSTANTS.cubeSize,
      BACKGROUND_CONSTANTS.cubeSize,
      BACKGROUND_CONSTANTS.cubeSize,
    );
    const gpgpuUvs = new Float32Array(BACKGROUND_CONSTANTS.totalCubes * 2);

    for (let i = 0; i < BACKGROUND_CONSTANTS.totalCubes; i++) {
      const i2 = i * 2;

      gpgpuUvs[i2 + 0] =
        (i % BACKGROUND_CONSTANTS.textureSize) /
        (BACKGROUND_CONSTANTS.textureSize - 1);
      gpgpuUvs[i2 + 1] =
        ~~(i / BACKGROUND_CONSTANTS.textureSize) /
        (BACKGROUND_CONSTANTS.textureSize - 1);
    }

    geometry.setAttribute(
      "aGpgpuUv",
      new THREE.InstancedBufferAttribute(gpgpuUvs, 2),
    );

    return geometry;
  }, []);

  useLayoutEffect(() => {
    const zOffsets: Record<string, number> = {};
    let x = -1;
    let y = -1;
    let key = "";
    let z = -999;

    for (let i = 0; i < FOREGROUND_CONSTANTS.totalCubes; i++) {
      x =
        ((i % FOREGROUND_CONSTANTS.cubeCounts[0]) -
          FOREGROUND_CONSTANTS.cubeCounts[0] / 2) *
        FOREGROUND_CONSTANTS.cubeSize;
      y =
        (Math.floor(
          i /
            (FOREGROUND_CONSTANTS.cubeCounts[0] *
              FOREGROUND_CONSTANTS.cubeCounts[2]),
        ) -
          FOREGROUND_CONSTANTS.cubeCounts[1] / 2) *
        FOREGROUND_CONSTANTS.cubeSize;
      key = `${x.toFixed(8)}_${y.toFixed(8)}`;
      if (zOffsets[key] === undefined) {
        zOffsets[key] =
          (Math.random() - 0.5) * FOREGROUND_CONSTANTS.cubeSize * 0.3;
      }
      z =
        ((Math.floor(i / FOREGROUND_CONSTANTS.cubeCounts[0]) %
          FOREGROUND_CONSTANTS.cubeCounts[2]) -
          FOREGROUND_CONSTANTS.cubeCounts[2] / 2) *
          FOREGROUND_CONSTANTS.cubeSize +
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
    for (let i = 0; i < BACKGROUND_CONSTANTS.totalCubes; i++) {
      instancedMeshRef01.current.setMatrixAt(
        i,
        new THREE.Matrix4().setPosition(
          ((i % BACKGROUND_CONSTANTS.cubeCounts[0]) -
            BACKGROUND_CONSTANTS.cubeCounts[0] / 2) *
            BACKGROUND_CONSTANTS.cubeSize,
          (Math.floor(
            i /
              (BACKGROUND_CONSTANTS.cubeCounts[0] *
                BACKGROUND_CONSTANTS.cubeCounts[2]),
          ) -
            BACKGROUND_CONSTANTS.cubeCounts[1] / 2) *
            BACKGROUND_CONSTANTS.cubeSize,
          ((Math.floor(i / BACKGROUND_CONSTANTS.cubeCounts[0]) %
            BACKGROUND_CONSTANTS.cubeCounts[2]) -
            BACKGROUND_CONSTANTS.cubeCounts[2] / 2) *
            BACKGROUND_CONSTANTS.cubeSize,
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
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [window.innerWidth, window.innerHeight]);

  useFrame(({ gl }) => {
    if (gpgpuTexture00.current) {
      cubeUniforms00.uGPGPUTexture.value = gpgpuTexture00.current;
    }
    if (gpgpuTexture01.current) {
      cubeUniforms01.uGPGPUTexture.value = gpgpuTexture01.current;
    }

    gl.setRenderTarget(clockRenderTarget);
    gl.clear();
    gl.render(clockScene, clockCamera);

    cubeUniforms00.uClockTexture.value = clockRenderTarget.texture;
    clockTextureRef.current = clockRenderTarget.texture;

    gl.setRenderTarget(null);

    if (gpgpuDisplayPlaneRef.current && gpgpuTexture00.current) {
      // @ts-expect-error 'map' does exist.
      gpgpuDisplayPlaneRef.current.material.map = gpgpuTexture00.current;
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
        args={[undefined, undefined, FOREGROUND_CONSTANTS.totalCubes]}
      >
        <meshPhysicalMaterial
          attach="material"
          color={"#363946"}
          metalness={0.02}
          roughness={0.9}
          clearcoat={1}
          clearcoatRoughness={0.3}
          onBeforeCompile={(shader) => {
            shader.uniforms.uGPGPUTexture = cubeUniforms00.uGPGPUTexture;
            shader.vertexShader = shader.vertexShader.replace(
              "#include <common>",
              /* glsl */ `
              #include <common>
              uniform sampler2D uGPGPUTexture;
              attribute vec2 aGpgpuUv;
              `,
            );
            shader.vertexShader = shader.vertexShader.replace(
              "#include <begin_vertex>",
              /* glsl */ `
              #include <begin_vertex>
              vec4 sizeInfo = texture(uGPGPUTexture, aGpgpuUv);
              transformed *= vec3(sizeInfo.x);
              `,
            );
          }}
        />
        <meshDepthMaterial
          attach={"customDepthMaterial"}
          depthPacking={THREE.RGBADepthPacking}
          onBeforeCompile={(shader) => {
            shader.uniforms.uGPGPUTexture = cubeUniforms00.uGPGPUTexture;
            shader.vertexShader = shader.vertexShader.replace(
              "#include <common>",
              /* glsl */ `
              #include <common>
              uniform sampler2D uGPGPUTexture;
              attribute vec2 aGpgpuUv;
              `,
            );
            shader.vertexShader = shader.vertexShader.replace(
              "#include <begin_vertex>",
              /* glsl */ `
              #include <begin_vertex>
              vec4 sizeInfo = texture(uGPGPUTexture, aGpgpuUv);
              transformed *= vec3(sizeInfo.x);
              `,
            );
          }}
        />
        <meshDistanceMaterial
          attach={"customDistanceMaterial"}
          onBeforeCompile={(shader) => {
            shader.uniforms.uGPGPUTexture = cubeUniforms00.uGPGPUTexture;
            shader.vertexShader = shader.vertexShader.replace(
              "#include <common>",
              /* glsl */ `
              #include <common>
              uniform sampler2D uGPGPUTexture;
              attribute vec2 aGpgpuUv;
              `,
            );
            shader.vertexShader = shader.vertexShader.replace(
              "#include <begin_vertex>",
              /* glsl */ `
              #include <begin_vertex>
              vec4 sizeInfo = texture(uGPGPUTexture, aGpgpuUv);
              transformed *= vec3(sizeInfo.x);
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
        args={[undefined, undefined, BACKGROUND_CONSTANTS.totalCubes]}
        rotation={[0, 0, 0]}
        position={[0, 1, -5]}
      >
        <meshStandardMaterial
          attach="material"
          color={"#31E981"}
          metalness={0.02}
          roughness={0.1}
          onBeforeCompile={(shader) => {
            shader.uniforms.uGPGPUTexture = cubeUniforms01.uGPGPUTexture;
            shader.vertexShader = shader.vertexShader.replace(
              "#include <common>",
              /* glsl */ `
              #include <common>
              uniform sampler2D uGPGPUTexture;
              attribute vec2 aGpgpuUv;
              `,
            );
            shader.vertexShader = shader.vertexShader.replace(
              "#include <begin_vertex>",
              /* glsl */ `
              #include <begin_vertex>
              vec4 sizeInfo = texture(uGPGPUTexture, aGpgpuUv);
              transformed *= vec3(sizeInfo.x);
              `,
            );
          }}
        />
        <meshDepthMaterial
          attach={"customDepthMaterial"}
          depthPacking={THREE.RGBADepthPacking}
          onBeforeCompile={(shader) => {
            shader.uniforms.uGPGPUTexture = cubeUniforms01.uGPGPUTexture;
            shader.vertexShader = shader.vertexShader.replace(
              "#include <common>",
              /* glsl */ `
              #include <common>
              uniform sampler2D uGPGPUTexture;
              attribute vec2 aGpgpuUv;
              `,
            );
            shader.vertexShader = shader.vertexShader.replace(
              "#include <begin_vertex>",
              /* glsl */ `
              #include <begin_vertex>
              vec4 sizeInfo = texture(uGPGPUTexture, aGpgpuUv);
              transformed *= vec3(sizeInfo.x);
              `,
            );
          }}
        />
        <meshDistanceMaterial
          attach={"customDistanceMaterial"}
          onBeforeCompile={(shader) => {
            shader.uniforms.uGPGPUTexture = cubeUniforms01.uGPGPUTexture;
            shader.vertexShader = shader.vertexShader.replace(
              "#include <common>",
              /* glsl */ `
              #include <common>
              uniform sampler2D uGPGPUTexture;
              attribute vec2 aGpgpuUv;
              `,
            );
            shader.vertexShader = shader.vertexShader.replace(
              "#include <begin_vertex>",
              /* glsl */ `
              #include <begin_vertex>
              vec4 sizeInfo = texture(uGPGPUTexture, aGpgpuUv);
              transformed *= vec3(sizeInfo.x);
              `,
            );
          }}
        />
      </instancedMesh>
      <Plane ref={gpgpuDisplayPlaneRef}>
        <meshBasicMaterial
          attach="material"
          map={gpgpuTexture00.current}
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
  const spotLightRef01 = useRef<THREE.SpotLight>(null!);
  const spotLightRef02 = useRef<THREE.SpotLight>(null!);
  const spotLightTargetRef00 = useRef<THREE.Object3D>(null);
  const spotLightTargetRef01 = useRef<THREE.Object3D>(null);
  const spotLightTargetRef02 = useRef<THREE.Object3D>(null);
  const helpersEnabled = true;
  useHelper(helpersEnabled && spotLightRef00, THREE.SpotLightHelper);
  useHelper(helpersEnabled && spotLightRef01, THREE.SpotLightHelper);
  useHelper(helpersEnabled && spotLightRef02, THREE.SpotLightHelper);

  const spotLight00Values = useControls("SpotLight 00", {
    positionX: { value: 0, min: -30, max: 30 },
    positionY: { value: 0, min: -30, max: 30 },
    positionZ: { value: -4.4, min: -30, max: 30 },
    targetX: { value: 0, min: -30, max: 30 },
    targetY: { value: 0, min: -30, max: 30 },
    targetZ: { value: 0, min: -30, max: 30 },
    angle: { value: 0.87, min: 0, max: Math.PI / 2 },
    penumbra: { value: 0.27, min: 0, max: 1 },
    decay: { value: 0.1, min: 0, max: 10 },
    intensity: { value: 10, min: 0, max: 50 },
    color: { value: "#31E981" },
  });
  const spotLight01Values = useControls("SpotLight 01", {
    positionX: { value: 0, min: -30, max: 30 },
    positionY: { value: -0.5, min: -30, max: 30 },
    positionZ: { value: -2, min: -30, max: 30 },
    targetX: { value: 0, min: -30, max: 30 },
    targetY: { value: 0, min: -30, max: 30 },
    targetZ: { value: -5, min: -30, max: 30 },
    angle: { value: 1.03, min: 0, max: Math.PI / 2 },
    penumbra: { value: 0.26, min: 0, max: 1 },
    decay: { value: 0.1, min: 0, max: 10 },
    intensity: { value: 2, min: 0, max: 50 },
    color: { value: "#31E981" },
  });
  const spotLight02Values = useControls("SpotLight 02", {
    positionX: { value: -5, min: -30, max: 30 },
    positionY: { value: 7, min: -30, max: 30 },
    positionZ: { value: 10, min: -30, max: 30 },
    targetX: { value: -0.5, min: -30, max: 30 },
    targetY: { value: 0, min: -30, max: 30 },
    targetZ: { value: 1, min: -30, max: 30 },
    angle: { value: 0.3, min: 0, max: Math.PI / 2 },
    penumbra: { value: 0.4, min: 0, max: 1 },
    decay: { value: 0.1, min: 0, max: 10 },
    intensity: { value: 4, min: 0, max: 50 },
    color: { value: "#31E981" },
  });

  useFrame(() => {
    if (
      spotLightTargetRef00.current &&
      spotLightTargetRef01.current &&
      spotLightTargetRef02.current
    ) {
      spotLightRef00.current.target = spotLightTargetRef00.current;
      spotLightRef01.current.target = spotLightTargetRef01.current;
      spotLightRef02.current.target = spotLightTargetRef02.current;
    }
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
        color={spotLight00Values.color}
        intensity={spotLight00Values.intensity}
        angle={spotLight00Values.angle}
        penumbra={spotLight00Values.penumbra}
        decay={spotLight00Values.decay}
        shadow-camera-near={0.01}
        shadow-camera-far={20}
        shadow-camera-fov={spotLight00Values.angle}
        castShadow
      />
      <spotLight
        ref={spotLightRef01}
        position={[
          spotLight01Values.positionX,
          spotLight01Values.positionY,
          spotLight01Values.positionZ,
        ]}
        color={spotLight01Values.color}
        intensity={spotLight01Values.intensity}
        angle={spotLight01Values.angle}
        penumbra={spotLight01Values.penumbra}
        decay={spotLight01Values.decay}
        shadow-camera-near={0.01}
        shadow-camera-far={20}
        shadow-camera-fov={spotLight01Values.angle}
        castShadow
      />
      <spotLight
        ref={spotLightRef02}
        position={[
          spotLight02Values.positionX,
          spotLight02Values.positionY,
          spotLight02Values.positionZ,
        ]}
        color={spotLight02Values.color}
        intensity={spotLight02Values.intensity}
        angle={spotLight02Values.angle}
        penumbra={spotLight02Values.penumbra}
        decay={spotLight02Values.decay}
        shadow-camera-near={0.01}
        shadow-camera-far={20}
        shadow-camera-fov={spotLight02Values.angle}
        castShadow
      />
      <object3D
        ref={spotLightTargetRef00}
        position={[
          spotLight00Values.targetX,
          spotLight00Values.targetY,
          spotLight00Values.targetZ,
        ]}
      />
      <object3D
        ref={spotLightTargetRef01}
        position={[
          spotLight01Values.targetX,
          spotLight01Values.targetY,
          spotLight01Values.targetZ,
        ]}
      />
      <object3D
        ref={spotLightTargetRef02}
        position={[
          spotLight02Values.targetX,
          spotLight02Values.targetY,
          spotLight02Values.targetZ,
        ]}
      />
    </>
  );
}

export default function CavityScene() {
  // const interactionState = useAppStore((state) => state.interactionState);

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
          // cursor: interactionState === "active" ? "default" : "none",
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
          <Cavity />
          <Lights />
          <OrbitControls makeDefault />
        </Suspense>
      </Canvas>
      <Loader />
    </>
  );
}
