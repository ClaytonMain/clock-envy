import { Stats } from "@react-three/drei";
import { useEffect } from "react";
import { STATS_CLASS_NAME } from "../../constants/constants";
import useAppStore from "../../stores/useAppStore";
import type { StatsPosition } from "../../types/types";

function getStatsClassName(position: StatsPosition) {
  const tOrB = position.charAt(0) === "t" ? "top-0" : "bottom-0";
  const lOrR = position.charAt(1) === "l" ? "left-0" : "right-0";
  return `fixed ${tOrB} ${lOrR} cursor-pointer opacity-90 z-[5] ${STATS_CLASS_NAME}`;
}

export default function CustomStatsComponent({
  position = "bl",
}: {
  position?: StatsPosition;
}) {
  const debug = useAppStore((state) => state.debug);
  const className = getStatsClassName(position);

  useEffect(() => {
    const intervalId = setInterval(() => {
      const statsElement = document.querySelector(`.${STATS_CLASS_NAME}`);
      if (
        statsElement &&
        statsElement instanceof HTMLDivElement &&
        statsElement.hasAttribute("style")
      ) {
        statsElement.removeAttribute("style");
      }
    }, 500);
    return () => clearInterval(intervalId);
  }, []);

  return <>{debug && <Stats className={className} />}</>;
}
