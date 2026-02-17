import React, { useEffect, useState } from 'react'
import { Routes, Route } from 'react-router-dom'
import ReelCanvas from './components/ReelCanvas'
import DesignPreview from './pages/DesignPreview'
import FramePreview from './pages/FramePreview'

function App() {
  const [data, setData] = useState(null)

  useEffect(() => {
    fetch('/data.json')
      .then(res => res.json())
      .then(setData)
      .catch(err => console.error('Error loading data:', err))
  }, [])

  if (!data) {
    return <div style={{ color: 'white' }}>Loading...</div>
  }

  return (
    <Routes>
      <Route path="/" element={<ReelCanvas data={data} />} />
      <Route path="/design" element={<DesignPreview />} />
      <Route path="/frame-preview" element={<FramePreview />} />
    </Routes>
  )
}

export default App
