import { Text } from "@react-three/drei";
import { useEffect, useMemo, useState } from "react";
import * as THREE from "three";
import useAppStore from "../../../stores/useAppStore";

export default function Digits({
  position,
}: {
  position: [number, number, number];
}) {
  const fontUrl = "./fonts/roboto_mono/static/RobotoMono-Regular.ttf";
  const [timeText, setTimeText] = useState("00:00:00");

  const textLayers = useMemo(() => {
    const layers = new THREE.Layers();
    return layers;
  }, []);

  useEffect(() => {
    const unsubCurrentTimeValue = useAppStore.subscribe(
      (state) => state.currentTimeValue,
      (value) => {
        const currentTimeString = value.toFormat("HH:mm:ss");
        if (timeText !== currentTimeString) {
          setTimeText(currentTimeString);
        }
      },
    );
    return () => {
      unsubCurrentTimeValue();
    };
  }, [timeText]);

  return (
    <Text
      position={position}
      scale={[0.2, 0.3, 1]}
      font={fontUrl}
      layers={textLayers}
    >
      {timeText}
      <meshBasicMaterial color={"#ffffff"} toneMapped={false} side={2} />
    </Text>
  );
}
