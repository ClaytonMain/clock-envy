import { FullScreen, useFullScreenHandle } from "react-full-screen";
import { Route, Routes } from "react-router";
import "./App.css";
import NeonPie from "./components/clocks/NeonPie";
import FullscreenHandleComponent from "./components/ui/FullscreenHandleComponent";
import InteractionListener from "./components/ui/InteractionListener";
import Sidebar from "./components/ui/Sidebar";

function App() {
  const handle = useFullScreenHandle();
  return (
    <div className="h-full w-full overflow-hidden bg-zinc-900 text-sky-50">
      <FullscreenHandleComponent handle={handle} />
      <FullScreen handle={handle}>
        <InteractionListener />
        <Sidebar />
        <div className="h-screen w-screen">
          <Routes>
            <Route
              path="/"
              element={
                <div className="App">react development is my passion</div>
              }
            />
            <Route path="/Neon Pie" element={<NeonPie />} />
            <Route
              path="*"
              element={
                <div className="App">react development is my passion</div>
              }
            />
          </Routes>
        </div>
      </FullScreen>
    </div>
  );
}

export default App;
