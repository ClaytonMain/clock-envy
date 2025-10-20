import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { MdClose, MdMenu } from "react-icons/md";
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
  function handleOnClick() {
    useAppStore.setState({ currentClockName: name });
    setSelected(true);
  }
  return (
    <motion.div
      className="h-full w-full cursor-pointer"
      whileHover={{ backgroundColor: "#111" }}
      style={{ backgroundColor: selected ? "#222" : "#000" }}
      onClick={handleOnClick}
    >
      <motion.div className="p-2 text-zinc-200" whileTap={{ scale: 0.9 }}>
        {name}
      </motion.div>
    </motion.div>
  );
}

export default function Sidebar() {
  const sidebarOpen = useAppStore((state) => state.sidebarOpen);
  const currentClockName = useAppStore((state) => state.currentClockName);

  return (
    <div className="h-full w-full">
      <motion.aside
        id="sidebar-backdrop-overlay"
        className="fixed top-0 left-0 z-10 h-full w-full bg-black/20 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        onClick={() => {
          if (sidebarOpen) {
            useAppStore.setState({ sidebarOpen: false });
          }
        }}
      />
      <AnimatePresence>
        {sidebarOpen && (
          <motion.nav
            key="sidebar"
            className="fixed top-0 left-0 z-20 h-full w-64 border-r border-zinc-800 bg-zinc-900/95 p-4 shadow-lg backdrop-blur-sm"
            initial={{ x: -256 }}
            animate={{ x: 0 }}
            exit={{ x: -256 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            onClick={(e) => e.stopPropagation()}
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
          </motion.nav>
        )}
      </AnimatePresence>
      <motion.div
        className="absolute top-4 z-30 cursor-pointer"
        animate={{ left: sidebarOpen ? 256 + 16 : 16 }}
      >
        {sidebarOpen ? (
          <MdClose
            className="h-8 w-8 text-zinc-200"
            onClick={() => useAppStore.setState({ sidebarOpen: false })}
          />
        ) : (
          <MdMenu
            className="h-8 w-8 text-zinc-200"
            onClick={() => useAppStore.setState({ sidebarOpen: true })}
          />
        )}
      </motion.div>
    </div>
  );
}
