import { useMemo } from "react";
import * as THREE from "three";
import blackHoleFragmentShader from "./shaders/black-hole/blackHole.frag";
import blackHoleVertexShader from "./shaders/black-hole/blackHole.vert";
import type { BlackHoleUniforms } from "./types/types";
// import type { MncaUniforms } from "./types/types";

const MU = 4 / 27;

function getUApsis(eSq: number) {
  return 1 / 3 + (2 / 3) * Math.sin((1 / 3) * Math.asin((2 * eSq) / MU - 1));
}

// I think this needs to be implemented in the shader, not here.
function getDeuTexelCoordinates(e: number, u: number): [number, number] {
  let texelU = 0;
  let texelV = 0;
  const eSq = e * e;
  if (eSq < MU) {
    texelU = 1 / 2 - Math.sqrt(-Math.log(1 - eSq / MU) / 50);
    texelV = 1 - Math.sqrt(1 - u / getUApsis(eSq));
  } else {
    texelU = 1 / 2 + Math.sqrt(-Math.log(1 - MU / eSq) / 50);
    texelV =
      (Math.sqrt(2 / 3) +
        Math.sign(u - 2 / 3) * Math.sqrt(Math.abs(u - 2 / 3))) /
      (Math.sqrt(2 / 3) + Math.sqrt(1 / 3));
  }
  return [texelU, texelV];
}

// I think this needs to be implemented in the shader, not here.
function getUephiTexelCoordinates(e: number, phi: number): [number, number] {
  const eSq = e * e;
  const eCu = eSq * e;
  const texelU = 1 / (1 + 6 * eSq);
  const texelV = ((phi / 3) * (1 + 6 * eCu)) / (1 + eSq);
  return [texelU, texelV];
}

function getEForTexelU(texelU: number): number {
  if (texelU <= 1 / 2) {
    return Math.sqrt(
      MU * (1 - Math.exp((-25 / 2) * Math.pow(1 - 2 * texelU, 2))),
    );
  }
  return Math.sqrt(
    -MU / (Math.exp((-25 / 2) * Math.pow(1 - 2 * texelU, 2)) - 1),
  );
}

function getDeflectionTableTextureDeu() {
  const data = new Float32Array(512 * 512 * 2);
  for (let i = 0; i < 512 * 512; i++) {
    const i2 = i * 2;
    const e = getEForTexelU((i % 512) / 511);
  }
  const texture = new THREE.DataTexture(
    data,
    512,
    512,
    THREE.RGFormat,
    THREE.FloatType,
  );
  texture.needsUpdate = true;
  return texture;
}

export default function BlackHoleComponent({
  uniforms,
}: {
  uniforms: BlackHoleUniforms;
}) {
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

  return (
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
  );
}
