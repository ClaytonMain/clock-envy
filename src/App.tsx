import { FullScreen, useFullScreenHandle } from "react-full-screen";
import { Route, Routes } from "react-router";
import "./App.css";
import FullscreenHandleComponent from "./components/ui/FullscreenHandleComponent";
import InteractionListener from "./components/ui/InteractionListener";

function App() {
  const handle = useFullScreenHandle();
  return (
    <>
      <InteractionListener />
      <FullscreenHandleComponent handle={handle} />
      <FullScreen handle={handle}>
        <Routes>
          <Route
            path="/"
            element={<div className="App">react development is my passion</div>}
          />
        </Routes>
      </FullScreen>
    </>
  );
}

export default App;
