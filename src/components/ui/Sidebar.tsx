import { AnimatePresence, motion, stagger } from "motion/react";
import { useEffect, useState } from "react";
import { MdClose, MdMenu } from "react-icons/md";
import { useNavigate } from "react-router";
import { CLOCK_NAMES } from "../../constants/constants";
import useAppStore from "../../stores/useAppStore";

function SidebarClockNameItem({
  name,
  currentClockName,
}: {
  name: (typeof CLOCK_NAMES)[number];
  currentClockName: (typeof CLOCK_NAMES)[number];
}) {
  const [selected, setSelected] = useState(name === currentClockName);
  const navigate = useNavigate();

  function handleOnClick() {
    useAppStore.setState({ currentClockName: name });
    navigate(`/${name.replace(/\s+/g, "")}`);
  }

  useEffect(() => {
    setSelected(name === currentClockName);
  }, [currentClockName, name]);

  return (
    <motion.div
      className="w-full cursor-pointer"
      whileHover={{ backgroundColor: "#111" }}
      style={{ backgroundColor: selected ? "#222" : "#000" }}
      onClick={handleOnClick}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div className="p-2 text-zinc-200" whileTap={{ scale: 0.95 }}>
        {name}
      </motion.div>
    </motion.div>
  );
}

export default function Sidebar() {
  const interactionState = useAppStore((state) => state.interactionState);
  const sidebarOpen = useAppStore((state) => state.sidebarOpen);
  const currentClockName = useAppStore((state) => state.currentClockName);

  function handleOnClick(newSidebarOpen: boolean) {
    useAppStore.setState({ sidebarOpen: newSidebarOpen });
  }

  return (
    <>
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.aside
              key="sidebar-backdrop-overlay"
              className="fixed top-0 left-0 z-10 h-full w-full bg-black/20"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => {
                if (sidebarOpen) {
                  handleOnClick(false);
                }
              }}
            />
            <motion.nav
              key="sidebar"
              className="fixed top-0 left-0 z-20 h-full w-80 overflow-y-scroll border-r border-zinc-800 bg-zinc-900/95 p-2"
              initial={{ x: -320 }}
              animate={{ x: 0 }}
              exit={{ x: -320 }}
              transition={{
                type: "spring",
                stiffness: 300,
                damping: 30,
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <motion.div
                className="flex h-full flex-col justify-center gap-1"
                transition={{
                  delayChildren: stagger(0.05, {
                    from: sidebarOpen ? "first" : "last",
                  }),
                }}
              >
                <AnimatePresence propagate>
                  {CLOCK_NAMES.map((name) => (
                    <SidebarClockNameItem
                      key={name}
                      name={name}
                      currentClockName={currentClockName}
                    />
                  ))}
                </AnimatePresence>
              </motion.div>
            </motion.nav>
          </>
        )}
      </AnimatePresence>
      <motion.div
        className="absolute top-8 z-30 cursor-pointer"
        animate={{
          left: sidebarOpen ? 320 + 16 : 32,
          opacity: interactionState === "active" || sidebarOpen ? 1 : 0,
        }}
        onClick={() => handleOnClick(!sidebarOpen)}
      >
        <motion.div className="relative" whileTap={{ scale: 0.9 }}>
          <motion.div
            className="absolute top-1/2 left-1/2 h-6 w-6 -translate-x-1/2 -translate-y-1/2"
            animate={{ opacity: sidebarOpen ? 1 : 0 }}
          >
            <MdClose className="h-full w-full text-zinc-200" />
          </motion.div>
          <motion.div
            className="absolute top-1/2 left-1/2 h-6 w-6 -translate-x-1/2 -translate-y-1/2"
            animate={{ opacity: sidebarOpen ? 0 : 1 }}
          >
            <MdMenu className="h-full w-full text-zinc-200" />
          </motion.div>
        </motion.div>
      </motion.div>
    </>
  );
}
