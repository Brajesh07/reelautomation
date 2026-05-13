import React, { useState } from 'react'

function App() {
  const [zodiacs, setZodiacs] = useState([])
  const [status, setStatus] = useState('idle') // idle, rendering, done, error
  const [error, setError] = useState(null)

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target.result)
        const signs = Array.isArray(json) ? json : json.zodiacs

        if (!Array.isArray(signs)) throw new Error('Invalid JSON format. Expected an array or an object with a "zodiacs" key.')

        // Validate fields
        const required = ['name', 'vibe', 'love', 'career', 'money', 'soulMessage']
        signs.forEach((s, i) => {
          required.forEach(field => {
            if (!s[field]) throw new Error(`Sign at index ${i} (${s.name || 'Unknown'}) is missing "${field}"`)
          })
        })

        setZodiacs(signs)
        setStatus('idle')
        setError(null)
      } catch (err) {
        setError(err.message)
        setZodiacs([])
      }
    }
    reader.readAsText(file)
  }

  const handleRender = async () => {
    if (zodiacs.length === 0) return
    
    setStatus('rendering')
    const today = new Date().toISOString().split('T')[0]
    
    try {
      const response = await fetch('/api/render', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ zodiacs, date: today })
      })

      if (!response.ok) throw new Error('Render request failed')
      
      const data = await response.json()
      if (data.status === 'started') {
        setStatus('done')
      } else {
        throw new Error('Unexpected response from server')
      }
    } catch (err) {
      console.error(err)
      setStatus('error')
    }
  }

  const today = new Date().toISOString().split('T')[0]

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#0a0a0a',
      color: '#FFFFFF',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'Garamond, serif',
      padding: '40px'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '600px',
        backgroundColor: '#111',
        padding: '40px',
        borderRadius: '12px',
        border: '1px solid #333',
        textAlign: 'center',
        boxShadow: '0 10px 30px rgba(0,0,0,0.5)'
      }}>
        <h1 style={{ color: '#DAC477', fontSize: '2.5rem', marginBottom: '8px', letterSpacing: '2px' }}>CANVAREEL</h1>
        <p style={{ color: '#666', marginBottom: '32px', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Automated Video Pipeline</p>
        
        <div style={{ marginBottom: '32px', backgroundColor: '#0a0a0a', padding: '24px', borderRadius: '8px', border: '1px dashed #333' }}>
          <label style={{
            display: 'block',
            marginBottom: '16px',
            color: '#aaa',
            fontSize: '1rem'
          }}>Select JSON data file</label>
          <input 
            type="file" 
            accept=".json" 
            onChange={handleFileChange}
            style={{
              color: '#DAC477',
              fontSize: '0.9rem',
              cursor: 'pointer',
              width: '100%'
            }}
          />
        </div>

        {error && (
          <div style={{ backgroundColor: 'rgba(255, 68, 68, 0.1)', border: '1px solid #ff4444', padding: '12px', borderRadius: '6px', marginBottom: '20px' }}>
            <p style={{ color: '#ff4444', margin: 0, fontSize: '0.9rem' }}>❌ {error}</p>
          </div>
        )}

        {zodiacs.length > 0 && (
          <div style={{ marginBottom: '32px', textAlign: 'left', backgroundColor: '#0a0a0a', padding: '20px', borderRadius: '8px' }}>
            <p style={{ fontSize: '1.1rem', color: '#DAC477', marginBottom: '12px', fontWeight: 'bold' }}>
              {zodiacs.length} signs loaded:
            </p>
            <div style={{ color: '#888', lineHeight: '1.6', fontSize: '0.9rem', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {zodiacs.map((z, idx) => (
                <span key={z.name} style={{ backgroundColor: '#1a1a1a', padding: '4px 10px', borderRadius: '4px', border: '1px solid #333' }}>
                  {z.name}
                </span>
              ))}
            </div>
          </div>
        )}

        <button 
          onClick={handleRender}
          disabled={zodiacs.length === 0 || status === 'rendering'}
          style={{
            backgroundColor: status === 'rendering' ? '#333' : (status === 'done' ? '#222' : '#DAC477'),
            color: (status === 'rendering' || status === 'done') ? '#888' : '#000',
            border: 'none',
            padding: '18px 32px',
            fontSize: '1.1rem',
            fontWeight: 'bold',
            borderRadius: '8px',
            cursor: zodiacs.length === 0 || status === 'rendering' ? 'not-allowed' : 'pointer',
            transition: 'all 0.3s ease',
            width: '100%',
            textTransform: 'uppercase',
            letterSpacing: '1px'
          }}
        >
          {status === 'idle' && `Render All ${zodiacs.length} Videos`}
          {status === 'rendering' && `⏳ Rendering... Check Terminal`}
          {status === 'done' && `✅ Batch Started Successfully`}
          {status === 'error' && `❌ Connection Failed`}
        </button>

        {status === 'done' && (
          <div style={{ marginTop: '32px', textAlign: 'left', borderTop: '1px solid #222', paddingTop: '24px' }}>
            <p style={{ color: '#DAC477', marginBottom: '16px', fontWeight: 'bold' }}>Success!</p>
            <p style={{ color: '#888', fontSize: '0.9rem', marginBottom: '16px' }}>The render process is running in the background. You can find your files in the <code>/out</code> folder:</p>
            <div style={{ backgroundColor: '#0a0a0a', padding: '16px', borderRadius: '6px', maxHeight: '150px', overflowY: 'auto' }}>
              <ul style={{ listStyle: 'none', padding: 0, color: '#666', fontSize: '0.85rem', fontFamily: 'monospace' }}>
                {zodiacs.map(z => (
                  <li key={z.name} style={{ marginBottom: '6px' }}>
                    <span style={{ color: '#444' }}>[OUT]</span> {z.name}_{today}.mp4
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
      <p style={{ marginTop: '24px', color: '#444', fontSize: '0.8rem' }}>Vite Middleware Pipeline v1.0</p>
    </div>
  )
}

export default App
