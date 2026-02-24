import React, { useRef, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import gsap from 'gsap'
import { renderIntroFrame } from '../frames/IntroFrame'
import { renderOutroFrame } from '../frames/OutroFrame'
import { createZodiacTimeline, renderZodiacFrame } from '../frames/ZodiacFrame'
import { formatDate } from '../utils/dateFormatter'

// Import Decorative Images
import heart from '../images/heart.png'
import trophy from '../images/trophy.png'
import moneyBag from '../images/money-bag.png'
import crystalBall from '../images/crystal-ball.png'

// Import Zodiac Images
import aires from '../images/Aires.png'
import taurus from '../images/Taurus.png'
import gemini from '../images/Gemini.png'
import cancer from '../images/Cancer.png'
import leo from '../images/Leo.png'
import virgo from '../images/Virgo.png'
import libra from '../images/Libra.png'
// Assuming Virgo-1 might be Scorpio or a placeholder
import virgo1 from '../images/Virgo-1.png'
import sagittarius from '../images/Sagittarius.png'
import capricorn from '../images/Capricorn.png'
import aquarius from '../images/Aquarius.png'
import pisces from '../images/Pisces.png'

const decorativeSources = [heart, trophy, moneyBag, crystalBall]

const zodiacSources = [
  aires, taurus, gemini, cancer, leo, virgo,
  libra, virgo1, sagittarius, capricorn, aquarius, pisces
]

// Canvas dimensions for 9:16 vertical format
const CANVAS_WIDTH = 1080
const CANVAS_HEIGHT = 1920

const ReelCanvas = () => {
  const [data, setData] = useState(null)
  const canvasRef = useRef(null)
  const [isRecording, setIsRecording] = useState(false)
  const [recordingStatus, setRecordingStatus] = useState('')
  const [imagesLoaded, setImagesLoaded] = useState(false)
  const mediaRecorderRef = useRef(null)
  const chunksRef = useRef([])
  const timelineRef = useRef(null)
  const recordingIntervalRef = useRef(null)
  const [recordingProgress, setRecordingProgress] = useState(0)
  const imagesRef = useRef({ zodiac: [], decorative: [] })
  // Map for easy lookup of zodiac icons by name
  const zodiacIconsMapRef = useRef({})

  // Load Images
  useEffect(() => {
    let loadedCount = 0
    const totalImages = zodiacSources.length + decorativeSources.length

    const loadedZodiacs = new Array(zodiacSources.length)
    const loadedDecorative = new Array(decorativeSources.length)

    // Helper to check completion
    const checkCompletion = () => {
      loadedCount++
      if (loadedCount === totalImages) {
        // Build map
        const names = ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces']
        const map = {}
        names.forEach((name, i) => {
          map[name] = loadedZodiacs[i]
        })
        zodiacIconsMapRef.current = map

        imagesRef.current = {
          zodiac: loadedZodiacs,
          decorative: loadedDecorative
        }
        setImagesLoaded(true)
      }
    }

    zodiacSources.forEach((src, index) => {
      const img = new Image()
      img.src = src
      img.onload = () => {
        loadedZodiacs[index] = img
        checkCompletion()
      }
    })

    decorativeSources.forEach((src, index) => {
      const img = new Image()
      img.src = src
      img.onload = () => {
        loadedDecorative[index] = img
        checkCompletion()
      }
    })
  }, [])

  // Load Data (Internal)
  useEffect(() => {
    const customData = localStorage.getItem('customZodiacData')
    if (customData) {
      try {
        setData(JSON.parse(customData))
        console.log('ReelCanvas: Loaded custom zodiac data')
      } catch (e) {
        console.error('ReelCanvas: Failed to parse custom data', e)
        fetch('/data.json')
          .then(res => res.json())
          .then(setData)
          .catch(err => console.error(err))
      }
    } else {
      fetch('/data.json')
        .then(res => res.json())
        .then(setData)
        .catch(err => console.error(err))
    }
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !data || !imagesLoaded) return

    const ctx = canvas.getContext('2d')

    // Set up the canvas
    canvas.width = CANVAS_WIDTH
    canvas.height = CANVAS_HEIGHT

    // Animation state
    let opacity = { value: 1 }

    // Read font config saved from /design — zero race conditions since this
    // runs once when data+images are ready, before the timeline is built.
    let fontConfig = {}
    try {
      const saved = localStorage.getItem('fontConfig')
      if (saved) fontConfig = JSON.parse(saved)
    } catch { /* use defaults */ }

    const dateStr = formatDate(new Date())
    // Extract highlighted names from data
    const highlightedNames = data.zodiacs.map(z => z.name)
    const zodiacStr = highlightedNames.join(', ').toUpperCase()

    // Intro Animation State
    const introAnimState = {
      scale: 0,
      rotation: 0,
      opacity: 0,
      showText: false,
      textFade: 1,
      text1: '',
      text2: '',
      text3: '',
      text4: '',
      text5: ''
    }

    // Outro Animation State
    const outroAnimState = {
      opacity: 0,
      rotation: -60, // Match Intro initial rotation
      scale: 0,      // Match Intro initial scale
      text1: '',
      boxWidth: 0
    }

    // Create GSAP timeline with fade transitions (paused by default)
    const tl = gsap.timeline({ paused: true })
    timelineRef.current = tl

    // --- Frame 1: Zodiac Intro Animation ---

    // 1. Initial State
    tl.set(introAnimState, {
      scale: 0,
      rotation: -60,
      opacity: 0,
      textFade: 1,
      showText: false
    })

    // 2. Zodiac Sequence
    const updateIntro = () => {
      const textData = introAnimState.showText ? {
        opacity: introAnimState.textFade,
        line1: introAnimState.text1,
        line2: introAnimState.text2,
        line3: introAnimState.text3,
        line4: introAnimState.text4,
        line5: introAnimState.text5
      } : null

      renderIntroFrame(ctx, {
        scale: introAnimState.scale,
        rotation: introAnimState.rotation,
        opacity: introAnimState.opacity,
        images: imagesRef.current.zodiac,
        highlightedNames: highlightedNames,
        textData: textData,
        date: data.date,
        zodiacs: data.zodiacs
      }, fontConfig)
    }

    // Rotate + Scale In
    tl.to(introAnimState, {
      scale: 1,
      opacity: 1,
      rotation: 120,
      duration: 3.5,
      ease: "power2.out",
      onUpdate: updateIntro
    })

    // Text Reveal State Reset
    tl.call(() => {
      introAnimState.text1 = ''
      introAnimState.text2 = ''
      introAnimState.text3 = ''
      introAnimState.text4 = ''
      introAnimState.text5 = ''
    })
    tl.set(introAnimState, { showText: true })

    // Typewriter
    const textCounters = { c1: 0, c2: 0, c3: 0, c4: 0, c5: 0 }
    const content = {
      l1: "DAILY",
      l2: "HOROSCOPE",
      l3: "FOR",
      l4: zodiacStr,
      l5: dateStr
    }

    const addTypeTween = (counterKey, contentStr, label) => {
      tl.to(textCounters, {
        [counterKey]: contentStr.length,
        duration: contentStr.length * 0.05,
        ease: "none",
        onUpdate: () => {
          const count = Math.ceil(textCounters[counterKey])
          if (counterKey === 'c1') introAnimState.text1 = content.l1.substring(0, count)
          if (counterKey === 'c2') introAnimState.text2 = content.l2.substring(0, count)
          if (counterKey === 'c3') introAnimState.text3 = content.l3.substring(0, count)
          if (counterKey === 'c4') introAnimState.text4 = content.l4.substring(0, count)
          if (counterKey === 'c5') introAnimState.text5 = content.l5.substring(0, count)
          updateIntro()
        }
      }, label)
    }

    addTypeTween('c1', content.l1, ">")
    addTypeTween('c2', content.l2, ">+0.1")
    addTypeTween('c3', content.l3, ">+0.1")
    addTypeTween('c4', content.l4, ">+0.1")
    addTypeTween('c5', content.l5, ">+0.2")

    // Hold & Fade Out
    tl.to(introAnimState, {
      opacity: 0,
      textFade: 0,
      duration: 1.5,
      ease: "power2.inOut",
      onUpdate: updateIntro
    }, "+=0.5")

    // Frame 2, 3, 4: Zodiac Animations using new ZodiacFrame logic
    if (data.zodiacs) {
      data.zodiacs.forEach((zodiac, index) => {
        const isFirst = index === 0
        const isLast = index === data.zodiacs.length - 1
        const icon = zodiacIconsMapRef.current[zodiac.name] || zodiacIconsMapRef.current['Leo'] // fallback

        const zodiacTL = createZodiacTimeline(ctx, zodiac, {
          decorative: imagesRef.current.decorative,
          icon: icon
        }, { isFirst, isLast, holdDuration: 19, fontSizes: fontConfig })

        tl.add(zodiacTL)
      })
    }

    // Frame 5: Outro
    const updateOutro = () => {
      renderOutroFrame(ctx, {
        opacity: outroAnimState.opacity,
        rotation: outroAnimState.rotation,
        scale: outroAnimState.scale,
        text1: outroAnimState.text1,
        boxWidth: outroAnimState.boxWidth,
        images: imagesRef.current.zodiac
      }, fontConfig)
    }


    // 1. Enter with rotation (Group Rotation similar to IntroFrame)
    tl.add(() => {
      // Ensure clean state
      outroAnimState.opacity = 0
      outroAnimState.rotation = -60
      outroAnimState.scale = 0
      outroAnimState.text1 = ''
      outroAnimState.boxWidth = 0
    })

    // Rotate + Scale In (Matching Intro Logic exactly)
    tl.to(outroAnimState, {
      scale: 1,
      opacity: 1,
      rotation: 120,
      duration: 3.5,
      ease: "power2.out",
      onUpdate: updateOutro
    })

    // 2. Text Reveal (Typewriter) after rotation stops
    const outroFullText = "Want a personalised reading?"
    const outroTextCounter = { val: 0 }

    tl.to(outroTextCounter, {
      val: outroFullText.length,
      duration: outroFullText.length * 0.05,
      ease: "none",
      onUpdate: () => {
        outroAnimState.text1 = outroFullText.substring(0, Math.ceil(outroTextCounter.val))
        updateOutro()
      }
    })

    // 3. Yellow Box Reveal (Horizontal Mask)
    // "Visit starryvibes.ai" inside box.
    // Reveal mask 0 -> 100%
    tl.to(outroAnimState, {
      boxWidth: 100, // percentage
      duration: 1.5,
      ease: "power2.out",
      onUpdate: updateOutro
    })

    // 4. Hold
    tl.to({}, { duration: 3 })

    // 5. Exit (Fade Out)
    // No reverse mask, just fade out everything
    tl.to(outroAnimState, {
      opacity: 0,
      duration: 1.5, // Check Intro exit duration (it was 1.5)
      ease: "power2.inOut",
      onUpdate: updateOutro
    })

    // Reset alpha at the end
    tl.add(() => {
      ctx.globalAlpha = 1
    })

    return () => {
      tl.kill()
    }
  }, [data, imagesLoaded])
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

    // Start Progress Tracker
    const startTime = Date.now()
    setRecordingProgress(0)

    if (recordingIntervalRef.current) clearInterval(recordingIntervalRef.current)

    recordingIntervalRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime
      const percent = Math.min((elapsed / 60000) * 100, 100)
      setRecordingProgress(percent)

      if (percent >= 100) {
        clearInterval(recordingIntervalRef.current)
      }
    }, 100)

    // Start animation
    if (timelineRef.current) {
      timelineRef.current.restart()
    }

    // Auto-stop after 60 seconds
    setTimeout(() => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop()
      }
    }, 60000)
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop()
      mediaRecorderRef.current.stop()
      setRecordingStatus('Stopping...')
    }
    if (recordingIntervalRef.current) clearInterval(recordingIntervalRef.current)
    setRecordingProgress(0)
  }

  return (
    <div className='relative flex gap-5 items-start py-20'>
      <canvas
        ref={canvasRef}
        className='block'
        style={{
          width: '405px',
          height: '720px'
        }}
      />

      {/* Progress Bar Container */}
      {isRecording && (
        <div className='absolute -bottom-6 left-0 h-2 bg-gray-800 rounded overflow-hidden' style={{ width: '405px' }}>
          <div
            className='h-full bg-[#DAC477] transition-all duration-100 ease-linear'
            style={{ width: `${recordingProgress}%` }}
          />
        </div>
      )}

      <div className='w-[250px] bg-black bg-opacity-90 p-5 rounded-lg text-white sticky top-5'>
        <h3 className='m-0 mb-4 text-lg text-yellow-400'>
          📹 Export Video
        </h3>

        {/* <Link to="/design" style={{
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
        </Link> */}

        <Link to="/frame-preview" className='block w-full py-4 px-4 mb-4 bg-purple-600 border-none rounded-lg text-base font-bold cursor-pointer text-white no-underline text-center box-border hover:bg-purple-700 transition-colors'>
          🖼️ Frame Preview
        </Link>

        {!isRecording ? (
          <button
            onClick={startRecording}
            className='w-full py-4 px-4 bg-yellow-400 border-none rounded-lg text-base font-bold cursor-pointer text-black transition-colors hover:bg-yellow-300'
          >
            🎬 Start Recording
          </button>
        ) : (
          <button
            onClick={stopRecording}
            className='w-full py-4 px-4 bg-red-500 border-none rounded-lg text-base font-bold cursor-pointer text-white hover:bg-red-600 transition-colors'
          >
            ⏹️ Stop Recording
          </button>
        )}

        {recordingStatus && (
          <div className='mt-4 text-sm text-center p-3 bg-yellow-400 bg-opacity-10 rounded border border-yellow-400 border-opacity-30'>
            {recordingStatus}
          </div>
        )}

        {/* <div style={{
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
          • Full 1080×1920 resolution<br />
          • 100 seconds auto-capture<br />
          • Downloads as WebM video<br />          • Downloads as WebM video<br />
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
        </div> */}
      </div>
    </div>
  )
}

export default ReelCanvas
