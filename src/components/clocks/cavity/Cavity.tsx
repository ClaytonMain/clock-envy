import {
  Environment,
  Loader,
  OrbitControls,
  Plane,
  useFBO,
} from "@react-three/drei";
import { Canvas, createPortal, useFrame } from "@react-three/fiber";
import { Suspense, useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
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
  const { gpgpuTexture } = useGPGPU();

  const instancedMeshRef = useRef<THREE.InstancedMesh>(null!);
  const instancedMeshRef02 = useRef<THREE.InstancedMesh>(null!);

  const gpgpuDisplayPlaneRef = useRef<THREE.Mesh>(null!);
  const clockDisplayPlaneRef = useRef<THREE.Mesh>(null!);

  const clockScene = useMemo(() => new THREE.Scene(), []);
  const clockCamera = useMemo(
    () =>
      new THREE.OrthographicCamera(
        -window.innerWidth / 2,
        window.innerWidth / 2,
        window.innerHeight / 2,
        -window.innerHeight / 2,
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

  const cubesGeometry = useMemo(() => {
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

  useEffect(() => {
    if (!instancedMeshRef.current) return;
    for (let i = 0; i < TOTAL_CUBES; i++) {
      instancedMeshRef.current.setMatrixAt(
        i,
        new THREE.Matrix4().setPosition(
          ((i % CUBE_COUNT_X) - CUBE_COUNT_X / 2) * CUBE_SIZE,
          (Math.floor(i / (CUBE_COUNT_X * CUBE_COUNT_Z)) - CUBE_COUNT_Y / 2) *
            CUBE_SIZE,
          ((Math.floor(i / CUBE_COUNT_X) % CUBE_COUNT_Z) - CUBE_COUNT_Z / 2) *
            CUBE_SIZE,
        ),
      );
    }
    instancedMeshRef.current.instanceMatrix.needsUpdate = true;
  }, []);

  useEffect(() => {
    if (!instancedMeshRef02.current) return;
    for (let i = 0; i < TOTAL_CUBES; i++) {
      instancedMeshRef02.current.setMatrixAt(
        i,
        new THREE.Matrix4().setPosition(
          ((i % CUBE_COUNT_X) - CUBE_COUNT_X / 2) * CUBE_SIZE,
          (Math.floor(i / (CUBE_COUNT_X * CUBE_COUNT_Z)) - CUBE_COUNT_Y / 2) *
            CUBE_SIZE,
          ((Math.floor(i / CUBE_COUNT_X) % CUBE_COUNT_Z) - CUBE_COUNT_Z / 2) *
            CUBE_SIZE,
        ),
      );
    }
    instancedMeshRef02.current.instanceMatrix.needsUpdate = true;
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
    if (gpgpuTexture.current) {
      cubeUniforms.uGPGPUTexture.value = gpgpuTexture.current;
    }

    gl.setRenderTarget(clockRenderTarget);
    gl.clear();
    gl.render(clockScene, clockCamera);

    cubeUniforms.uClockTexture.value = clockRenderTarget.texture;

    gl.setRenderTarget(null);

    if (gpgpuDisplayPlaneRef.current && gpgpuTexture.current) {
      // @ts-expect-error 'map' does exist.
      gpgpuDisplayPlaneRef.current.material.map = gpgpuTexture.current;
    }
    // @ts-expect-error `map` does exist.
    clockDisplayPlaneRef.current.material.map = clockRenderTarget.texture;
  });

  return (
    <>
      {createPortal(<ClockDisplay />, clockScene)}
      <instancedMesh
        ref={instancedMeshRef}
        geometry={cubesGeometry!}
        castShadow
        receiveShadow
        args={[undefined, undefined, TOTAL_CUBES]}
      >
        <meshStandardMaterial
          attach="material"
          color={"#111"}
          metalness={0.1}
          roughness={0.9}
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
              vec4 tempMvPosition = vec4( 0.0, 0.0, 0.0, 1.0 );
              #ifdef USE_INSTANCING
                tempMvPosition = instanceMatrix * tempMvPosition;
              #endif
              tempMvPosition = modelViewMatrix * tempMvPosition;
              vec4 tempGlPosition = projectionMatrix * tempMvPosition;
              vec3 ndc = tempGlPosition.xyz / tempGlPosition.w;
              vec2 clockUv = ndc.xy * 0.5 + 0.5;
              vec4 clockInfo = texture(uClockTexture, clockUv);

              sizeInfo = smoothstep(0.0, 1.0, sizeInfo);
              float sizeIn = smoothstep(0.0, 0.1, sizeInfo.x);
              float sizeOut = 1.0 - smoothstep(0.9, 1.0, sizeInfo.x);
              float size = min(sizeIn, sizeOut);

              float wall = smoothstep(0.6, 1.0, 1.0 - abs(aNormalizedCubePosition.z * 2.0));
              wall = wall * wall * wall;
              size = max(size, wall);
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
              vec4 tempMvPosition = vec4( 0.0, 0.0, 0.0, 1.0 );
              #ifdef USE_INSTANCING
                tempMvPosition = instanceMatrix * tempMvPosition;
              #endif
              tempMvPosition = modelViewMatrix * tempMvPosition;
              vec4 tempGlPosition = projectionMatrix * tempMvPosition;
              vec3 ndc = tempGlPosition.xyz / tempGlPosition.w;
              vec2 clockUv = ndc.xy * 0.5 + 0.5;
              vec4 clockInfo = texture(uClockTexture, clockUv);

              sizeInfo = smoothstep(0.0, 1.0, sizeInfo);
              float sizeIn = smoothstep(0.0, 0.1, sizeInfo.x);
              float sizeOut = 1.0 - smoothstep(0.9, 1.0, sizeInfo.x);
              float size = min(sizeIn, sizeOut);

              float wall = smoothstep(0.6, 1.0, 1.0 - abs(aNormalizedCubePosition.z * 2.0));
              wall = wall * wall * wall;
              size = max(size, wall);
              size *= smoothstep(1.0, 0.0, clockInfo.r);

              transformed *= vec3(size);
              `,
            );
          }}
        />
      </instancedMesh>
      <group position={[0, 0, -10]}>
        <instancedMesh
          ref={instancedMeshRef02}
          geometry={cubesGeometry!}
          castShadow
          receiveShadow
          args={[undefined, undefined, TOTAL_CUBES]}
        >
          <meshStandardMaterial
            attach="material"
            color={"#111"}
            metalness={0.1}
            roughness={0.9}
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
              vec4 tempMvPosition = vec4( 0.0, 0.0, 0.0, 1.0 );
              #ifdef USE_INSTANCING
                tempMvPosition = instanceMatrix * tempMvPosition;
              #endif
              tempMvPosition = modelViewMatrix * tempMvPosition;
              vec4 tempGlPosition = projectionMatrix * tempMvPosition;
              vec3 ndc = tempGlPosition.xyz / tempGlPosition.w;
              vec2 clockUv = ndc.xy * 0.5 + 0.5;
              vec4 clockInfo = texture(uClockTexture, clockUv);

              sizeInfo = smoothstep(0.0, 1.0, sizeInfo);
              float sizeIn = smoothstep(0.0, 0.1, sizeInfo.x);
              float sizeOut = 1.0 - smoothstep(0.9, 1.0, sizeInfo.x);
              float size = min(sizeIn, sizeOut);

              float wall = smoothstep(0.6, 1.0, 1.0 - abs(aNormalizedCubePosition.z * 2.0));
              wall = wall * wall * wall;
              size = max(size, wall);
              // size *= smoothstep(1.0, 0.0, clockInfo.r);

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
              vec4 tempMvPosition = vec4( 0.0, 0.0, 0.0, 1.0 );
              #ifdef USE_INSTANCING
                tempMvPosition = instanceMatrix * tempMvPosition;
              #endif
              tempMvPosition = modelViewMatrix * tempMvPosition;
              vec4 tempGlPosition = projectionMatrix * tempMvPosition;
              vec3 ndc = tempGlPosition.xyz / tempGlPosition.w;
              vec2 clockUv = ndc.xy * 0.5 + 0.5;
              vec4 clockInfo = texture(uClockTexture, clockUv);

              sizeInfo = smoothstep(0.0, 1.0, sizeInfo);
              float sizeIn = smoothstep(0.0, 0.1, sizeInfo.x);
              float sizeOut = 1.0 - smoothstep(0.9, 1.0, sizeInfo.x);
              float size = min(sizeIn, sizeOut);

              float wall = smoothstep(0.6, 1.0, 1.0 - abs(aNormalizedCubePosition.z * 2.0));
              wall = wall * wall * wall;
              size = max(size, wall);
              // size *= smoothstep(1.0, 0.0, clockInfo.r);

              transformed *= vec3(size);
              `,
              );
            }}
          />
        </instancedMesh>
      </group>
      <Plane ref={gpgpuDisplayPlaneRef}>
        <meshBasicMaterial
          attach="material"
          map={gpgpuTexture.current}
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
          <ambientLight intensity={0.1} />
          <pointLight
            position={[0, 0, -6]}
            color={"orange"}
            intensity={500}
            castShadow
          />
          <Cavity />
          <OrbitControls makeDefault />
        </Suspense>
      </Canvas>
      <Loader />
    </>
  );
}
