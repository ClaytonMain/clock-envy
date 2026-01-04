import { Bvh, Loader, Plane, useFBO } from "@react-three/drei";
import { Canvas, createPortal, useFrame } from "@react-three/fiber";
import { Suspense, useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import useMncaStore from "../../../stores/useMncaStore";
import { getDisplayScale } from "../../../utils/utils";
import CustomStatsComponent from "../../misc/CustomStatsComponent";
import ClockDisplay from "./ClockDisplay";
import { GAME_SPEED, GAME_TEXTURE_SIZE } from "./constants/constants";
import MncaComponent from "./MncaComponent";
import { NeighborhoodCanvas } from "./NeighborhoodCanvas";
import displayPlaneFragmentShader from "./shaders/display/display.frag";
import displayPlaneVertexShader from "./shaders/display/display.vert";
import { type MncaUniforms } from "./types/types";
import { getRuleUniforms } from "./utils/utils";

// Thanks to Acerola for the inspiration (and for introducing me to MNCA):
// https://www.youtube.com/watch?v=I1JBiZrZ_XM

function getInitialPreviousTexture() {
  const size = GAME_TEXTURE_SIZE;
  const data = new Float32Array(4 * size * size);
  for (let i = 0; i < size * size; i++) {
    const i4 = i * 4;
    // data[i4 + 0] = Math.random() > 0.75 ? 1 : 0; // cell state
    data[i4 + 0] = Math.random() > 0.65 ? 1 : 0; // cell state
    data[i4 + 1] = 0;
    data[i4 + 2] = 0;
    data[i4 + 3] = 0;
  }
  const texture = new THREE.DataTexture(
    data,
    size,
    size,
    THREE.RGBAFormat,
    THREE.FloatType,
  );
  texture.needsUpdate = true;
  return texture;
}

function MNCA() {
  const sharedCamera = useMemo(
    () => new THREE.OrthographicCamera(-1, 1, 1, -1, 1 / Math.pow(2, 53), 1),
    [],
  );

  // Display plane setup.
  const displayPlaneUniforms = useMemo(() => {
    return {
      uDisplayScale: { value: getDisplayScale({ targetAspect: 1 }) },
      uGameTexture: { value: new THREE.Texture() },
    };
  }, []);

  // MNCA setup.
  const mncaUniforms: MncaUniforms = useMemo(() => {
    const ruleUniforms = getRuleUniforms();
    const uniforms = {
      uDelta: { value: 0 },
      uIntensityLambda: { value: 0.05 },
      uColorTimeLambda: { value: 0.5 },
      uResolution: {
        value: new THREE.Vector2(GAME_TEXTURE_SIZE, GAME_TEXTURE_SIZE),
      },
      uPreviousTexture: { value: getInitialPreviousTexture() },
      uClockTexture: { value: new THREE.Texture() },
      uNbhood01: ruleUniforms.uNbhood01,
      uNbhood02: ruleUniforms.uNbhood02,
      uNbhoodBornRange01: ruleUniforms.uNbhoodBornRange01,
      uNbhoodBornRange02: ruleUniforms.uNbhoodBornRange02,
      uNbhoodStableRange01: ruleUniforms.uNbhoodStableRange01,
      uNbhoodStableRange02: ruleUniforms.uNbhoodStableRange02,
    };
    return uniforms;
  }, []);
  const mncaSceneA = useMemo(() => new THREE.Scene(), []);
  const mncaSceneB = useMemo(() => new THREE.Scene(), []);
  const mncaRenderTargetA = useFBO(GAME_TEXTURE_SIZE, GAME_TEXTURE_SIZE, {
    minFilter: THREE.NearestFilter,
    magFilter: THREE.NearestFilter,
    format: THREE.RGBAFormat,
    stencilBuffer: false,
    depthBuffer: false,
    type: THREE.UnsignedByteType,
  });
  const mncaRenderTargetB = useFBO(GAME_TEXTURE_SIZE, GAME_TEXTURE_SIZE, {
    minFilter: THREE.NearestFilter,
    magFilter: THREE.NearestFilter,
    format: THREE.RGBAFormat,
    stencilBuffer: false,
    depthBuffer: false,
    type: THREE.UnsignedByteType,
  });
  useLayoutEffect(() => {
    const unsubRulesUpdatedAt = useMncaStore.subscribe(
      (state) => state.rulesUpdatedAt,
      () => {
        const ruleUniforms = getRuleUniforms();
        mncaUniforms.uNbhood01.value = ruleUniforms.uNbhood01.value;
        mncaUniforms.uNbhood02.value = ruleUniforms.uNbhood02.value;
        mncaUniforms.uNbhoodBornRange01.value =
          ruleUniforms.uNbhoodBornRange01.value;
        mncaUniforms.uNbhoodBornRange02.value =
          ruleUniforms.uNbhoodBornRange02.value;
        mncaUniforms.uNbhoodStableRange01.value =
          ruleUniforms.uNbhoodStableRange01.value;
        mncaUniforms.uNbhoodStableRange02.value =
          ruleUniforms.uNbhoodStableRange02.value;
      },
    );
    return () => {
      unsubRulesUpdatedAt();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Clock setup.
  const clockScene = useMemo(() => new THREE.Scene(), []);
  const clockRenderTarget = useFBO(512, 512, {
    minFilter: THREE.NearestFilter,
    magFilter: THREE.NearestFilter,
    format: THREE.RGBAFormat,
    stencilBuffer: false,
    depthBuffer: false,
    type: THREE.UnsignedByteType,
  });

  const pingPongRef = useRef(true);
  const frameDurationRef = useRef(1);
  const actualDeltaRef = useRef(0);
  const uDeltaRef = useRef(0);
  useFrame(({ gl }, delta) => {
    actualDeltaRef.current = Math.min(delta, 0.1);
    frameDurationRef.current += actualDeltaRef.current * GAME_SPEED;
    uDeltaRef.current += actualDeltaRef.current;
    if (frameDurationRef.current < 1) return;
    frameDurationRef.current = 0;

    // Render clock.
    gl.setRenderTarget(clockRenderTarget);
    gl.clear();
    gl.render(clockScene, sharedCamera);

    mncaUniforms.uClockTexture.value = clockRenderTarget.texture;

    // Render MNCA.
    mncaUniforms.uDelta.value = uDeltaRef.current;
    uDeltaRef.current = 0;
    if (pingPongRef.current) {
      gl.setRenderTarget(mncaRenderTargetA);
      gl.clear();
      gl.render(mncaSceneA, sharedCamera);

      mncaUniforms.uPreviousTexture.value = mncaRenderTargetA.texture;
      displayPlaneUniforms.uGameTexture.value = mncaRenderTargetA.texture;
    } else {
      gl.setRenderTarget(mncaRenderTargetB);
      gl.clear();
      gl.render(mncaSceneB, sharedCamera);

      mncaUniforms.uPreviousTexture.value = mncaRenderTargetB.texture;
      displayPlaneUniforms.uGameTexture.value = mncaRenderTargetB.texture;
    }

    pingPongRef.current = !pingPongRef.current;

    displayPlaneUniforms.uDisplayScale.value = getDisplayScale({
      targetAspect: 1,
    });

    gl.setRenderTarget(null);
  });

  return (
    <>
      {createPortal(<ClockDisplay />, clockScene)}
      {createPortal(<MncaComponent uniforms={mncaUniforms} />, mncaSceneA)}
      {createPortal(<MncaComponent uniforms={mncaUniforms} />, mncaSceneB)}
      <Plane>
        <shaderMaterial
          uniforms={displayPlaneUniforms}
          vertexShader={displayPlaneVertexShader}
          fragmentShader={displayPlaneFragmentShader}
          transparent
          depthTest={false}
          depthWrite={false}
        />
      </Plane>
      <Bvh firstHitOnly>
        <NeighborhoodCanvas ruleIndex={0} />
        <NeighborhoodCanvas ruleIndex={1} />
      </Bvh>
    </>
  );
}

export default function MNCAScene() {
  return (
    <>
      <Canvas
        shadows
        dpr={Math.min(window.devicePixelRatio, 1)}
        orthographic
        camera={{
          position: [0, 0, 10],
          zoom: 1,
          left: -window.innerWidth / window.innerHeight,
          right: window.innerWidth / window.innerHeight,
          top: 1,
          bottom: -1,
        }}
        style={{
          touchAction: "none",
        }}
      >
        <CustomStatsComponent />
        <Suspense fallback={null}>
          <ambientLight intensity={0.1} />
          <MNCA />
        </Suspense>
      </Canvas>
      <Loader />
    </>
  );
}
