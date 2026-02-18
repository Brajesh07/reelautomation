import React, { useEffect, useState } from 'react'
import { Routes, Route } from 'react-router-dom'
import ReelCanvas from './components/ReelCanvas'
import DesignPreview from './pages/DesignPreview'
import FramePreview from './pages/FramePreview'

import UploadData from './pages/UploadData'

// Data loading moved to individual components (ReelCanvas, FramePreview)

function App() {
  return (
    <Routes>
      <Route path="/" element={<UploadData />} />
      <Route path="/reel-canvas" element={<ReelCanvas />} />
      <Route path="/design" element={<DesignPreview />} />
      <Route path="/frame-preview" element={<FramePreview />} />
    </Routes>
  )
}

export default App
