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
  CUBE_SIZE,
  CUBES_PER_SIDE,
  TEXTURE_SIZE,
  TOTAL_CUBES,
} from "./constants";
import useGPGPU from "./useGPGPU";

const texturePlaneUniforms = {
  uWindowResolution: { value: new THREE.Vector2(1, 1) },
};

const cubeUniforms = {
  uGPGPUTexture: { value: new THREE.Texture() },
  uTotalCubes: { value: TOTAL_CUBES },
  uCubesPerSide: { value: CUBES_PER_SIDE },
  uCubeSize: { value: CUBE_SIZE },
  uWindowResolution: { value: new THREE.Vector2(1, 1) },
  uClockTexture: { value: new THREE.Texture() },
};

function Cavity() {
  const { gpgpuTexture } = useGPGPU();

  const instancedMeshRef = useRef<THREE.InstancedMesh>(null!);

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
    const references = new Float32Array(TOTAL_CUBES * 2);

    for (let i = 0; i < TOTAL_CUBES; i++) {
      const i2 = i * 2;
      references[i2 + 0] = (i % TEXTURE_SIZE) / (TEXTURE_SIZE - 1);
      references[i2 + 1] = ~~(i / TEXTURE_SIZE) / (TEXTURE_SIZE - 1);
    }

    geometry.setAttribute(
      "aReference",
      new THREE.InstancedBufferAttribute(references, 2),
    );

    return geometry;
  }, []);

  useEffect(() => {
    if (!instancedMeshRef.current) return;
    for (let i = 0; i < TOTAL_CUBES; i++) {
      instancedMeshRef.current.setMatrixAt(
        i,
        new THREE.Matrix4().setPosition(
          ((i % CUBES_PER_SIDE) - (CUBES_PER_SIDE - 1) / 2) * CUBE_SIZE,
          (~~(i / CUBES_PER_SIDE ** 2) - (CUBES_PER_SIDE - 1) / 2) * CUBE_SIZE,
          (~~((i / CUBES_PER_SIDE) % CUBES_PER_SIDE) -
            (CUBES_PER_SIDE - 1) / 2) *
            CUBE_SIZE,
        ),
      );
    }
    instancedMeshRef.current.instanceMatrix.needsUpdate = true;
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
    if (instancedMeshRef.current && gpgpuTexture.current) {
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
          metalness={0.6}
          roughness={0.8}
          // flatShading={true}
          onBeforeCompile={(shader) => {
            shader.uniforms.uGPGPUTexture = cubeUniforms.uGPGPUTexture;
            shader.uniforms.uTotalCubes = cubeUniforms.uTotalCubes;
            shader.uniforms.uCubesPerSide = cubeUniforms.uCubesPerSide;
            shader.uniforms.uCubeSize = cubeUniforms.uCubeSize;
            shader.uniforms.uWindowResolution = cubeUniforms.uWindowResolution;
            shader.uniforms.uClockTexture = cubeUniforms.uClockTexture;
            shader.vertexShader = shader.vertexShader.replace(
              "#include <common>",
              /* glsl */ `
              #include <common>

              uniform sampler2D uGPGPUTexture;
              uniform int uTotalCubes;
              uniform float uCubeSize;
              uniform int uCubesPerSide;
              uniform vec2 uWindowResolution;
              uniform sampler2D uClockTexture;

              attribute vec2 aReference;

              varying vec2 vClockUv;
              `,
            );
            shader.vertexShader = shader.vertexShader.replace(
              "#include <begin_vertex>",
              /* glsl */ `
              #include <begin_vertex>

              vec4 sizeInfo = texture(uGPGPUTexture, aReference);
              vec4 tempMvPosition = vec4( transformed, 1.0 );
              #ifdef USE_INSTANCING
                tempMvPosition = instanceMatrix * tempMvPosition;
              #endif
              tempMvPosition = modelViewMatrix * tempMvPosition;
              vec4 tempGlPosition = projectionMatrix * tempMvPosition;
              vec3 ndc = tempGlPosition.xyz / tempGlPosition.w;
              vec2 clockUv = ndc.xy * 0.5 + 0.5;
              vClockUv = clockUv;
              vec4 clockInfo = texture(uClockTexture, clockUv);
              sizeInfo *= 1.0 - clockInfo.r;

              sizeInfo = smoothstep(0.0, 1.0, sizeInfo);
              float sizeIn = smoothstep(0.0, 0.1, sizeInfo.x);
              float sizeOut = 1.0 - smoothstep(0.9, 1.0, sizeInfo.x);
              float size = min(sizeIn, sizeOut);

              transformed *= vec3(size);
              `,
            );
            shader.fragmentShader = /* glsl */ `
              uniform vec2 uWindowResolution;
              varying vec2 vClockUv;
              void main() {
                  // gl_FragColor = vec4(gl_FragCoord.x / uWindowResolution.x, gl_FragCoord.y / uWindowResolution.y, 0.0, 1.0);
                  gl_FragColor = vec4(vClockUv, 0.0, 1.0);
              }
              `;
          }}
        />
        <meshDepthMaterial
          attach={"customDepthMaterial"}
          depthPacking={THREE.RGBADepthPacking}
          onBeforeCompile={(shader) => {
            shader.vertexShader = shader.vertexShader.replace(
              "#include <common>",
              /* glsl */ `
              #include <common>

              uniform sampler2D uTextureSize;
              uniform int uNumVoxels;
              uniform float uVoxelSize;
              uniform int uVoxelsPerAxis;

              attribute vec2 aReference;
              `,
            );
            shader.vertexShader = shader.vertexShader.replace(
              "#include <begin_vertex>",
              /* glsl */ `
              #include <begin_vertex>

              vec4 sizeInfo = texture(uGPGPUTexture, aReference);

              sizeInfo = smoothstep(0.0, 1.0, sizeInfo);
              float sizeIn = smoothstep(0.0, 0.1, sizeInfo.x);
              float sizeOut = 1.0 - smoothstep(0.7, 1.0, sizeInfo.x);
              float size = min(sizeIn, sizeOut);

              transformed *= vec3(size);
              `,
            );
          }}
        />
      </instancedMesh>
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
          <Environment
            files="./environments/photo_studio_loft_hall_4k.exr"
            resolution={2048}
          />
          <ambientLight intensity={0.5} />
          <Cavity />
          <OrbitControls makeDefault />
        </Suspense>
      </Canvas>
      <Loader />
    </>
  );
}
