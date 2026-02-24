import React from 'react'
import { Routes, Route } from 'react-router-dom'
import ReelCanvas from './components/ReelCanvas'
import DesignPreview from './pages/DesignPreview'
import FramePreview from './pages/FramePreview'
import UploadData from './pages/UploadData'
import LayoutWithHeader from './components/LayoutWithHeader'

function App() {
  return (
    <Routes>
      {/* Upload page — no header */}
      <Route path="/" element={<UploadData />} />

      {/* All other pages get the persistent header */}
      <Route element={<LayoutWithHeader />}>
        <Route path="/reel-canvas" element={<ReelCanvas />} />
        <Route path="/design" element={<DesignPreview />} />
        <Route path="/frame-preview" element={<FramePreview />} />
      </Route>
    </Routes>
  )
}

export default App
