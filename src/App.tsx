import { Route, Routes } from "react-router";
import "./App.css";

function App() {
  return (
    <Routes>
      <Route
        path="/"
        element={<div className="App">react development is my passion</div>}
      />
    </Routes>
  );
}

export default App;
