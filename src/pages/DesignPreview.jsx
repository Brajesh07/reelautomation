import React, { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import gsap from 'gsap'
import { renderDraftFrame } from '../frames/DraftFrame'


// Assuming Virgo-1 might be Scorpio or a placeholder, using it to fill the gap
// If Scorpio is missing, we might need to duplicate or use a placeholder

import heart from '../images/heart.png'
import trophy from '../images/trophy.png'
import moneyBag from '../images/money-bag.png'
import crystalBall from '../images/crystal-ball.png'
import leo from '../images/Leo.png'

const decorativeSources = [heart, trophy, moneyBag, crystalBall]
const zodiacSource = leo

const DesignPreview = () => {
    const canvasRef = useRef(null)
    const [imagesLoaded, setImagesLoaded] = useState(false)
    const imagesRef = useRef([])
    const zodiacIconRef = useRef(null)
    const [zodiacData, setZodiacData] = useState(null)
    const timelineRef = useRef(null)

    // Fetch dynamic data
    useEffect(() => {
        fetch('/data.json')
            .then(res => res.json())
            .then(data => {
                if (data.zodiacs && data.zodiacs.length > 0) {
                    setZodiacData(data.zodiacs[0]) // Using the first zodiac for preview
                }
            })
            .catch(err => console.error("Error fetching data.json:", err))
    }, [])

    // Load Decorative Images and Zodiac Icon
    useEffect(() => {
        if (!zodiacData) return

        let loadedCount = 0
        const totalImages = decorativeSources.length + 1 // +1 for zodiac icon
        const loadedImages = new Array(decorativeSources.length)

        // Load decorative images
        decorativeSources.forEach((src, index) => {
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

        // Load zodiac icon
        // We'll use Leo for now, or match it to the JSON if possible
        const zodiacImg = new Image()
        zodiacImg.src = zodiacSource
        zodiacImg.onload = () => {
            zodiacIconRef.current = zodiacImg
            loadedCount++
            if (loadedCount === totalImages) {
                imagesRef.current = loadedImages
                setImagesLoaded(true)
            }
        }
    }, [zodiacData])

    // Animation Logic
    useEffect(() => {
        if (!imagesLoaded || !zodiacData) return

        const canvas = canvasRef.current
        if (!canvas) return
        const ctx = canvas.getContext('2d')
        canvas.width = 1080
        canvas.height = 1920

        // Animation State
        const animState = {
            decoY: 100,      // Start 100px below final position
            decoOpacity: 0,  // Start invisible
            // Zodiac animation
            zodiacX: -300,   // Start off-screen to the left
            zodiacRotation: -360, // Start rotated backward
            zodiacOpacity: 0,
            zodiacName: '',
            showName: false,
            // Vibe text animation
            vibeText: '',
            showVibe: false,
            // Love section animation
            loveLabelOpacity: 0,
            loveLabelYOffset: 20,
            loveMaskProgress: 0,
            showLoveLabel: false,
            showLoveContent: false
        }

        // Create Timeline
        const tl = gsap.timeline({
            repeat: 0,
            onUpdate: () => {
                // Clear canvas
                ctx.fillStyle = '#000000'
                ctx.fillRect(0, 0, canvas.width, canvas.height)

                const decorativeAnim = {
                    opacity: animState.decoOpacity,
                    yOffset: animState.decoY,
                    images: imagesRef.current
                }

                const zodiacAnim = {
                    icon: zodiacIconRef.current,
                    xOffset: animState.zodiacX,
                    rotation: animState.zodiacRotation,
                    opacity: animState.zodiacOpacity,
                    name: animState.zodiacName,
                    showName: animState.showName
                }

                const vibeAnim = {
                    text: animState.vibeText,
                    showVibe: animState.showVibe
                }

                const loveAnim = {
                    text: zodiacData.love || "",
                    labelOpacity: animState.loveLabelOpacity,
                    labelYOffset: animState.loveLabelYOffset,
                    maskProgress: animState.loveMaskProgress,
                    showLabel: animState.showLoveLabel,
                    showContent: animState.showLoveContent
                }

                renderDraftFrame(ctx, {
                    scale: 0,
                    rotation: 0,
                    opacity: 0,
                    images: [],
                    highlightedNames: [],
                    textData: null,
                    decorativeAnim: decorativeAnim,
                    zodiacAnim: zodiacAnim,
                    vibeAnim: vibeAnim,
                    loveAnim: loveAnim
                })
            }
        })
        timelineRef.current = tl

        // Initial State
        tl.set(animState, {
            decoY: 100,
            decoOpacity: 0,
            zodiacX: -300,
            zodiacRotation: -360,
            zodiacOpacity: 0,
            showName: false,
            showVibe: false
        })

        // Phase 1: Decorative Images Fade-Up Animation (0-1.5s)
        tl.to(animState, {
            decoY: 0,
            decoOpacity: 0.4,  // Fade to 40% opacity
            duration: 1.5,
            ease: "power2.out"
        })

        // Phase 2: Zodiac Icon Slide-In with Rotation and Fade (1.5-3s)
        tl.to(animState, {
            zodiacX: 0,
            zodiacRotation: 0,
            zodiacOpacity: 1,
            duration: 1.5,
            ease: "power2.out"
        }, "+=0")

        // Phase 3: Zodiac Name Typewriter Reveal
        const zodiacNameFull = (zodiacData.name || "LEO").toUpperCase()

        // Enable name display
        tl.set(animState, { showName: true })

        // Typewriter effect
        const nameCounter = { value: 0 }
        tl.to(nameCounter, {
            value: zodiacNameFull.length,
            duration: zodiacNameFull.length * 0.1, // 0.1s per character
            ease: "none",
            onUpdate: () => {
                const count = Math.ceil(nameCounter.value)
                animState.zodiacName = zodiacNameFull.substring(0, count)
            }
        }, "+=0")

        // Phase 4: Vibe Text Typewriter Reveal
        const vibeTextFull = "Vibe: " + (zodiacData.vibe || "")

        // Enable vibe display after a short pause
        tl.set(animState, { showVibe: true }, "+=0.3")

        // Typewriter effect for vibe text
        const vibeCounter = { value: 0 }
        tl.to(vibeCounter, {
            value: vibeTextFull.length,
            duration: vibeTextFull.length * 0.05,
            ease: "none",
            onUpdate: () => {
                const count = Math.ceil(vibeCounter.value)
                animState.vibeText = vibeTextFull.substring(0, count)
            }
        }, "+=0")

        // Phase 5: Love Label Fade-Up (starts after vibe typewriter)
        tl.set(animState, { showLoveLabel: true }, "+=0.3")
        tl.to(animState, {
            loveLabelOpacity: 1,
            loveLabelYOffset: 0,
            duration: 0.8,
            ease: "power2.out"
        })

        // Phase 6: Love Content Mask Expansion (starts after label completes)
        tl.set(animState, { showLoveContent: true })
        tl.to(animState, {
            loveMaskProgress: 1,
            duration: 1.2,
            ease: "power1.inOut"
        })

        return () => {
            tl.kill()
        }
    }, [imagesLoaded, zodiacData])

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
