import { motion } from "motion/react";
import { type FullScreenHandle } from "react-full-screen";
import { MdFullscreen } from "react-icons/md";
import useAppStore from "../../stores/useAppStore";

export default function FullscreenHandleComponent({
  handle,
}: {
  handle: FullScreenHandle;
}) {
  const interactionState = useAppStore((state) => state.interactionState);
  return (
    <motion.div
      className="absolute top-6 right-6 z-50 h-8 w-8 cursor-pointer appearance-none p-0.5"
      animate={{
        opacity: interactionState === "active" ? 1 : 0,
      }}
      whileHover={{
        scale: 1.1,
      }}
      onClick={handle.enter}
      aria-label="Enter Fullscreen"
      role="button"
      tabIndex={0}
    >
      <MdFullscreen className="h-full w-full" />
    </motion.div>
  );
}
