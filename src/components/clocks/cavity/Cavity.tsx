import { Loader, OrbitControls, Plane, useFBO } from "@react-three/drei";
import { Canvas, createPortal, useFrame } from "@react-three/fiber";
import { useControls } from "leva";
import { Suspense, useEffect, useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import useAppStore from "../../../stores/useAppStore";
import useCavityStore from "../../../stores/useCavityStore";
import BasicBoundsBoxBaybee from "../../misc/BasicBoundsBoxBaybee";
import CustomStatsComponent from "../../misc/CustomStatsComponent";
import ClockDisplay from "./ClockDisplay";
import {
  BACKGROUND_CONSTANTS,
  FOREGROUND_CONSTANTS,
} from "./constants/constants";
import Lights from "./Lights";
import Screen from "./Screen";
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
  const showTextureDisplayPlanes = false;
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
        102.4 / 2,
        -102.4 / 2,
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
    const secondaryColor = useCavityStore.getState().secondaryColor;

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
      instancedMeshRef00.current.setColorAt(
        i,
        new THREE.Color(
          Math.min(
            Math.max(secondaryColor.r + (Math.random() - 0.5) * 0.015, 0),
            1,
          ),
          Math.min(
            Math.max(secondaryColor.g + (Math.random() - 0.5) * 0.015, 0),
            1,
          ),
          Math.min(
            Math.max(secondaryColor.b + (Math.random() - 0.5) * 0.015, 0),
            1,
          ),
        ),
      );
    }
    instancedMeshRef00.current.instanceMatrix.needsUpdate = true;
    instancedMeshRef00.current.matrixWorldNeedsUpdate = true;
  }, []);

  useLayoutEffect(() => {
    const zOffsets: Record<string, number> = {};
    let x = -1;
    let y = -1;
    let key = "";
    let z = -999;

    const primaryColor = useCavityStore.getState().primaryColor;

    for (let i = 0; i < BACKGROUND_CONSTANTS.totalCubes; i++) {
      x =
        ((i % BACKGROUND_CONSTANTS.cubeCounts[0]) -
          BACKGROUND_CONSTANTS.cubeCounts[0] / 2) *
        BACKGROUND_CONSTANTS.cubeSize;
      y =
        (Math.floor(
          i /
            (BACKGROUND_CONSTANTS.cubeCounts[0] *
              BACKGROUND_CONSTANTS.cubeCounts[2]),
        ) -
          BACKGROUND_CONSTANTS.cubeCounts[1] / 2) *
        BACKGROUND_CONSTANTS.cubeSize;
      key = `${x.toFixed(8)}_${y.toFixed(8)}`;
      if (zOffsets[key] === undefined) {
        zOffsets[key] =
          (Math.random() - 0.5) * BACKGROUND_CONSTANTS.cubeSize * 0.3;
      }
      z =
        ((Math.floor(i / BACKGROUND_CONSTANTS.cubeCounts[0]) %
          BACKGROUND_CONSTANTS.cubeCounts[2]) -
          BACKGROUND_CONSTANTS.cubeCounts[2] / 2) *
          BACKGROUND_CONSTANTS.cubeSize +
        zOffsets[key];
      instancedMeshRef01.current.setMatrixAt(
        i,
        new THREE.Matrix4().setPosition(x, y, z),
      );
      instancedMeshRef01.current.setColorAt(
        i,
        new THREE.Color(
          Math.min(
            Math.max(primaryColor.r + (Math.random() - 0.5) * 0.015, 0),
            1,
          ),
          Math.min(
            Math.max(primaryColor.g + (Math.random() - 0.5) * 0.015, 0),
            1,
          ),
          Math.min(
            Math.max(primaryColor.b + (Math.random() - 0.5) * 0.015, 0),
            1,
          ),
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

  useEffect(() => {
    const unsubPrimaryColor = useCavityStore.subscribe(
      (state) => state.primaryColor,
      (color) => {
        if (instancedMeshRef01.current) {
          for (let i = 0; i < BACKGROUND_CONSTANTS.totalCubes; i++) {
            instancedMeshRef01.current.setColorAt(
              i,
              new THREE.Color(
                Math.min(
                  Math.max(color.r + (Math.random() - 0.5) * 0.015, 0),
                  1,
                ),
                Math.min(
                  Math.max(color.g + (Math.random() - 0.5) * 0.015, 0),
                  1,
                ),
                Math.min(
                  Math.max(color.b + (Math.random() - 0.5) * 0.015, 0),
                  1,
                ),
              ),
            );
          }
          instancedMeshRef01.current.instanceColor!.needsUpdate = true;
        }
      },
    );
    const unsubSecondaryColor = useCavityStore.subscribe(
      (state) => state.secondaryColor,
      (color) => {
        if (instancedMeshRef00.current) {
          for (let i = 0; i < FOREGROUND_CONSTANTS.totalCubes; i++) {
            instancedMeshRef00.current.setColorAt(
              i,
              new THREE.Color(
                Math.min(
                  Math.max(color.r + (Math.random() - 0.5) * 0.015, 0),
                  1,
                ),
                Math.min(
                  Math.max(color.g + (Math.random() - 0.5) * 0.015, 0),
                  1,
                ),
                Math.min(
                  Math.max(color.b + (Math.random() - 0.5) * 0.015, 0),
                  1,
                ),
              ),
            );
          }
          instancedMeshRef00.current.instanceColor!.needsUpdate = true;
        }
      },
    );
    return () => {
      unsubPrimaryColor();
      unsubSecondaryColor();
    };
  }, []);

  useFrame(({ gl, camera }) => {
    const angle =
      (-useAppStore.getState().currentTimeValue.toSeconds() / 60) *
        Math.PI *
        2 +
      Math.PI / 2;
    camera.position.lerp(
      new THREE.Vector3(
        Math.cos(angle) * 1.1,
        Math.sin(angle) * 1.1 - 2.5,
        camera.position.z,
      ),
      0.1,
    );
    camera.lookAt(new THREE.Vector3(0, 0, 0));
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
      {createPortal(<ClockDisplay position={[0, -9, 0]} />, clockScene)}
      <instancedMesh
        ref={instancedMeshRef00}
        geometry={cubesGeometry00!}
        castShadow
        receiveShadow
        args={[undefined, undefined, FOREGROUND_CONSTANTS.totalCubes]}
      >
        <meshPhysicalMaterial
          attach="material"
          // color={useCavityStore.getState().secondaryColor}
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
        position={[0, 0.22, -2]}
      >
        <meshStandardMaterial
          attach="material"
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
      <Plane ref={gpgpuDisplayPlaneRef} visible={showTextureDisplayPlanes}>
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
      <Plane ref={clockDisplayPlaneRef} visible={showTextureDisplayPlanes}>
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
  const debug = useAppStore((state) => state.debug);
  const canvasRef = useRef<HTMLCanvasElement>(null!);

  useControls("Cavity Scene", {
    primaryColor: {
      value: `#${useCavityStore.getState().primaryColor.getHexString()}`,
      onEditEnd: (value) => {
        useCavityStore.setState({ primaryColor: new THREE.Color(value) });
      },
    },
    secondaryColor: {
      value: `#${useCavityStore.getState().secondaryColor.getHexString()}`,
      onEditEnd: (value) => {
        useCavityStore.setState({ secondaryColor: new THREE.Color(value) });
      },
    },
  });
  // const interactionState = useAppStore((state) => state.interactionState);

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
          position: [0, -2.5, 19],
          fov: 8,
        }}
        style={{
          touchAction: "none",
        }}
      >
        <CustomStatsComponent />
        <Suspense fallback={null}>
          <ambientLight intensity={0.1} />
          <Cavity />
          <Screen />
          <Lights />
          <OrbitControls
            makeDefault
            enablePan={debug}
            enableRotate={debug}
            minDistance={5}
            maxDistance={80}
          />
        </Suspense>
        <BasicBoundsBoxBaybee
          boxArgs={[
            FOREGROUND_CONSTANTS.cubeCounts[0] * FOREGROUND_CONSTANTS.cubeSize,
            FOREGROUND_CONSTANTS.cubeCounts[1] * FOREGROUND_CONSTANTS.cubeSize,
            FOREGROUND_CONSTANTS.cubeCounts[2] * FOREGROUND_CONSTANTS.cubeSize,
          ]}
        />
      </Canvas>
      <Loader />
    </>
  );
}
