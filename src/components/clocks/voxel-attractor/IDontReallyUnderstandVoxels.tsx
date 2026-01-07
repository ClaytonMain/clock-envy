import { Grid, Html, Line, Sphere } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type JSX,
  type RefObject,
} from "react";
import * as THREE from "three";

function getMapAndDistance(
  p: THREE.Vector3,
  voxelSize: number,
): {
  returnValue: number;
  rawDistance: number;
} {
  // Sphere sdf
  const d =
    p
      .clone()
      .add(new THREE.Vector3(0.5 * voxelSize, 0.5 * voxelSize, 0.5 * voxelSize))
      .length() - 1.5;
  return {
    returnValue: d < 0.5 * voxelSize ? 1 : 0,
    rawDistance: d,
  };
}

function RayArrow({
  origin,
  direction,
  length,
}: {
  origin: THREE.Vector3;
  direction: THREE.Vector3;
  length: number;
}) {
  return (
    <Line
      points={[origin, origin.clone().addScaledVector(direction, length)]}
      color="blue"
      lineWidth={2}
    />
  );
}

function RayDot({
  rayIndex,
  yBounds,
  voxelSize,
  incrementRef,
}: {
  rayIndex: number;
  yBounds: [number, number];
  voxelSize: number;
  incrementRef: RefObject<number>;
}) {
  const currentIncrementRef = useRef(incrementRef.current);
  const meshRef = useRef<THREE.Mesh>(null!);
  const htmlRef = useRef(null!);
  const rayOrigin = useMemo(() => {
    return new THREE.Vector3(
      -5,
      yBounds[0] + (rayIndex / 4) * (yBounds[1] - yBounds[0]),
      0,
    );
  }, [rayIndex, yBounds]);
  const rayDirection = useMemo(() => {
    const dir = new THREE.Vector3(1, Math.random() * 0.2 - 0.1, 0);
    dir.normalize();
    return dir;
  }, []);

  const [htmlContent, setHtmlContent] = useState<JSX.Element>(
    <div>Ray {rayIndex}</div>,
  );

  const [vals, setVals] = useState(() => {
    return {
      rayOrigin: rayOrigin.clone(),
      increment: incrementRef.current,
      newRayOrigin: rayOrigin.clone(),
      rayDirection: rayDirection.clone(),
      pos: new THREE.Vector3(
        Math.floor(rayOrigin.x / voxelSize) * voxelSize,
        Math.floor(rayOrigin.y / voxelSize) * voxelSize,
        Math.floor(rayOrigin.z / voxelSize) * voxelSize,
      ),
      rayInverse: new THREE.Vector3(
        1.0 / rayDirection.x,
        1.0 / rayDirection.y,
        1.0 / rayDirection.z,
      ),
      raySign: new THREE.Vector3(
        Math.sign(rayDirection.x),
        Math.sign(rayDirection.y),
        Math.sign(rayDirection.z),
      ),
      distanceVector: new THREE.Vector3(
        (Math.floor(rayOrigin.x / voxelSize) * voxelSize -
          rayOrigin.x +
          0.5 * voxelSize +
          Math.sign(rayDirection.x) * 0.5 * voxelSize) *
          (1.0 / rayDirection.x),
        (Math.floor(rayOrigin.y / voxelSize) * voxelSize -
          rayOrigin.y +
          0.5 * voxelSize +
          Math.sign(rayDirection.y) * 0.5 * voxelSize) *
          (1.0 / rayDirection.y),
        (Math.floor(rayOrigin.z / voxelSize) * voxelSize -
          rayOrigin.z +
          0.5 * voxelSize +
          Math.sign(rayDirection.z) * 0.5 * voxelSize) *
          (1.0 / rayDirection.z),
      ),
      result: -1,
      mask: new THREE.Vector3(0, 0, 0),
      rawDistance: 0,
      totalDistance: 0,
      minDistance: Infinity,
      break: false,
    };
  });

  useFrame(() => {
    if (vals.break) return;
    if (currentIncrementRef.current === incrementRef.current) return;
    currentIncrementRef.current = incrementRef.current;

    const incMod = currentIncrementRef.current % 10000;

    if (incMod === 1) {
      const { returnValue, rawDistance } = getMapAndDistance(
        vals.pos,
        voxelSize,
      );
      setVals((vals) => {
        return {
          ...vals,
          result: returnValue,
          rawDistance: rawDistance,
          break: returnValue > 0.5,
          minDistance: Math.min(vals.minDistance, rawDistance),
        };
      });
      setHtmlContent(
        <div>
          Result: {returnValue}
          <br />
          Raw Distance: {rawDistance.toFixed(2)}
          <br />
          Break: {returnValue > 0.5}
          <br />
          Min distance: {Math.min(vals.minDistance, rawDistance).toFixed(2)}
        </div>,
      );
    } else {
      const tooFar = vals.minDistance > Math.ceil(3.0 * voxelSize);
      if (tooFar) {
        const totalDistance = vals.totalDistance + vals.rawDistance;
        const newRayOrigin = vals.rayOrigin
          .clone()
          .addScaledVector(vals.rayDirection, totalDistance);
        const pos = new THREE.Vector3(
          Math.floor(newRayOrigin.x / voxelSize) * voxelSize,
          Math.floor(newRayOrigin.y / voxelSize) * voxelSize,
          Math.floor(newRayOrigin.z / voxelSize) * voxelSize,
        );
        const distanceVector = new THREE.Vector3(
          (pos.x -
            newRayOrigin.x +
            0.5 * voxelSize +
            vals.raySign.x * 0.5 * voxelSize) *
            vals.rayInverse.x,
          (pos.y -
            newRayOrigin.y +
            0.5 * voxelSize +
            vals.raySign.y * 0.5 * voxelSize) *
            vals.rayInverse.y,
          (pos.z -
            newRayOrigin.z +
            0.5 * voxelSize +
            vals.raySign.z * 0.5 * voxelSize) *
            vals.rayInverse.z,
        );
        meshRef.current!.position.copy(newRayOrigin);
        setVals((vals) => ({
          ...vals,
          totalDistance: totalDistance,
          newRayOrigin: newRayOrigin,
          pos: pos,
          distanceVector: distanceVector,
        }));
      }
    }
  });

  return (
    <>
      <mesh ref={meshRef} position={vals.pos}>
        <circleGeometry args={[0.05]} />
        <meshBasicMaterial color="red" />
      </mesh>
      <RayArrow origin={vals.pos} direction={vals.rayDirection} length={5} />
      <Html ref={htmlRef} position={vals.pos}>
        <div style={{ color: "white", fontSize: "0.6rem", width: "10rem" }}>
          {htmlContent}
        </div>
      </Html>
    </>
  );
}

