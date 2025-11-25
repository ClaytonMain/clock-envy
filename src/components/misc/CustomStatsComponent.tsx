import { Stats } from "@react-three/drei";
import { useEffect, useState } from "react";
import { STATS_CLASS_NAME } from "../../constants/constants";
import type { StatsPosition } from "../../types/types";

export default function CustomStatsComponent({
  position = "bl",
}: {
  position?: StatsPosition;
}) {
  const [className, setClassName] = useState("");

  useEffect(() => {
    const tOrB = position.charAt(0) === "t" ? "top-0" : "bottom-0";
    const lOrR = position.charAt(1) === "l" ? "left-0" : "right-0";
    setClassName(
      `fixed ${tOrB} ${lOrR} cursor-pointer opacity-90 z-[5] ${STATS_CLASS_NAME}`,
    );
  }, [position]);

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
    }, 1000);
    return () => clearInterval(intervalId);
  }, []);

  return <Stats className={className} />;
}
