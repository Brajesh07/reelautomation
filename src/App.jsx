import React, { useEffect, useState } from 'react'
import { Routes, Route } from 'react-router-dom'
import ReelCanvas from './components/ReelCanvas'
import DesignPreview from './pages/DesignPreview'
import FramePreview from './pages/FramePreview'

import UploadData from './pages/UploadData'

function App() {
  const [data, setData] = useState(null)

  useEffect(() => {
    const customData = localStorage.getItem('customZodiacData')
    if (customData) {
      try {
        setData(JSON.parse(customData))
        console.log('Loaded custom zodiac data from localStorage')
      } catch (e) {
        console.error('Failed to parse custom data, falling back to default', e)
        fetch('/data.json')
          .then(res => res.json())
          .then(setData)
          .catch(err => console.error('Error loading data:', err))
      }
    } else {
      fetch('/data.json')
        .then(res => res.json())
        .then(setData)
        .catch(err => console.error('Error loading data:', err))
    }
  }, [])

  if (!data) {
    return <div style={{ color: 'white' }}>Loading...</div>
  }

  return (
    <Routes>
      <Route path="/reel-canvas" element={<ReelCanvas data={data} />} />
      <Route path="/design" element={<DesignPreview />} />
      <Route path="/frame-preview" element={<FramePreview />} />
      <Route path="/" element={<UploadData />} />
    </Routes>
  )
}

export default App
