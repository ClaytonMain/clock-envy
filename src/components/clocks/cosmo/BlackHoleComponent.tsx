import { useEffect, useMemo, useState } from "react";
import * as THREE from "three";
import blackHoleFragmentShader from "./shaders/black-hole/blackHole.frag";
import blackHoleVertexShader from "./shaders/black-hole/blackHole.vert";
import type { BlackHoleUniforms } from "./types/types";
// import type { MncaUniforms } from "./types/types";
import { Plane } from "@react-three/drei";
import precomputeWorker from "./workers/precompute.ts";

// TODO: Credit properly https://github.com/ebruneton/black_hole_shader/blob/master/black_hole/preprocess/functions.cc#L114
// May or may not need the license added?

// // ********************************
// // Deflection Table Texture D(e, u)
// // ********************************

// const MU = 4 / 27;
const DEFLECTION_TABLE_SIZE = 512;

// function getUApsis(eSq: number) {
//   return 1 / 3 + (2 / 3) * Math.sin((1 / 3) * Math.asin((2 * eSq) / MU - 1));
// }

// function getDeuTexelCoordinates(e: number, u: number): [number, number] {
//   let texelU = 0;
//   let texelV = 0;
//   const eSq = e * e;
//   if (eSq < MU) {
//     texelU = 1 / 2 - Math.sqrt(-Math.log(1 - eSq / MU) / 50);
//     texelV = 1 - Math.sqrt(1 - u / getUApsis(eSq));
//   } else {
//     texelU = 1 / 2 + Math.sqrt(-Math.log(1 - MU / eSq) / 50);
//     texelV =
//       (Math.sqrt(2 / 3) +
//         Math.sign(u - 2 / 3) * Math.sqrt(Math.abs(u - 2 / 3))) /
//       (Math.sqrt(2 / 3) + Math.sqrt(1 / 3));
//   }
//   return [texelU, texelV];
// }

// function getEForDeflectionTexelU(texelU: number): number {
//   if (texelU <= 0.5) {
//     return Math.sqrt(MU * (1.0 - Math.exp(-50.0 * Math.pow(texelU - 0.5, 2))));
//   }
//   return Math.sqrt(MU / (1.0 - Math.exp(-50.0 * Math.pow(texelU - 0.5, 2))));
// }

// function getDeflectionTableTextureDeu() {
//   const eps = 1e-5;
//   const data = new Float32Array(
//     DEFLECTION_TABLE_SIZE * DEFLECTION_TABLE_SIZE * 2,
//   );
//   for (let i = 0; i < DEFLECTION_TABLE_SIZE; i++) {
//     const e = getEForDeflectionTexelU(i / (DEFLECTION_TABLE_SIZE - 1));
//     let t = 0;
//     let u = 0;
//     let uDot = e;
//     let phi = 0;
//     let dPhi = eps;

//     let delta;
//     let j;

//     let prevDelta = 0;
//     let prevT = 0;
//     let prevJ = 0;

//     while (true) {
//       if (u >= 1 || uDot < 0) {
//         // Set texture using prevDelta and PrevT, then break.
//         const index = i * DEFLECTION_TABLE_SIZE + Math.floor(prevJ);
//         data[index * 2 + 0] = prevDelta;
//         data[index * 2 + 1] = prevT;

//         break;
//       }

//       delta = phi - Math.atan2(u, uDot);
//       j = getDeuTexelCoordinates(e, u)[1] * (DEFLECTION_TABLE_SIZE - 1);

//       const k0 = Math.ceil(prevJ);
//       const k1 = Math.ceil(j);

//       for (let k = k0; k <= k1; ++k) {
//         // I know this has something to do with interpolating between the values
//         // needed for our deflection table at "j" and "prevJ", but I need to study
//         // this more to understand it fully.
//         // TODO: Study this more to understand it fully.
//         const lerp = (k - prevJ) / (j - prevJ);
//         const lerpDelta = prevDelta * (1.0 - lerp) + delta * lerp;
//         const lerpT = prevT * (1.0 - lerp) + t * lerp;

//         const index = i * DEFLECTION_TABLE_SIZE + k;
//         data[index * 2 + 0] = lerpDelta;
//         data[index * 2 + 1] = lerpT;
//       }

//       prevDelta = delta;
//       prevT = t;
//       prevJ = j;

//       // Why?
//       if (u > 1e-2) {
//         t = t + (e / (Math.pow(u, 2) * (1.0 - u))) * dPhi;
//       }

//       uDot = uDot + (1.5 * Math.pow(u, 2) - u) * dPhi;
//       u = u + uDot * dPhi;
//       phi = phi + dPhi;
//     }
//   }

//   const texture = new THREE.DataTexture(
//     data,
//     DEFLECTION_TABLE_SIZE,
//     DEFLECTION_TABLE_SIZE,
//     THREE.RGFormat,
//     THREE.FloatType,
//   );
//   texture.needsUpdate = true;
//   return texture;
// }

// // ******************************************
// // Ray Inverse Radius Table Texture U(e, phi)
// // ******************************************

const RAY_INVERSE_RADIUS_TABLE_SIZE = 64;

// // I think this needs to be implemented in the shader, not here.
// function getUephiTexelCoordinates(e: number, phi: number): [number, number] {
//   const eSq = e * e;
//   const eCu = eSq * e;
//   const texelU = 1 / (1 + 6 * eSq);
//   const texelV = ((phi / 3) * (1 + 6 * eCu)) / (1 + eSq);
//   return [texelU, texelV];
// }

// function getEForRayInverseRadiusTexelU(texelU: number): number {
//   return Math.sqrt((1 / texelU - 1) / 6);
// }

