import "./App.css";
import { BrowserRouter, Route, Routes } from "react-router";
import Layout from "./features/editor/layout";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}></Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
