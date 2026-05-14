import React from "react";
import { Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Videos from "./pages/Videos";
import LayoutWithHeader from "./components/LayoutWithHeader";
import ReelCanvas from "./components/ReelCanvas";
import DesignPreview from "./pages/DesignPreview";
import FramePreview from "./pages/FramePreview";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/videos" element={<Videos />} />
      <Route element={<LayoutWithHeader />}>
        <Route path="/reel-canvas" element={<ReelCanvas />} />
        <Route path="/design" element={<DesignPreview />} />
        <Route path="/frame-preview" element={<FramePreview />} />
      </Route>
    </Routes>
  );
}

export default App;
