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
  c: THREE.Vector3,
  voxelSize: number,
): {
  returnValue: number;
  rawDistance: number;
} {
  const p = c
    .clone()
    .add(new THREE.Vector3(0.5 * voxelSize, 0.5 * voxelSize, 0.5 * voxelSize));
  const sphereCenter = new THREE.Vector3(0, 0, 0);
  const sphereRadius = 1.5;
  const d = p.distanceTo(sphereCenter) - sphereRadius;
  return {
    returnValue: 0.5 * voxelSize < d ? 0 : 1,
    rawDistance: d,
  };
}

function RayArrow({
  origin,
  direction,
  length,
  color,
}: {
  origin: THREE.Vector3;
  direction: THREE.Vector3;
  length: number;
  color: string;
}) {
  return (
    <Line
      points={[
        origin,
        origin.clone().addScaledVector(direction.clone().normalize(), length),
      ]}
      color={color}
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
  const [, setUpdatedAt] = useState(Date.now());
  const currentIncrementRef = useRef(incrementRef.current);
  const meshRef = useRef<THREE.Mesh>(null!);
  const htmlRef = useRef(null!);
  const vals = useMemo(() => {
    const rayOrigin = new THREE.Vector3(
      -5,
      yBounds[0] + (rayIndex / 4) * (yBounds[1] - yBounds[0]),
      0,
    );
    const newRayOrigin = rayOrigin.clone();
    const rayDirection = new THREE.Vector3(
      1,
      Math.random() * 0.2 - 0.1,
      0,
    ).normalize();
    const pos = new THREE.Vector3(
      Math.floor(rayOrigin.x / voxelSize) * voxelSize,
      Math.floor(rayOrigin.y / voxelSize) * voxelSize,
      Math.floor(rayOrigin.z / voxelSize) * voxelSize,
    );
    const rayInverse = new THREE.Vector3(
      rayDirection.x !== 0 ? 1.0 / rayDirection.x : 9999999.0,
      rayDirection.y !== 0 ? 1.0 / rayDirection.y : 9999999.0,
      rayDirection.z !== 0 ? 1.0 / rayDirection.z : 9999999.0,
    );
    const raySign = new THREE.Vector3(
      Math.sign(rayDirection.x),
      Math.sign(rayDirection.y),
      Math.sign(rayDirection.z),
    );
    const distanceVector = new THREE.Vector3(
      (pos.x - newRayOrigin.x + 0.5 * voxelSize + raySign.x * 0.5 * voxelSize) *
        rayInverse.x,
      (pos.y - newRayOrigin.y + 0.5 * voxelSize + raySign.y * 0.5 * voxelSize) *
        rayInverse.y,
      (pos.z - newRayOrigin.z + 0.5 * voxelSize + raySign.z * 0.5 * voxelSize) *
        rayInverse.z,
    );
    const values = {
      increment: incrementRef.current,
      rayOrigin: rayOrigin.clone(),
      newRayOrigin: newRayOrigin.clone(),
      rayDirection: rayDirection.clone(),
      pos: pos.clone(),
      rayInverse: rayInverse.clone(),
      raySign: raySign.clone(),
      distanceVector: distanceVector.clone(),
      result: -1,
      mask: new THREE.Vector3(0, 0, 0),
      rawDistance: 0,
      totalDistance: 0,
      minDistance: Infinity,
      break: false,
      tooFar: false,
    };
    return values;
  }, []);

  useFrame(() => {
    if (currentIncrementRef.current === incrementRef.current) return;
    currentIncrementRef.current = incrementRef.current;

    const incMod = currentIncrementRef.current % 10000;

    if (incMod <= 20 && !vals.break) {
      const { returnValue, rawDistance } = getMapAndDistance(
        vals.pos,
        voxelSize,
      );
      const minDistance = Math.min(vals.minDistance, rawDistance);

      vals.result = returnValue;
      vals.rawDistance = rawDistance;
      vals.break = returnValue > 0.5;
      vals.minDistance = minDistance;

      const tooFar = vals.minDistance > voxelSize;
      vals.tooFar = tooFar;
      if (tooFar && !vals.break) {
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
        vals.newRayOrigin.copy(newRayOrigin);
        vals.pos.copy(pos);
        vals.distanceVector.copy(distanceVector);
        vals.totalDistance = totalDistance;
      } else if (!vals.break) {
        const dv = vals.distanceVector;
        vals.mask.set(
          (dv.y < dv.x ? 0 : 1) * (dv.z < dv.x ? 0 : 1),
          (dv.z < dv.y ? 0 : 1) * (dv.x < dv.y ? 0 : 1),
          (dv.x < dv.z ? 0 : 1) * (dv.y < dv.z ? 0 : 1),
        );
        console.log(vals.mask);
        vals.distanceVector.add(
          new THREE.Vector3(
            vals.mask.x * voxelSize * vals.raySign.x * vals.rayInverse.x,
            vals.mask.y * voxelSize * vals.raySign.y * vals.rayInverse.y,
            vals.mask.z * voxelSize * vals.raySign.z * vals.rayInverse.z,
          ),
        );
        console.log(vals.mask.x, vals.raySign.x, vals.rayInverse.x);
        vals.pos.add(
          new THREE.Vector3(
            vals.mask.x * voxelSize * vals.raySign.x,
            vals.mask.y * voxelSize * vals.raySign.y,
            vals.mask.z * voxelSize * vals.raySign.z,
          ),
        );
      }
      meshRef.current!.position.copy(vals.pos);
      setUpdatedAt(Date.now());
    }
  });

  return (
    <>
      <mesh ref={meshRef} position={vals.pos} onClick={() => console.log(vals)}>
        <circleGeometry args={[0.05]} />
        <meshBasicMaterial color="red" />
      </mesh>
      <RayArrow
        origin={vals.pos}
        direction={vals.rayDirection}
        length={5}
        color="blue"
      />
      <RayArrow
        origin={vals.pos}
        direction={vals.distanceVector}
        length={1}
        color="orange"
      />
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
        <meshBasicMaterial color="green" wireframe />
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