// function getPhiUpperBoundForE(e: number): number {
//   return (3 * (Math.pow(e, 2) + 1)) / (6 * Math.pow(Math.abs(e), 3) + 1);
// }

// function getRayInverseRadiusTableTextureUephi() {
//   const eps = 1e-5;
//   const data = new Float32Array(
//     RAY_INVERSE_RADIUS_TABLE_SIZE * RAY_INVERSE_RADIUS_TABLE_SIZE * 2,
//   );

//   for (let i = 0; i < RAY_INVERSE_RADIUS_TABLE_SIZE; i++) {
//     // TODO: Why are we clamping?
//     const clampedTexelU = Math.min(
//       Math.max(i / (RAY_INVERSE_RADIUS_TABLE_SIZE - 1), 0.001),
//       0.999,
//     );
//     const e = getEForRayInverseRadiusTexelU(clampedTexelU);
//     const eSq = e * e;
//     const phiUpperBound = getPhiUpperBoundForE(e);

//     let t = 0;
//     let u = 0;
//     let uDot = e;
//     let phi = 0;
//     let dPhi = eps;

//     let j = 0;

//     let prevU = 0;
//     let prevT = 0;
//     let prevJ = 0;

//     data[i * RAY_INVERSE_RADIUS_TABLE_SIZE * 2 + 0] = 0;
//     data[i * RAY_INVERSE_RADIUS_TABLE_SIZE * 2 + 1] = 0;

//     while (true) {
//       const j = (phi / phiUpperBound) * (RAY_INVERSE_RADIUS_TABLE_SIZE - 1);

//       const k0 = Math.ceil(prevJ);
//       const k1 = Math.min(Math.ceil(j), RAY_INVERSE_RADIUS_TABLE_SIZE);

//       for (let k = k0; k <= k1; ++k) {
//         const lerp = (k - prevJ) / (j - prevJ);
//         const lerpU = prevU * (1.0 - lerp) + u * lerp;
//         const lerpT = prevT * (1.0 - lerp) + t * lerp;

//         const index = i * RAY_INVERSE_RADIUS_TABLE_SIZE + k;
//         data[index * 2 + 0] = lerpU;
//         data[index * 2 + 1] = lerpT;
//       }

//       if (k1 === RAY_INVERSE_RADIUS_TABLE_SIZE) {
//         break;
//       }

//       prevU = u;
//       prevT = t;
//       prevJ = j;

//       // Again, why?
//       if (u > 1e-2) {
//         t = t + (e / (Math.pow(u, 2) * (1.0 - u))) * dPhi;
//       }

//       uDot = uDot + (1.5 * Math.pow(u, 2) - u) * dPhi;
//       u = u + uDot * dPhi;
//       phi = phi + dPhi;
//     }
//   }

//   const texture = new THREE.DataTexture(
//     data,
//     RAY_INVERSE_RADIUS_TABLE_SIZE,
//     RAY_INVERSE_RADIUS_TABLE_SIZE,
//     THREE.RGFormat,
//     THREE.FloatType,
//   );
//   texture.needsUpdate = true;
//   return texture;
// }

export default function BlackHoleComponent({
  uniforms,
}: {
  uniforms: BlackHoleUniforms;
}) {
  // const [deflectionTableTexture, rayInverseRadiusTableTexture] = useMemo(() => {
  //   const deflectionTableTexture = getDeflectionTableTextureDeu();
  //   const rayInverseRadiusTableTexture = getRayInverseRadiusTableTextureUephi();
  //   console.log("deflectionTableTexture", deflectionTableTexture);
  //   console.log("rayInverseRadiusTableTexture", rayInverseRadiusTableTexture);
  //   return [deflectionTableTexture, rayInverseRadiusTableTexture];
  // }, []);

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
        setDeflectionTableTexture(
          new THREE.DataTexture(
            deflectionTableTextureData,
            DEFLECTION_TABLE_SIZE,
            DEFLECTION_TABLE_SIZE,
            THREE.RGFormat,
            THREE.FloatType,
          ),
        );
        setRayInverseRadiusTableTexture(
          new THREE.DataTexture(
            rayInverseRadiusTableTextureData,
            RAY_INVERSE_RADIUS_TABLE_SIZE,
            RAY_INVERSE_RADIUS_TABLE_SIZE,
            THREE.RGFormat,
            THREE.FloatType,
          ),
        );
        setCalculating(false);
      }
    };
    return () => {
      worker.terminate();
    };
  }, []);

  return (
    <>
      <Plane ref={agentDataDisplayPlaneRef} visible={showGpuTextures}>
        <meshBasicMaterial
          attach="material"
          map={agentDataRenderTargetA.texture}
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
      <Plane ref={agentPositionsDisplayPlaneRef} visible={showGpuTextures}>
        <meshBasicMaterial
          attach="material"
          map={agentPositionsRenderTarget.texture}
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
    // <mesh>
    //   <shaderMaterial
    //     uniforms={uniforms}
    //     vertexShader={blackHoleVertexShader}
    //     fragmentShader={blackHoleFragmentShader}
    //   />
    //   <bufferGeometry>
    //     <bufferAttribute
    //       args={[renderPlanePositions, 3]}
    //       attach="attributes-position"
    //       array={renderPlanePositions}
    //       count={renderPlanePositions.length / 3}
    //       itemSize={3}
    //     />
    //     <bufferAttribute
    //       args={[renderPlaneUvs, 2]}
    //       attach="attributes-uv"
    //       array={renderPlaneUvs}
    //       count={renderPlaneUvs.length / 2}
    //       itemSize={2}
    //     />
    //   </bufferGeometry>
    // </mesh>
  );
}
