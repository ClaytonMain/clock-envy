import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import blackHoleFragmentShader from "./shaders/black-hole/blackHole.frag";
import blackHoleVertexShader from "./shaders/black-hole/blackHole.vert";
import type { BlackHoleUniforms } from "./types/types";
// import type { MncaUniforms } from "./types/types";
import { Html, Plane } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
// import { saveAs } from "file-saver";
import precomputeWorker from "./workers/precompute.ts";

// TODO: Credit properly https://github.com/ebruneton/black_hole_shader/blob/master/black_hole/preprocess/functions.cc#L114
// May or may not need the license added?

// // ********************************
// // Deflection Table Texture D(e, u)
// // ********************************

// const MU = 4 / 27;
const DEFLECTION_TABLE_SIZE = 512;
const RAY_INVERSE_RADIUS_TABLE_SIZE = 64;

const uniforms: BlackHoleUniforms = {
  uTime: { value: 0 },
  uDelta: { value: 0 },
  uCameraPosition: { value: new THREE.Vector3() },
  uCameraSchwarzschildP: { value: new THREE.Vector4() },
  uResolution: {
    value: new THREE.Vector2(window.innerWidth, window.innerHeight),
  },
  uGlZ: { value: -1 / (2 * Math.tan(45 * (Math.PI / 180) * 0.5)) },
  uDeflectionTableTexture: { value: new THREE.DataTexture() },
  uRayInverseRadiusTableTexture: { value: new THREE.DataTexture() },
  uU: { value: 0 },
  uUDot: { value: 0 },
  uE: { value: 0 },
  uESquare: { value: 0 },
};

export default function BlackHoleComponent() {
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

        // // Download texture data
        // const deflectionTableJsonString = JSON.stringify(
        //   deflectionTableTextureData,
        // );
        // const rayInverseRadiusTableJsonString = JSON.stringify(
        //   rayInverseRadiusTableTextureData,
        // );

        // saveAs(
        //   new Blob([deflectionTableJsonString], { type: "application/json" }),
        //   "deflectionTableTexture.json",
        // );
        // saveAs(
        //   new Blob([rayInverseRadiusTableJsonString], {
        //     type: "application/json",
        //   }),
        //   "rayInverseRadiusTableTexture.json",
        // );

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

      uniforms.uDeflectionTableTexture.value = deflectionTableTexture;
      uniforms.uRayInverseRadiusTableTexture.value =
        rayInverseRadiusTableTexture;

      console.log("Textures applied to uniforms.");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [calculating]);

  const deltaRef = useRef(0);
  const uTimeRef = useRef(0);

  // Stuff we need for the camera.
  // From what my squishy brain can tell, Appendix C in the paper describes how they're
  // converting the camera's position in some orbital plane to Schwarzschild coordinates,
  // but I think I can get by with just converting the camera's position to spherical
  // coordinates using regular THREE functions. Not sure if I'll bother with time dilation tbh.
  const cameraPosition = new THREE.Vector3();
  const cameraSpherical = new THREE.Spherical();
  const cameraSchwarzschildP = new THREE.Vector4();

  useFrame(({ camera }, delta) => {
    if (calculating) return;

    deltaRef.current = Math.min(delta, 0.1);
    uTimeRef.current += deltaRef.current;

    uniforms.uTime.value = uTimeRef.current;
    uniforms.uDelta.value = deltaRef.current;

    cameraPosition.copy(camera.position);
    uniforms.uCameraPosition.value.copy(cameraPosition);

    cameraSpherical.setFromVector3(cameraPosition);
    cameraSchwarzschildP.set(
      uTimeRef.current,
      cameraSpherical.radius,
      cameraSpherical.phi,
      cameraSpherical.theta,
    );
    uniforms.uCameraSchwarzschildP.value.copy(cameraSchwarzschildP);

    const u = 1 / cameraSpherical.radius;
    const uDot = -u / Math.tan(deltaRef.current);
    const eSquare = uDot * uDot + u * u * (1.0 - u);
    const e = Math.sqrt(eSquare);

    uniforms.uU.value = u;
    uniforms.uUDot.value = uDot;
    uniforms.uE.value = e;
    uniforms.uESquare.value = eSquare;

    uniforms.uResolution.value.set(window.innerWidth, window.innerHeight);
    texturePlaneUniforms.uWindowResolution.value.set(
      window.innerWidth,
      window.innerHeight,
    );
  });

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
      {!calculating && (
        <>
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
                shader.uniforms.uShowTexture =
                  texturePlaneUniforms.uShowTexture;
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
                shader.uniforms.uShowTexture =
                  texturePlaneUniforms.uShowTexture;
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
      )}
    </>
  );
}
