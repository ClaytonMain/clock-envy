import { useEffect, useMemo } from "react";
import useAppStore from "../../../stores/useAppStore";
import clockFragmentShader from "./shaders/clock/clock.frag";
import clockVertexShader from "./shaders/clock/clock.vert";

function getActiveSegments(): number[] {
  const timeValue = useAppStore.getState().currentTimeValue;
  const segments: number[] = [];
  for (let i = 0; i < 6; i++) {
    const char = timeValue.toFormat("HHmmss").charAt(i);
    const segmentMap: Record<string, number[]> = {
      "0": [1, 1, 1, 1, 1, 1, 0],
      "1": [0, 1, 1, 0, 0, 0, 0],
      "2": [1, 1, 0, 1, 1, 0, 1],
      "3": [1, 1, 1, 1, 0, 0, 1],
      "4": [0, 1, 1, 0, 0, 1, 1],
      "5": [1, 0, 1, 1, 0, 1, 1],
      "6": [1, 0, 1, 1, 1, 1, 1],
      "7": [1, 1, 1, 0, 0, 0, 0],
      "8": [1, 1, 1, 1, 1, 1, 1],
      "9": [1, 1, 1, 1, 0, 1, 1],
    };
    segments.push(...(segmentMap[char] || [0, 0, 0, 0, 0, 0, 0]));
  }
  return segments;
}

function getUniforms() {
  return {
    uActive: { value: getActiveSegments() },
  };
}

export default function ClockDisplay() {
  const uniforms = useMemo(() => {
    return getUniforms();
  }, []);

  useEffect(() => {
    const unsubCurrentTimeValue = useAppStore.subscribe(
      (state) => state.currentTimeValue,
      (value, previousValue) => {
        const timeString = value.toFormat("HHmmss");
        const prevTimeString = previousValue.toFormat("HHmmss");

        if (timeString === prevTimeString) return;

        const newUniforms = getUniforms();
        uniforms.uActive.value = newUniforms.uActive.value;
      },
    );
    return () => {
      unsubCurrentTimeValue();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <mesh>
      <planeGeometry args={[2, 2]} />
      <shaderMaterial
        uniforms={uniforms}
        vertexShader={clockVertexShader}
        fragmentShader={clockFragmentShader}
      />
    </mesh>
  );
}
