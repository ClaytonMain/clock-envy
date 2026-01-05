import { useMemo } from "react";
import mncaFragmentShader from "./shaders/mnca/mnca.frag";
import mncaVertexShader from "./shaders/mnca/mnca.vert";
import type { MncaUniforms } from "./types/types";

export default function MncaComponent({
  uniforms,
}: {
  uniforms: MncaUniforms;
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
        vertexShader={mncaVertexShader}
        fragmentShader={mncaFragmentShader}
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
