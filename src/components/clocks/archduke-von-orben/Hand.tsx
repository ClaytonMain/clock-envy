import { Sphere, Torus } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { springValue } from "motion/react";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import useAppStore from "../../../stores/useAppStore";
import useArchdukeVonOrbenStore from "../../../stores/useArchdukeVonOrbenStore";

const springConfigs = {
  shared: {
    damping: 5.0,
    stiffness: 100.0,
  },
  h: {
    mass: 4.0,
  },
  m: {
    mass: 2.0,
  },
  s: {
    mass: 1.0,
  },
};

function getTimeLengthPercent(hms: "h" | "m" | "s", formatHours24: boolean) {
  const now = useAppStore.getState().currentTimeValue.toJSDate();
  if (hms === "h") {
    let hours = now.getHours();
    if (!formatHours24) {
      hours = hours % 12;
    }
    return hours / (formatHours24 ? 24 : 12);
  } else if (hms === "m") {
    return now.getMinutes() / 60;
  } else if (hms === "s") {
    return now.getSeconds() / 60;
  }
  return 0;
}

export default function Hand({
  hms,
  radius = 1,
  tube = 0.1,
  radialSegments = 8,
  tubularSegments = 50,
  arc = Math.PI * 2 - (Math.PI * 2) / 3,
  position = [0, 0, 0],
  rotation = [0, 0, -Math.PI / 6],
  formatHours24 = true,
  color = "#2cff05",
  materialProps = {
    roughness: 0.1,
    metalness: 0.0,
    clearcoat: 0.9,
  },
  layers,
}: {
  hms: "h" | "m" | "s";
  radius?: number;
  tube?: number;
  radialSegments?: number;
  tubularSegments?: number;
  arc?: number;
  position?: [number, number, number];
  rotation?: [number, number, number];
  color?: string;
  formatHours24?: boolean;
  materialProps?: THREE.MeshPhysicalMaterialParameters;
  layers?: THREE.Layers;
}) {
  const innerGroupRef = useRef<THREE.Group>(null!);
  const movingOrbRef = useRef<THREE.Mesh>(null!);
  const lastFrameTimeLengthPercentRef = useRef(
    getTimeLengthPercent(hms, formatHours24),
  );
  const timeLengthPercent = springValue<number>(
    getTimeLengthPercent(hms, formatHours24),
    {
      restDelta: 0.0001,
      ...springConfigs.shared,
      ...springConfigs[hms],
    },
  );
  const uArcLengthPercentRef = useRef<THREE.Uniform>(
    new THREE.Uniform(getTimeLengthPercent(hms, formatHours24)),
  );

  const handLayers = useMemo(() => {
    if (layers) {
      return layers;
    }
    const newLayers = new THREE.Layers();
    newLayers.enable(1);
    return newLayers;
  }, [layers]);

  const deltaRef = useRef(0);
  const prevVelocityRef = useRef(0);

  useFrame((_, delta) => {
    deltaRef.current = Math.max(delta, 0.016);

    const currentTimeLengthPercent = getTimeLengthPercent(hms, formatHours24);
    if (currentTimeLengthPercent !== lastFrameTimeLengthPercentRef.current) {
      lastFrameTimeLengthPercentRef.current = currentTimeLengthPercent;
      timeLengthPercent.set(currentTimeLengthPercent);
    }

    const currentSpring = timeLengthPercent.get();

    uArcLengthPercentRef.current.value = Math.max(0, currentSpring);
    movingOrbRef.current.position.set(
      Math.cos(Math.max(0, currentSpring) * arc) * radius,
      Math.sin(Math.max(0, currentSpring) * arc) * radius,
      0,
    );
    movingOrbRef.current.rotation.set(0, 0, Math.max(0, currentSpring) * arc);
    innerGroupRef.current.rotation.set(0, 0, Math.min(0, currentSpring) * arc);

    const currentVelocity = timeLengthPercent.getVelocity();

    if (hms === "h") {
      useArchdukeVonOrbenStore.setState({
        uHSpringVelocity: currentVelocity,
      });
    } else if (hms === "m") {
      useArchdukeVonOrbenStore.setState({
        uMSpringVelocity: currentVelocity,
      });
    } else if (hms === "s") {
      useArchdukeVonOrbenStore.setState({
        uSSpringVelocity: currentVelocity,
      });
    }

    prevVelocityRef.current = currentVelocity;
  });

  return (
    <group position={position} rotation={rotation}>
      <group ref={innerGroupRef}>
        <Torus
          args={[radius, tube, radialSegments, tubularSegments, arc]}
          castShadow
          receiveShadow
          layers={handLayers}
        >
          <meshPhysicalMaterial
            attach="material"
            color={color}
            {...materialProps}
            onBeforeCompile={(shader) => {
              shader.uniforms.uArcLengthPercent = uArcLengthPercentRef.current;
              shader.vertexShader = shader.vertexShader.replace(
                "#include <common>",
                /* glsl */ `
                #include <common>
                uniform float uArcLengthPercent;

                mat3 rotZ(float angle) {
                  float s = sin(angle);
                  float c = cos(angle);
                  return mat3(
                    c, -s, 0.0,
                    s,  c, 0.0,
                    0.0, 0.0, 1.0
                  );
                }
                `,
              );
              shader.vertexShader = shader.vertexShader.replace(
                "#include <beginnormal_vertex>",
                /* glsl */ `
                float baseAngle = atan(-position.y - 0.0001, -position.x - 0.0001) + PI;
                float angle = baseAngle * (1.0 - uArcLengthPercent);
                mat3 rotationMatrix = rotZ(angle);

                vec3 objectNormal = vec3(rotationMatrix * normal);
                #ifdef USE_TANGENT
                  vec3 objectTangent = vec3(rotationMatrix * tangent.xyz);
                #endif
              `,
              );
              shader.vertexShader = shader.vertexShader.replace(
                "#include <begin_vertex>",
                /* glsl */ `
                vec3 transformed = vec3(rotationMatrix * position);
                #ifdef USE_ALPHAHASH
                  vPosition = vec3(rotationMatrix * position);
                #endif
              `,
              );
            }}
          />
          <meshDepthMaterial
            attach="customDepthMaterial"
            depthPacking={THREE.RGBADepthPacking}
            onBeforeCompile={(shader) => {
              shader.uniforms.uArcLengthPercent = uArcLengthPercentRef.current;
              shader.vertexShader = shader.vertexShader.replace(
                "#include <common>",
                /* glsl */ `
                #include <common>
                uniform float uArcLengthPercent;

                mat3 rotZ(float angle) {
                  float s = sin(angle);
                  float c = cos(angle);
                  return mat3(
                    c, -s, 0.0,
                    s,  c, 0.0,
                    0.0, 0.0, 1.0
                  );
                }
                `,
              );
              shader.vertexShader = shader.vertexShader.replace(
                "#include <begin_vertex>",
                /* glsl */ `
                float baseAngle = atan(-position.y - 0.0001, -position.x - 0.0001) + PI;
                float angle = baseAngle * (1.0 - uArcLengthPercent);
                mat3 rotationMatrix = rotZ(angle);

                vec3 transformed = vec3(rotationMatrix * position);
                #ifdef USE_ALPHAHASH
                  vPosition = vec3(rotationMatrix * position);
                #endif
              `,
              );
            }}
          />
        </Torus>
        <Sphere
          args={[tube, radialSegments, 8, 0, Math.PI * 2, 0, Math.PI / 2 + 0.1]}
          position={[radius, 0, 0]}
          rotation={[0, 0, Math.PI]}
          castShadow
          receiveShadow
          layers={handLayers}
        >
          <meshPhysicalMaterial color={color} {...materialProps} />
        </Sphere>
        <Sphere
          ref={movingOrbRef}
          args={[tube, radialSegments, 8, 0, Math.PI * 2, 0, Math.PI / 2 + 0.1]}
          position={[
            Math.cos(timeLengthPercent.get() * arc) * radius,
            Math.sin(timeLengthPercent.get() * arc) * radius,
            0,
          ]}
          castShadow
          receiveShadow
          layers={handLayers}
        >
          <meshPhysicalMaterial color={color} {...materialProps} />
        </Sphere>
      </group>
    </group>
  );
}
