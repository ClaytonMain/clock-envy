import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import blackHoleFragmentShader from "./shaders/black-hole/blackHole.frag";
import blackHoleVertexShader from "./shaders/black-hole/blackHole.vert";
import type { BlackHoleUniforms } from "./types/types";
// import type { MncaUniforms } from "./types/types";
import { Html, Plane } from "@react-three/drei";
import precomputeWorker from "./workers/precompute.ts";

// TODO: Credit properly https://github.com/ebruneton/black_hole_shader/blob/master/black_hole/preprocess/functions.cc#L114
// May or may not need the license added?

// // ********************************
// // Deflection Table Texture D(e, u)
// // ********************************

// const MU = 4 / 27;
const DEFLECTION_TABLE_SIZE = 512;
const RAY_INVERSE_RADIUS_TABLE_SIZE = 64;

export default function BlackHoleComponent({
  uniforms,
}: {
  uniforms: BlackHoleUniforms;
}) {
  const deflectionTableDisplayPlaneRef = useRef<THREE.Mesh>(null);
  const rayInverseRadiusTableDisplayPlaneRef = useRef<THREE.Mesh>(null);

  const renderPlanePositions = useMemo(
    () =>
      new Float32Array([
        -1, -1, 0, 1, -1, 0, 1, 1, 0, -1, -1, 0, 1, 1, 0, -1, 1, 0,
      ]),
    [],
  );
  const renderPlaneUvs = useMemo(
    () => new Float32Array([0, 0, 1, 0, 1, 1, 0, 0, 1, 1, 0, 1]),
    [],
  );

  const [calculating, setCalculating] = useState(true);
  const [deflectionTableTexture, setDeflectionTableTexture] =
    useState<THREE.DataTexture | null>(null);
  const [rayInverseRadiusTableTexture, setRayInverseRadiusTableTexture] =
    useState<THREE.DataTexture | null>(null);

  const texturePlaneUniforms = useMemo(() => {
    return {
      uWindowResolution: {
        value: new THREE.Vector2(window.innerWidth, window.innerHeight),
      },
      uShowTexture: { value: 1.0 },
    };
  }, []);

  useEffect(() => {
    const worker = new Worker(precomputeWorker);
    worker.postMessage({
      type: "precompute",
      deflectionTableSize: DEFLECTION_TABLE_SIZE,
      rayInverseRadiusTableSize: RAY_INVERSE_RADIUS_TABLE_SIZE,
    });
    worker.onmessage = (event) => {
      const {
        type,
        deflectionTableTextureData,
        rayInverseRadiusTableTextureData,
      } = event.data;
      if (type === "precomputed") {
        console.log(
          "Deflection Table Texture Data:",
          deflectionTableTextureData,
        );
        console.log(
          "Ray Inverse Radius Table Texture Data:",
          rayInverseRadiusTableTextureData,
        );

        const deflectionTableTextureRGBAData = new Float32Array(
          DEFLECTION_TABLE_SIZE * DEFLECTION_TABLE_SIZE * 4,
        );
        const rayInverseRadiusTableTextureRGBAData = new Float32Array(
          RAY_INVERSE_RADIUS_TABLE_SIZE * RAY_INVERSE_RADIUS_TABLE_SIZE * 4,
        );

        for (
          let i = 0;
          i < DEFLECTION_TABLE_SIZE * DEFLECTION_TABLE_SIZE;
          i++
        ) {
          const i2 = i * 2;
          const i4 = i * 4;

          // Max R is about 13.4142
          // Max G is about 149.8022

          deflectionTableTextureRGBAData[i4 + 0] =
            deflectionTableTextureData[i2 + 0];
          deflectionTableTextureRGBAData[i4 + 1] =
            deflectionTableTextureData[i2 + 1];
          deflectionTableTextureRGBAData[i4 + 2] = 0;
          deflectionTableTextureRGBAData[i4 + 3] = 0;
        }

        for (
          let i = 0;
          i < RAY_INVERSE_RADIUS_TABLE_SIZE * RAY_INVERSE_RADIUS_TABLE_SIZE;
          i++
        ) {
          const i2 = i * 2;
          const i4 = i * 4;

          // Max R is about 0.9253
          // Max G is about 179.8725

          rayInverseRadiusTableTextureRGBAData[i4 + 0] =
            rayInverseRadiusTableTextureData[i2 + 0];
          rayInverseRadiusTableTextureRGBAData[i4 + 1] =
            rayInverseRadiusTableTextureData[i2 + 1];
          rayInverseRadiusTableTextureRGBAData[i4 + 2] = 0;
          rayInverseRadiusTableTextureRGBAData[i4 + 3] = 0;
        }

        const deflectionTableTexture = new THREE.DataTexture(
          deflectionTableTextureRGBAData,
          DEFLECTION_TABLE_SIZE,
          DEFLECTION_TABLE_SIZE,
          THREE.RGBAFormat,
          THREE.FloatType,
        );
        const rayInverseRadiusTableTexture = new THREE.DataTexture(
          rayInverseRadiusTableTextureRGBAData,
          RAY_INVERSE_RADIUS_TABLE_SIZE,
          RAY_INVERSE_RADIUS_TABLE_SIZE,
          THREE.RGBAFormat,
          THREE.FloatType,
        );

        deflectionTableTexture.needsUpdate = true;
        rayInverseRadiusTableTexture.needsUpdate = true;

        setDeflectionTableTexture(deflectionTableTexture);
        setRayInverseRadiusTableTexture(rayInverseRadiusTableTexture);
        setCalculating(false);
      }
    };
    return () => {
      worker.terminate();
    };
  }, []);

  useEffect(() => {
    if (
      deflectionTableTexture &&
      rayInverseRadiusTableTexture &&
      deflectionTableDisplayPlaneRef.current &&
      rayInverseRadiusTableDisplayPlaneRef.current &&
      deflectionTableDisplayPlaneRef.current.material instanceof
        THREE.MeshBasicMaterial &&
      rayInverseRadiusTableDisplayPlaneRef.current.material instanceof
        THREE.MeshBasicMaterial
    ) {
      console.log(deflectionTableTexture, rayInverseRadiusTableTexture);

      deflectionTableDisplayPlaneRef.current.material.map =
        deflectionTableTexture;
      rayInverseRadiusTableDisplayPlaneRef.current.material.map =
        rayInverseRadiusTableTexture;

      console.log("Textures applied to display planes.");
    }
  }, [calculating]);

  return (
    <>
      {calculating && (
        <Html>
          <div
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
            }}
          >
            Calculating
          </div>
        </Html>
      )}
      <mesh>
        <shaderMaterial
          uniforms={uniforms}
          vertexShader={blackHoleVertexShader}
          fragmentShader={blackHoleFragmentShader}
        />
        <bufferGeometry>
          <bufferAttribute
            args={[renderPlanePositions, 3]}
            attach="attributes-position"
            array={renderPlanePositions}
            count={renderPlanePositions.length / 3}
            itemSize={3}
          />
          <bufferAttribute
            args={[renderPlaneUvs, 2]}
            attach="attributes-uv"
            array={renderPlaneUvs}
            count={renderPlaneUvs.length / 2}
            itemSize={2}
          />
        </bufferGeometry>
      </mesh>
      <Plane ref={deflectionTableDisplayPlaneRef} visible={true}>
        <meshBasicMaterial
          attach="material"
          map={deflectionTableTexture || new THREE.DataTexture()}
          depthTest={false}
          depthWrite={false}
          onBeforeCompile={(shader) => {
            shader.uniforms.uWindowResolution =
              texturePlaneUniforms.uWindowResolution;
            shader.uniforms.uShowTexture = texturePlaneUniforms.uShowTexture;
            shader.vertexShader = shader.vertexShader.replace(
              "#include <common>",
              /* glsl */ `
              #include <common>
              uniform vec2 uWindowResolution;
              uniform float uShowTexture;
              `,
            );
            shader.vertexShader = shader.vertexShader.replace(
              "#include <project_vertex>",
              /* glsl */ `
              #include <project_vertex>
              gl_Position = vec4(position, 1.0) * vec4(0.4 * (uWindowResolution.y / uWindowResolution.x), 0.4, 1.0, 1.0) + vec4(1.0 - (0.4 * (uWindowResolution.y / uWindowResolution.x)) * 0.5, 0.8, 0.0, 0.0);
              gl_Position += vec4(vec3((1.0 - uShowTexture) * 9999.0), 0.0);
              `,
            );
          }}
        />
      </Plane>
      <Plane ref={rayInverseRadiusTableDisplayPlaneRef} visible={true}>
        <meshBasicMaterial
          attach="material"
          map={rayInverseRadiusTableTexture || new THREE.DataTexture()}
          depthTest={false}
          depthWrite={false}
          onBeforeCompile={(shader) => {
            shader.uniforms.uWindowResolution =
              texturePlaneUniforms.uWindowResolution;
            shader.uniforms.uShowTexture = texturePlaneUniforms.uShowTexture;
            shader.vertexShader = shader.vertexShader.replace(
              "#include <common>",
              /* glsl */ `
              #include <common>
              uniform vec2 uWindowResolution;
              uniform float uShowTexture;
              `,
            );
            shader.vertexShader = shader.vertexShader.replace(
              "#include <project_vertex>",
              /* glsl */ `
              #include <project_vertex>
              gl_Position = vec4(position, 1.0) * vec4(0.4 * (uWindowResolution.y / uWindowResolution.x), 0.4, 1.0, 1.0) + vec4(1.0 - (0.4 * (uWindowResolution.y / uWindowResolution.x)) * 0.5, 0.4, 0.0, 0.0);
              gl_Position += vec4(vec3((1.0 - uShowTexture) * 9999.0), 0.0);
              `,
            );
          }}
        />
      </Plane>
    </>
  );
}
