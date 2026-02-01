import { FullScreen, useFullScreenHandle } from "react-full-screen";
import { Route, Routes } from "react-router";
import "./App.css";
import ArchdukeVonOrbenScene from "./components/clocks/archduke-von-orben/ArchdukeVonOrben";
import CavityScene from "./components/clocks/cavity/Cavity";
import FourierScene from "./components/clocks/fourier/Fourier";
import MNCAScene from "./components/clocks/mnca/MNCA";
// import NixieScene from "./components/clocks/nixie/Nixie";
// import PoolRoomScene from "./components/clocks/pool-room/PoolRoom";
import CosmoScene from "./components/clocks/cosmo/Cosmo";
import HexScene from "./components/clocks/hex/Hex";
import VoxusScene from "./components/clocks/voxus/Voxus";
import Timekeeper from "./components/misc/Timekeeper";
import FullscreenHandleComponent from "./components/ui/FullscreenHandleComponent";
import InteractionListener from "./components/ui/InteractionListener";
import Sidebar from "./components/ui/Sidebar";

function App() {
  const handle = useFullScreenHandle();
  return (
    <div className="h-full w-full overflow-hidden bg-zinc-900 text-sky-50">
      <Timekeeper />
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
            <Route
              path="/ArchdukeVonOrben"
              element={<ArchdukeVonOrbenScene />}
            />
            <Route path="/Cavity" element={<CavityScene />} />
            <Route path="/Cosmo" element={<CosmoScene />} />
            <Route path="/Fourier" element={<FourierScene />} />
            <Route path="/Hex" element={<HexScene />} />
            <Route path="/MNCA" element={<MNCAScene />} />
            {/* <Route path="/Nixie" element={<NixieScene />} /> */}
            {/* <Route path="/PoolRoom" element={<PoolRoomScene />} /> */}
            <Route path="/Voxus" element={<VoxusScene />} />
            <Route path="*" element={<ArchdukeVonOrbenScene />} />
          </Routes>
        </div>
      </FullScreen>
    </div>
  );
}

export default App;
