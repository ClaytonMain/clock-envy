import { useMemo } from "react";
import blackHoleFragmentShader from "./shaders/black-hole/blackHole.frag";
import blackHoleVertexShader from "./shaders/black-hole/blackHole.vert";
import type { BlackHoleUniforms } from "./types/types";
// import type { MncaUniforms } from "./types/types";

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
