import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { RxCrossCircled, RxInfoCircled } from "react-icons/rx";
import useAppStore from "../../stores/useAppStore";

export default function InfoAndAckModal() {
  const currentBasicClockConfig = useAppStore(
    (state) => state.currentBasicClockConfig,
  );
  const interactionState = useAppStore((state) => state.interactionState);
  const [active, setActive] = useState(false);

  function handleKeyboardShortcuts(e: KeyboardEvent) {
    if (e.key === "Escape") {
      setActive(false);
    } else if (e.key === "i") {
      setActive((prev) => !prev);
    }
  }

  useEffect(() => {
    window.addEventListener("keydown", handleKeyboardShortcuts);
    return () => {
      window.removeEventListener("keydown", handleKeyboardShortcuts);
    };
  }, []);

  return (
    <>
      {" "}
      {(currentBasicClockConfig.info ||
        currentBasicClockConfig.acknowledgements) && (
        <>
          <motion.div
            className="absolute top-0 left-0 z-4 h-dvh w-dvw bg-black/50"
            initial={{ opacity: 0 }}
            animate={{ opacity: active ? 1 : 0 }}
            transition={{ duration: 0.3 }}
            onClick={() => setActive(false)}
            style={{ pointerEvents: active ? "auto" : "none" }}
          >
            <AnimatePresence>
              {active && (
                <motion.div
                  className="absolute top-1/2 left-1/2 w-11/12 -translate-x-1/2 -translate-y-1/2 rounded bg-zinc-900 p-6 text-zinc-200 md:w-1/2 md:max-w-[800px]"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.3 }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="absolute top-0 right-0 z-10 flex items-center justify-center overflow-hidden p-2">
                    <motion.div
                      whileHover={{
                        scale: 1.1,
                        backgroundColor: "#7a7a7f55",
                        color: "#e4e4e7",
                      }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setActive(false)}
                      className="cursor-pointer rounded-full p-1"
                      style={{
                        color: "#9f9fa9",
                        backgroundColor: "#7a7a7f00",
                      }}
                    >
                      <RxCrossCircled size={32} />
                    </motion.div>
                  </div>
                  <div className="flex h-full w-full flex-col">
                    <span className="text-left text-xl font-bold italic">
                      {currentBasicClockConfig.name}
                    </span>
                    <span className="my-2 w-full border-b border-zinc-400" />
                    <div className="flex max-h-[60vh] flex-1 flex-col gap-4 overflow-y-auto">
                      {currentBasicClockConfig.info && (
                        <div className="flex flex-col items-start overflow-y-auto whitespace-pre-wrap">
                          <h2 className="text-md my-1 border-b border-zinc-500 pr-2 font-bold">
                            Info
                          </h2>
                          <div className="text-sm whitespace-pre-wrap">
                            {currentBasicClockConfig.info}
                          </div>
                        </div>
                      )}
                      {currentBasicClockConfig.acknowledgements && (
                        <div className="flex flex-col items-start overflow-y-auto whitespace-pre-wrap">
                          <h2 className="text-md my-1 border-b border-zinc-500 pr-2 font-bold">
                            Acknowledgements
                          </h2>
                          <div className="text-sm whitespace-pre-wrap">
                            {currentBasicClockConfig.acknowledgements}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
          <motion.div className="pointer-events-auto absolute right-0 bottom-4 left-0 z-4 mx-auto w-max cursor-pointer">
            <motion.div
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setActive((prev) => !prev)}
              className="rounded-full bg-zinc-800 p-2 text-zinc-200"
              animate={{ opacity: interactionState === "active" ? 1 : 0 }}
            >
              <RxInfoCircled size={24} />
            </motion.div>
          </motion.div>
        </>
      )}
    </>
  );
}
