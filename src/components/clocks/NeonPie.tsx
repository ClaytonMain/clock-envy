import { OrbitControls, Stage, Torus } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";

export default function NeonPie() {
  return (
    <Canvas shadows className="h-full w-full">
      <ambientLight intensity={0.5} />
      <OrbitControls makeDefault />
      <Stage
        shadows="accumulative"
        environment="city"
        intensity={0.6}
        adjustCamera
      >
        <Torus args={[1, 0.3, 16, 100]}>
          <meshPhysicalMaterial color={"#39ff14"} />
        </Torus>
      </Stage>
    </Canvas>
  );
}
