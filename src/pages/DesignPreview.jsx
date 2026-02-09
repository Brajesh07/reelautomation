import React, { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import gsap from 'gsap'
import { renderDraftFrame } from '../frames/DraftFrame'

// Import Zodiac Images
import aires from '../images/Aires.png'
import taurus from '../images/Taurus.png'
import gemini from '../images/Gemini.png'
import cancer from '../images/Cancer.png'
import leo from '../images/Leo.png'
import virgo from '../images/Virgo.png'
import libra from '../images/Libra.png'
// Assuming Virgo-1 might be Scorpio or a placeholder, using it to fill the gap
// If Scorpio is missing, we might need to duplicate or use a placeholder
import virgo1 from '../images/Virgo-1.png'
import sagittarius from '../images/Sagittarius.png'
import capricorn from '../images/Capricorn.png'
import aquarius from '../images/Aquarius.png'
import pisces from '../images/Pisces.png'

const zodiacSources = [
    aires, taurus, gemini, cancer, leo, virgo,
    libra, virgo1, sagittarius, capricorn, aquarius, pisces
]

const DesignPreview = () => {
    const canvasRef = useRef(null)
    const [imagesLoaded, setImagesLoaded] = useState(false)
    const imagesRef = useRef([])
    const timelineRef = useRef(null)

    // Load Images
    useEffect(() => {
        let loadedCount = 0
        const totalImages = zodiacSources.length
        const loadedImages = new Array(totalImages)

        zodiacSources.forEach((src, index) => {
            const img = new Image()
            img.src = src
            img.onload = () => {
                loadedImages[index] = img
                loadedCount++
                if (loadedCount === totalImages) {
                    imagesRef.current = loadedImages
                    setImagesLoaded(true)
                }
            }
        })
    }, [])

    // Animation Logic
    useEffect(() => {
        if (!imagesLoaded) return

        const canvas = canvasRef.current
        if (!canvas) return
        const ctx = canvas.getContext('2d')
        canvas.width = 1080
        canvas.height = 1920

        // Helper for Date Format (e.g., "2nd Feb. 2026")
        const formatDate = (date) => {
            const d = date.getDate()
            const m = date.toLocaleString('default', { month: 'short' })
            const y = date.getFullYear()
            const suffix = (d) => {
                if (d > 3 && d < 21) return 'th'
                switch (d % 10) {
                    case 1: return "st"
                    case 2: return "nd"
                    case 3: return "rd"
                    default: return "th"
                }
            }
            return `${d}${suffix(d)} ${m} ${y}`
        }

        // Animation Object
        const animState = {
            scale: 0,
            rotation: 0,
            opacity: 0,
            showText: false, // STRICT control
            textFade: 1      // New: Controls fade out of text at the end
        }

        // Create Timeline
        const tl = gsap.timeline({
            repeat: 0,
            onUpdate: () => {
                const textData = animState.showText ? {
                    opacity: animState.textFade, // Controlled opacity for fade out
                    line1: animState.text1,
                    line2: animState.text2,
                    line3: animState.text3,
                    line4: animState.text4,
                    line5: animState.text5
                } : null

                renderDraftFrame(ctx, {
                    scale: animState.scale,
                    rotation: animState.rotation,
                    opacity: animState.opacity,
                    images: imagesRef.current,
                    highlightedNames: highlighted,
                    textData: textData
                })
            }
        })
        timelineRef.current = tl

        // Initial State (Explicit Resets)
        animState.scale = 0
        animState.opacity = 0
        animState.rotation = -60
        animState.textFade = 1

        // Text Initial State: Empty strings
        animState.text1 = ''
        animState.text2 = ''
        animState.text3 = ''
        animState.text4 = ''
        animState.text5 = ''

        // Config
        const highlighted = ['Leo', 'Taurus', 'Aquarius']
        const dateStr = formatDate(new Date())
        const zodiacStr = highlighted.join(', ').toUpperCase()

        // Ensure strictly fresh state on start/restart
        tl.set(animState, { textFade: 1 })

        // 1. Zodiac Sequence (Scale + Rotate)
        // 0 -> 3.5s: Zodiacs rotate and settle. Text DOES NOT EXIST.
        tl.to(animState, {
            scale: 1,
            opacity: 1,
            rotation: 120,
            duration: 3.5,
            ease: "power2.out"
        })

        // 2. Text Layer Reveal
        // STRICT TIMING: At 3.5s (end of rotation), Text Layer is created INSTANTLY.

        // CRITICAL FIX: Reset text strings immediately before showing layer
        // This prevents "stale" text from previous plays appearing for 1 frame
        tl.call(() => {
            animState.text1 = ''
            animState.text2 = ''
            animState.text3 = ''
            animState.text4 = ''
            animState.text5 = ''
        })

        // No fade-in. No opacity tween. Reveal instant.
        tl.set(animState, { showText: true })

        // 3. Typewriter Effect (Starts immediately after layer creation)
        const textCounters = { c1: 0, c2: 0, c3: 0, c4: 0, c5: 0 }
        const content = {
            l1: "DAILY",
            l2: "HOROSCOPE",
            l3: "FOR",
            l4: zodiacStr,
            l5: dateStr
        }

        // Helper to add typing tween
        const addTypeTween = (counterKey, contentStr, label) => {
            tl.to(textCounters, {
                [counterKey]: contentStr.length,
                duration: contentStr.length * 0.05,
                ease: "none",
                onUpdate: () => {
                    const count = Math.ceil(textCounters[counterKey])
                    if (counterKey === 'c1') animState.text1 = content.l1.substring(0, count)
                    if (counterKey === 'c2') animState.text2 = content.l2.substring(0, count)
                    if (counterKey === 'c3') animState.text3 = content.l3.substring(0, count)
                    if (counterKey === 'c4') animState.text4 = content.l4.substring(0, count)
                    if (counterKey === 'c5') animState.text5 = content.l5.substring(0, count)
                }
            }, label)
        }

        // Sequence: Line by line
        addTypeTween('c1', content.l1, ">")
        addTypeTween('c2', content.l2, ">+0.1")
        addTypeTween('c3', content.l3, ">+0.1")
        addTypeTween('c4', content.l4, ">+0.1")
        addTypeTween('c5', content.l5, ">+0.2")

        // 4. Final Disappearance (Hold 3s -> Fade Out)
        // Hold for 3s (using "+=3" delay on the next tween)
        // Fade out both the Ring (opacity) and the Text (textFade) together
        tl.to(animState, {
            opacity: 0,    // Fade out ring
            textFade: 0,   // Fade out text
            duration: 1.5,
            ease: "power2.inOut"
        }, "+=3")

        return () => {
            tl.kill()
        }
    }, [imagesLoaded])

    const handleReplay = () => {
        if (timelineRef.current) {
            timelineRef.current.restart()
        }
    }

    return (
        <div style={{
            width: '100vw',
            height: '100vh',
            background: '#1a1a1a',
            color: 'white',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            padding: '20px',
            overflow: 'hidden'
        }}>
            <div style={{
                maxWidth: '1200px',
                width: '100%',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '20px'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                    <h1>Design Preview</h1>
                    <button
                        onClick={handleReplay}
                        style={{
                            padding: '8px 16px',
                            background: '#444',
                            color: 'white',
                            border: 'none',
                            borderRadius: '5px',
                            cursor: 'pointer',
                            fontSize: '14px'
                        }}
                    >
                        🔄 Replay Animation
                    </button>
                </div>
                <Link to="/" style={{
                    padding: '10px 20px',
                    background: '#ffd700',
                    color: 'black',
                    textDecoration: 'none',
                    borderRadius: '5px',
                    fontWeight: 'bold'
                }}>
                    ← Back to Reel
                </Link>
            </div>

            <div style={{
                flex: 1,
                width: '100%',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                overflow: 'hidden'
            }}>
                <canvas
                    ref={canvasRef}
                    style={{
                        height: '90%',
                        aspectRatio: '9/16',
                        background: '#000',
                        boxShadow: '0 0 50px rgba(0,0,0,0.5)',
                        borderRadius: '5px'
                    }}
                />
                {!imagesLoaded && (
                    <div style={{ position: 'absolute' }}>Loading Assets...</div>
                )}
            </div>
        </div>
    )
}

export default DesignPreview
