import { Bounds, Box } from "@react-three/drei";
import useAppStore from "../../stores/useAppStore";

export default function BasicBoundsBoxBaybee({
  boundsFit = true,
  boundsMargin = 1.2,
  boundsObserve = false,
  boundsMaxDuration = 0,
  boxArgs = [1, 1, 1],
  boxPosition = [0, 0, 0],
}: {
  boundsFit?: boolean;
  boundsMargin?: number;
  boundsObserve?: boolean;
  boundsMaxDuration?: number;
  boxArgs?: [number, number, number];
  boxPosition?: [number, number, number];
}) {
  const debug = useAppStore((state) => state.debug);

  return (
    <Bounds
      fit={boundsFit}
      margin={boundsMargin}
      observe={boundsObserve}
      maxDuration={boundsMaxDuration}
    >
      <Box args={boxArgs} position={boxPosition} visible={debug}>
        <meshBasicMaterial wireframe />
      </Box>
    </Bounds>
  );
}
