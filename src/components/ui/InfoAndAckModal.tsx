import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { RxCrossCircled, RxInfoCircled } from "react-icons/rx";
import useAppStore from "../../stores/useAppStore";

export default function InfoAndAckModal() {
  const currentBasicClockConfig = useAppStore(
    (state) => state.currentBasicClockConfig,
  );
  const interactionState = useAppStore((state) => state.interactionState);
  const [active, setActive] = useState(false);

  return (
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
              className="absolute top-1/2 left-1/2 w-11/12 -translate-x-1/2 -translate-y-1/2 rounded bg-zinc-900 p-6 text-zinc-200 md:w-1/2"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.3 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="relative top-0 right-0">
                <RxCrossCircled
                  size={24}
                  className="ml-auto cursor-pointer text-zinc-400 hover:text-zinc-200"
                  onClick={() => setActive(false)}
                />
              </div>
              <div className="flex h-full w-full flex-col">
                <span className="text-left text-lg font-bold">
                  {currentBasicClockConfig.name}
                </span>
                <span className="my-2 w-full border border-b border-zinc-400" />
                <div className="flex-1 overflow-y-auto">
                  {currentBasicClockConfig.info && (
                    <div>
                      <h2 className="text-md mt-2 font-bold">Info</h2>
                      <p className="text-sm whitespace-pre-wrap">
                        {currentBasicClockConfig.info}
                      </p>
                    </div>
                  )}
                  {currentBasicClockConfig.acknowledgements && (
                    <div>
                      <h2 className="text-md mt-4 font-bold">
                        Acknowledgements
                      </h2>
                      <p className="text-sm whitespace-pre-wrap">
                        {currentBasicClockConfig.acknowledgements}
                      </p>
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
  );
}
