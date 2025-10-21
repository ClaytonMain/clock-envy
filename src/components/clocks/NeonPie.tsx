import { Stage, Torus } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";

export default function NeonPie() {
  return (
    <Canvas shadows className="h-full w-full">
      <Stage
        shadows="accumulative"
        environment="city"
        intensity={0.6}
        adjustCamera
      >
        <Torus args={[1, 0.3, 16, 100]} rotation={[Math.PI / 2, 0, 0]}>
          <meshPhysicalMaterial color={"#39ff14"} />
        </Torus>
      </Stage>
    </Canvas>
  );
}
