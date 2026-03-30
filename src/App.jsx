import React from 'react'

// This Vite app shell is intentionally minimal.
// The project is fully Remotion-based — use:
//   npm run remotion:preview   → live studio
//   npm run remotion:render    → export MP4
function App() {
  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#000',
      color: '#DAC477',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'Garamond, serif',
      gap: '16px'
    }}>
      <h1 style={{ fontSize: '2rem', margin: 0 }}>StarryVibes</h1>
      <p style={{ color: '#aaa', margin: 0 }}>Run <code style={{ color: '#DAC477' }}>npm run remotion:preview</code> to open the studio.</p>
    </div>
  )
}

export default App
