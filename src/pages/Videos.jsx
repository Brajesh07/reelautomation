import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import JSZip from 'jszip'
import { saveAs } from 'file-saver'

export default function Videos() {
  const navigate = useNavigate()
  const [videos, setVideos] = useState([])
  const [selected, setSelected] = useState(new Set())
  const [loading, setLoading] = useState(true)
  const [actionStatus, setActionStatus] = useState('') // 'deleting', 'downloading', ''

  const fetchVideos = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/videos')
      const data = await res.json()
      setVideos(data.videos || [])
    } catch (err) {
      console.error('Failed to fetch videos', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchVideos()
  }, [])

  const toggleSelect = (filename) => {
    const next = new Set(selected)
    if (next.has(filename)) {
      next.delete(filename)
    } else {
      next.add(filename)
    }
    setSelected(next)
  }

  const toggleSelectAll = () => {
    if (selected.size === videos.length) {
      setSelected(new Set())
    } else {
      setSelected(new Set(videos))
    }
  }

  const handleDelete = async () => {
    if (selected.size === 0) return
    if (!window.confirm(`Delete ${selected.size} videos? This cannot be undone.`)) return

    setActionStatus('deleting')
    try {
      const res = await fetch('/api/delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filenames: Array.from(selected) })
      })
      if (res.ok) {
        await fetchVideos()
        setSelected(new Set())
      }
    } catch (err) {
      console.error('Delete failed', err)
    } finally {
      setActionStatus('')
    }
  }

  const handleDownloadZip = async () => {
    if (selected.size === 0) return
    setActionStatus('downloading')
    
    try {
      const zip = new JSZip()
      const folder = zip.folder("CanvaReel_Videos")
      
      const downloadPromises = Array.from(selected).map(async (filename) => {
        const res = await fetch(`/api/download/${filename}`)
        const blob = await res.blob()
        folder.file(filename, blob)
      })

      await Promise.all(downloadPromises)
      const content = await zip.generateAsync({ type: "blob" })
      saveAs(content, "CanvaReel_Videos.zip")
    } catch (err) {
      console.error('ZIP generation failed', err)
    } finally {
      setActionStatus('')
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#0a0a0a',
      color: '#FFFFFF',
      fontFamily: 'Garamond, serif',
      padding: '40px'
    }}>
      {/* Top Bar */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '40px',
        borderBottom: '1px solid #333',
        paddingBottom: '20px'
      }}>
        <button 
          onClick={() => navigate('/')}
          style={{
            backgroundColor: 'transparent',
            color: '#DAC477',
            border: 'none',
            fontSize: '1.2rem',
            cursor: 'pointer'
          }}
        >
          ← Back
        </button>
        <h1 style={{ color: '#DAC477', margin: 0 }}>Rendered Videos ({videos.length})</h1>
        {videos.length > 0 && (
          <button 
            onClick={toggleSelectAll}
            style={{
              backgroundColor: '#222',
              color: '#fff',
              border: '1px solid #444',
              padding: '8px 16px',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            {selected.size === videos.length ? 'Deselect All' : 'Select All'}
          </button>
        )}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', marginTop: '100px', color: '#666' }}>Loading videos...</div>
      ) : videos.length === 0 ? (
        <div style={{ textAlign: 'center', marginTop: '100px' }}>
          <p style={{ color: '#666', fontSize: '1.2rem', marginBottom: '24px' }}>No videos yet. Go render some first!</p>
          <button 
            onClick={() => navigate('/')}
            style={{
              backgroundColor: '#DAC477',
              color: '#000',
              border: 'none',
              padding: '12px 24px',
              fontSize: '1rem',
              fontWeight: 'bold',
              borderRadius: '8px',
              cursor: 'pointer'
            }}
          >
            ← Go Render
          </button>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: '30px',
          paddingBottom: '100px'
        }}>
          {videos.map((filename) => {
            const isSelected = selected.has(filename)
            return (
              <div 
                key={filename}
                style={{
                  backgroundColor: '#111',
                  borderRadius: '12px',
                  overflow: 'hidden',
                  border: isSelected ? '2px solid #DAC477' : '2px solid #2a2a2a',
                  transition: 'border-color 0.2s',
                  position: 'relative'
                }}
              >
                <input 
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => toggleSelect(filename)}
                  style={{
                    position: 'absolute',
                    top: '12px',
                    left: '12px',
                    zIndex: 10,
                    width: '20px',
                    height: '20px',
                    cursor: 'pointer'
                  }}
                />
                <video 
                  src={`/api/download/${filename}`}
                  controls
                  muted
                  style={{ width: '100%', aspectRatio: '9/16', backgroundColor: '#000' }}
                />
                <div style={{ padding: '12px', fontSize: '0.9rem', color: '#888', textAlign: 'center' }}>
                  {filename}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Bottom Action Bar */}
      {selected.size > 0 && (
        <div style={{
          position: 'fixed',
          bottom: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          backgroundColor: '#1a1a1a',
          padding: '16px 32px',
          borderRadius: '50px',
          display: 'flex',
          alignItems: 'center',
          gap: '24px',
          boxShadow: '0 10px 40px rgba(0,0,0,0.8)',
          border: '1px solid #333',
          zIndex: 100
        }}>
          <span style={{ color: '#DAC477', fontWeight: 'bold' }}>{selected.size} selected</span>
          
          <button 
            onClick={handleDownloadZip}
            disabled={actionStatus !== ''}
            style={{
              backgroundColor: '#DAC477',
              color: '#000',
              border: 'none',
              padding: '10px 20px',
              borderRadius: '25px',
              fontWeight: 'bold',
              cursor: actionStatus !== '' ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            {actionStatus === 'downloading' ? '⏳ Preparing ZIP...' : '⬇ Download ZIP'}
          </button>

          <button 
            onClick={handleDelete}
            disabled={actionStatus !== ''}
            style={{
              backgroundColor: '#ff4444',
              color: '#fff',
              border: 'none',
              padding: '10px 20px',
              borderRadius: '25px',
              fontWeight: 'bold',
              cursor: actionStatus !== '' ? 'not-allowed' : 'pointer'
            }}
          >
            {actionStatus === 'deleting' ? '⏳ Deleting...' : '🗑 Delete Selected'}
          </button>
        </div>
      )}
    </div>
  )
}
