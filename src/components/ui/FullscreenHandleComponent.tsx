import { motion } from "motion/react";
import { type FullScreenHandle } from "react-full-screen";
import { MdFullscreen } from "react-icons/md";

export default function FullscreenHandleComponent({
  handle,
}: {
  handle: FullScreenHandle;
}) {
  return (
    <motion.div
      className="absolute top-4 right-4 z-50 cursor-pointer appearance-none p-0.5 text-sky-50"
      animate={{
        backgroundColor: "var(--color-zinc-950-60)",
      }}
      whileHover={{
        backgroundColor: "var(--color-sky-950-60)",
      }}
      onClick={handle.enter}
      aria-label="Enter Fullscreen"
      role="button"
      tabIndex={0}
    >
      <MdFullscreen className="h-6 w-6" />
    </motion.div>
  );
}