export default function IDontReallyUnderstandVoxels() {
  const VOXEL_SIZE = 0.2;
  const NUM_RAYS = 5;
  const RAY_Y_BOUNDS: [number, number] = [-2, 2];

  const incrementRef = useRef(0);
  const maxSteps = 100;

  function handleClick() {
    incrementRef.current = (incrementRef.current + 1) % maxSteps;
  }
  useEffect(() => {
    window.addEventListener("click", handleClick);
    return () => {
      window.removeEventListener("click", handleClick);
    };
  }, []);

  return (
    <>
      {Array.from({ length: NUM_RAYS }).map((_, i) => (
        <RayDot
          key={i}
          rayIndex={i}
          yBounds={RAY_Y_BOUNDS}
          voxelSize={VOXEL_SIZE}
          incrementRef={incrementRef}
        />
      ))}
      <Sphere args={[1.5, 16, 16]} position={[0, 0, 0]}>
        <meshBasicMaterial color="green" />
      </Sphere>
      <Grid
        args={[10, 10]}
        rotation={[Math.PI / 2, 0, 0]}
        position={[0, 0, -0.01]}
        cellColor="orange"
        cellSize={VOXEL_SIZE}
        cellThickness={0.75}
        sectionColor="lightgray"
      />
    </>
  );
}
