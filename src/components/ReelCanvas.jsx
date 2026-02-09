import React, { useRef, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import gsap from 'gsap'
import { renderIntroFrame } from '../frames/IntroFrame'
import { renderZodiacFrame } from '../frames/ZodiacFrame'
import { renderOutroFrame } from '../frames/OutroFrame'

// Canvas dimensions for 9:16 vertical format
const CANVAS_WIDTH = 1080
const CANVAS_HEIGHT = 1920

const ReelCanvas = ({ data }) => {
  const canvasRef = useRef(null)
  const [isRecording, setIsRecording] = useState(false)
  const [recordingStatus, setRecordingStatus] = useState('')
  const mediaRecorderRef = useRef(null)
  const chunksRef = useRef([])
  const timelineRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !data) return

    const ctx = canvas.getContext('2d')

    // Set up the canvas
    canvas.width = CANVAS_WIDTH
    canvas.height = CANVAS_HEIGHT

    // Animation state
    let opacity = { value: 1 }

    // Create GSAP timeline with fade transitions (paused by default)
    const tl = gsap.timeline({ paused: true })
    timelineRef.current = tl

    // Frame 1: Intro (6 seconds)
    tl.add(() => {
      renderIntroFrame(ctx, data)
    })
    tl.to({}, { duration: 5.5 })
    // Fade out
    tl.to(opacity, {
      value: 0,
      duration: 0.5,
      onUpdate: () => {
        ctx.globalAlpha = opacity.value
        renderIntroFrame(ctx, data)
      }
    })

    // Frame 2: Zodiac 1 (20 seconds)
    tl.add(() => {
      opacity.value = 0
      ctx.globalAlpha = opacity.value
    })
    tl.to(opacity, {
      value: 1,
      duration: 0.5,
      onUpdate: () => {
        ctx.globalAlpha = opacity.value
        renderZodiacFrame(ctx, data.zodiacs[0])
      }
    })
    tl.to({}, { duration: 19 })
    tl.to(opacity, {
      value: 0,
      duration: 0.5,
      onUpdate: () => {
        ctx.globalAlpha = opacity.value
        renderZodiacFrame(ctx, data.zodiacs[0])
      }
    })

    // Frame 3: Zodiac 2 (20 seconds)
    tl.add(() => {
      opacity.value = 0
      ctx.globalAlpha = opacity.value
    })
    tl.to(opacity, {
      value: 1,
      duration: 0.5,
      onUpdate: () => {
        ctx.globalAlpha = opacity.value
        renderZodiacFrame(ctx, data.zodiacs[1])
      }
    })
    tl.to({}, { duration: 19 })
    tl.to(opacity, {
      value: 0,
      duration: 0.5,
      onUpdate: () => {
        ctx.globalAlpha = opacity.value
        renderZodiacFrame(ctx, data.zodiacs[1])
      }
    })

    // Frame 4: Zodiac 3 (20 seconds)
    tl.add(() => {
      opacity.value = 0
      ctx.globalAlpha = opacity.value
    })
    tl.to(opacity, {
      value: 1,
      duration: 0.5,
      onUpdate: () => {
        ctx.globalAlpha = opacity.value
        renderZodiacFrame(ctx, data.zodiacs[2])
      }
    })
    tl.to({}, { duration: 19 })
    tl.to(opacity, {
      value: 0,
      duration: 0.5,
      onUpdate: () => {
        ctx.globalAlpha = opacity.value
        renderZodiacFrame(ctx, data.zodiacs[2])
      }
    })

    // Frame 5: Outro (4 seconds)
    tl.add(() => {
      opacity.value = 0
      ctx.globalAlpha = opacity.value
    })
    tl.to(opacity, {
      value: 1,
      duration: 0.5,
      onUpdate: () => {
        ctx.globalAlpha = opacity.value
        renderOutroFrame(ctx)
      }
    })
    tl.to({}, { duration: 3.5 })

    // Reset alpha at the end
    tl.add(() => {
      ctx.globalAlpha = 1
    })

    return () => {
      tl.kill()
    }
  }, [data])
  const startRecording = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    // Capture canvas stream at 30fps
    const stream = canvas.captureStream(30)

    // Create media recorder with high quality settings
    const options = {
      mimeType: 'video/webm;codecs=vp9',
      videoBitsPerSecond: 8000000 // 8 Mbps for high quality
    }

    try {
      mediaRecorderRef.current = new MediaRecorder(stream, options)
    } catch (e) {
      // Fallback to default codec
      mediaRecorderRef.current = new MediaRecorder(stream)
    }

    chunksRef.current = []

    mediaRecorderRef.current.ondataavailable = (event) => {
      if (event.data.size > 0) {
        chunksRef.current.push(event.data)
      }
    }

    mediaRecorderRef.current.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: 'video/webm' })
      const url = URL.createObjectURL(blob)

      // Download the video
      const a = document.createElement('a')
      a.href = url
      a.download = `astrology-reel-${Date.now()}.webm`
      a.click()

      setRecordingStatus('✅ Recording saved! Converting to MP4...')
      setIsRecording(false)

      // Reset timeline
      if (timelineRef.current) {
        timelineRef.current.pause()
        timelineRef.current.seek(0)
      }

      setTimeout(() => setRecordingStatus(''), 3000)
    }

    // Start recording
    mediaRecorderRef.current.start()
    setIsRecording(true)
    setRecordingStatus('🔴 Recording canvas...')

    // Start animation
    if (timelineRef.current) {
      timelineRef.current.restart()
    }

    // Auto-stop after 70 seconds
    setTimeout(() => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop()
      }
    }, 70000)
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop()
      setRecordingStatus('Stopping...')
    }
  }

  return (
    <div style={{ position: 'relative', display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
      <canvas
        ref={canvasRef}
        style={{
          width: '405px',
          height: '720px',
          display: 'block',
        }}
      />

      <div style={{
        width: '250px',
        background: 'rgba(0, 0, 0, 0.9)',
        padding: '20px',
        borderRadius: '10px',
        color: 'white',
        position: 'sticky',
        top: '20px'
      }}>
        <h3 style={{ margin: '0 0 15px 0', fontSize: '18px', color: '#ffd700' }}>
          📹 Export Video
        </h3>

        <Link to="/design" style={{
          display: 'block',
          width: '100%',
          padding: '15px',
          marginBottom: '15px',
          background: '#4e9eff',
          border: 'none',
          borderRadius: '8px',
          fontSize: '16px',
          fontWeight: 'bold',
          cursor: 'pointer',
          color: '#fff',
          textDecoration: 'none',
          textAlign: 'center',
          boxSizing: 'border-box'
        }}>
          🎨 Open Design Preview
        </Link>

        {!isRecording ? (
          <button
            onClick={startRecording}
            style={{
              width: '100%',
              padding: '15px',
              background: '#ffd700',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: 'bold',
              cursor: 'pointer',
              color: '#000',
              transition: 'background 0.2s'
            }}
            onMouseOver={(e) => e.target.style.background = '#ffed4e'}
            onMouseOut={(e) => e.target.style.background = '#ffd700'}
          >
            🎬 Start Recording
          </button>
        ) : (
          <button
            onClick={stopRecording}
            style={{
              width: '100%',
              padding: '15px',
              background: '#ff4444',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: 'bold',
              cursor: 'pointer',
              color: '#fff'
            }}
          >
            ⏹️ Stop Recording
          </button>
        )}

        {recordingStatus && (
          <div style={{
            marginTop: '15px',
            fontSize: '14px',
            textAlign: 'center',
            padding: '12px',
            background: 'rgba(255, 215, 0, 0.1)',
            borderRadius: '5px',
            border: '1px solid rgba(255, 215, 0, 0.3)'
          }}>
            {recordingStatus}
          </div>
        )}

        <div style={{
          marginTop: '20px',
          fontSize: '13px',
          opacity: 0.8,
          lineHeight: '1.6',
          borderTop: '1px solid rgba(255, 255, 255, 0.1)',
          paddingTop: '15px'
        }}>
          <strong style={{ color: '#ffd700' }}>How it works:</strong><br />
          • Records ONLY the canvas<br />
          • Full 1080×1920 resolution<br />
          • 70 seconds auto-capture<br />
          • Downloads as WebM video<br />
          <br />
          <strong style={{ color: '#ffd700' }}>Convert to MP4:</strong><br />
          <code style={{
            display: 'block',
            background: 'rgba(0,0,0,0.5)',
            padding: '8px',
            borderRadius: '3px',
            fontSize: '11px',
            marginTop: '5px',
            wordBreak: 'break-all'
          }}>
            ffmpeg -i file.webm -c:v libx264 -crf 18 -pix_fmt yuv420p output.mp4
          </code>
        </div>
      </div>
    </div>
  )
}

export default ReelCanvas
