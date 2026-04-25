import { OrbitControls } from "@react-three/drei";
import { useEffect, useState } from "react";
import useAppStore from "../../stores/useAppStore";

export default function DebugOrbitControls({
  makeDefault = true,

  enablePan = false,
  enableRotate = false,
  enableZoom = true,
  minDistance = 10,
  maxDistance = 50,
  minZoom = 0.5,
  maxZoom = 5,
  minPolarAngle = 0,
  maxPolarAngle = Math.PI,
  minAzimuthAngle = -Infinity,
  maxAzimuthAngle = Infinity,

  enablePanIfDebug = true,
  enableRotateIfDebug = true,
  enableZoomIfDebug = true,
  minDistanceIfDebug,
  maxDistanceIfDebug,
  minZoomIfDebug,
  maxZoomIfDebug,
  minPolarAngleIfDebug,
  maxPolarAngleIfDebug,
  minAzimuthAngleIfDebug,
  maxAzimuthAngleIfDebug,
}: {
  /** @default true */
  makeDefault?: boolean;

  /** @default false */
  enablePan?: boolean;
  /** @default false */
  enableRotate?: boolean;
  /** @default true */
  enableZoom?: boolean;
  /** @default 10 */
  minDistance?: number;
  /** @default 50 */
  maxDistance?: number;
  /** @default 0.5 */
  minZoom?: number;
  /** @default 5 */
  maxZoom?: number;
  /** @default 0 */
  minPolarAngle?: number;
  /** @default Math.PI */
  maxPolarAngle?: number;
  /** @default -Infinity */
  minAzimuthAngle?: number;
  /** @default Infinity */
  maxAzimuthAngle?: number;

  /**
   * If panning should be enabled when debug is `true`
   * @default true
   */
  enablePanIfDebug?: boolean;
  /**
   * If rotation should be enabled when debug is `true`
   * @default true
   */
  enableRotateIfDebug?: boolean;
  /**
   * If zoom should be enabled when debug is `true`
   * @default true
   */
  enableZoomIfDebug?: boolean;
  /**
   * The `minDistance` value when debug is `true`. Defaults to `minDistance` (which itself defaults to 10)
   * @default `minDistance` value
   */
  minDistanceIfDebug?: number;
  /**
   * The `maxDistance` value when debug is `true`. Defaults to `maxDistance` (which itself defaults to 50)
   * @default `maxDistance` value
   */
  maxDistanceIfDebug?: number;
  /**
   * The `minZoom` value when debug is `true`. Defaults to `minZoom` (which itself defaults to 0.5)
   * @default `minZoom` value
   */
  minZoomIfDebug?: number;
  /**
   * The `maxZoom` value when debug is `true`. Defaults to `maxZoom` (which itself defaults to 5)
   * @default `maxZoom` value
   */
  maxZoomIfDebug?: number;
  /**
   * The `minPolarAngle` value when debug is `true`. Defaults to `minPolarAngle` (which itself defaults to 0)
   * @default `minPolarAngle` value
   */
  minPolarAngleIfDebug?: number;
  /**
   * The `maxPolarAngle` value when debug is `true`. Defaults to `maxPolarAngle` (which itself defaults to Math.PI)
   * @default `maxPolarAngle` value
   */
  maxPolarAngleIfDebug?: number;
  /**
   * The `minAzimuthAngle` value when debug is `true`. Defaults to `minAzimuthAngle` (which itself defaults to -Infinity)
   * @default `minAzimuthAngle` value
   */
  minAzimuthAngleIfDebug?: number;
  /**
   * The `maxAzimuthAngle` value when debug is `true`. Defaults to `maxAzimuthAngle` (which itself defaults to Infinity)
   * @default `maxAzimuthAngle` value
   */
  maxAzimuthAngleIfDebug?: number;
}) {
  const debug = useAppStore((state) => state.debug);

  const getProps = () => {
    return {
      makeDefault,
      enablePan: debug ? enablePanIfDebug : enablePan,
      enableRotate: debug ? enableRotateIfDebug : enableRotate,
      enableZoom: debug ? enableZoomIfDebug : enableZoom,
      minDistance: debug ? (minDistanceIfDebug ?? minDistance) : minDistance,
      maxDistance: debug ? (maxDistanceIfDebug ?? maxDistance) : maxDistance,
      minZoom: debug ? (minZoomIfDebug ?? minZoom) : minZoom,
      maxZoom: debug ? (maxZoomIfDebug ?? maxZoom) : maxZoom,
      minPolarAngle: debug
        ? (minPolarAngleIfDebug ?? minPolarAngle)
        : minPolarAngle,
      maxPolarAngle: debug
        ? (maxPolarAngleIfDebug ?? maxPolarAngle)
        : maxPolarAngle,
      minAzimuthAngle: debug
        ? (minAzimuthAngleIfDebug ?? minAzimuthAngle)
        : minAzimuthAngle,
      maxAzimuthAngle: debug
        ? (maxAzimuthAngleIfDebug ?? maxAzimuthAngle)
        : maxAzimuthAngle,
    };
  };

  const [orbitControlsProps, setOrbitControlsProps] = useState(getProps());

  useEffect(() => {
    setOrbitControlsProps(getProps());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debug]);

  return <OrbitControls {...orbitControlsProps} />;
}
