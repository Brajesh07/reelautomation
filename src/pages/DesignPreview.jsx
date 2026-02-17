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

// Zodiac Imports
import aries from '../images/Aires.png' // Typo in filename
import taurus from '../images/Taurus.png'
import gemini from '../images/Gemini.png'
import cancer from '../images/Cancer.png'
import leo from '../images/Leo.png'
import virgo from '../images/Virgo.png'
import libra from '../images/Libra.png'
import scorpio from '../images/Virgo-1.png' // Using Virgo-1 as Scorpio based on file analysis
import sagittarius from '../images/Sagittarius.png'
import capricorn from '../images/Capricorn.png'
import aquarius from '../images/Aquarius.png'
import pisces from '../images/Pisces.png'

const decorativeSources = [heart, trophy, moneyBag, crystalBall]

const zodiacIcons = {
    'Aries': aries,
    'Taurus': taurus,
    'Gemini': gemini,
    'Cancer': cancer,
    'Leo': leo,
    'Virgo': virgo,
    'Libra': libra,
    'Scorpio': scorpio,
    'Sagittarius': sagittarius,
    'Capricorn': capricorn,
    'Aquarius': aquarius,
    'Pisces': pisces
}

const DesignPreview = () => {
    const canvasRef = useRef(null)
    const [imagesLoaded, setImagesLoaded] = useState(false)
    const imagesRef = useRef([])
    const zodiacIconsRef = useRef({}) // Store all loaded zodiac icons
    const [zodiacs, setZodiacs] = useState([])
    const [currentIndex, setCurrentIndex] = useState(0)
    const timelineRef = useRef(null)

    // Fetch dynamic data
    // Fetch dynamic data
    useEffect(() => {
        fetch('/data.json')
            .then(res => res.json())
            .then(data => {
                if (data.zodiacs && data.zodiacs.length > 0) {
                    setZodiacs(data.zodiacs)
                }
            })
            .catch(err => console.error("Error fetching data.json:", err))
    }, [])

    // Load Decorative Images and Zodiac Icon
    // Load Decorative Images and Zodiac Icons
    useEffect(() => {
        if (zodiacs.length === 0) return

        let loadedCount = 0
        // We need to load decorative images + unique zodiac icons for the data
        const uniqueZodiacNames = [...new Set(zodiacs.map(z => z.name))]
        const totalImages = decorativeSources.length + uniqueZodiacNames.length

        // Load decorative images
        const loadedDeco = new Array(decorativeSources.length)
        decorativeSources.forEach((src, index) => {
            const img = new Image()
            img.src = src
            img.onload = () => {
                loadedDeco[index] = img
                loadedCount++
                if (loadedCount === totalImages) {
                    imagesRef.current = loadedDeco
                    setImagesLoaded(true)
                }
            }
        })

        // Load zodiac icons for all entries
        uniqueZodiacNames.forEach(name => {
            const img = new Image()
            const iconSrc = zodiacIcons[name] || zodiacIcons['Leo']
            img.src = iconSrc
            img.onload = () => {
                zodiacIconsRef.current[name] = img
                loadedCount++
                if (loadedCount === totalImages) {
                    imagesRef.current = loadedDeco // Ensure deco images are set
                    setImagesLoaded(true)
                }
            }
        })
    }, [zodiacs])

    // Animation Logic
    // Animation Logic
    // Animation State (Ref to persist across renders/indexes)
    // We only initialize this once
    const animStateRef = useRef({
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
        // Sections animation state
        sections: [
            { id: 'love', title: 'LOVE', opacity: 0, yOffset: 20, mask: 0, showLabel: false, showContent: false },
            { id: 'career', title: 'CAREER', opacity: 0, yOffset: 20, mask: 0, showLabel: false, showContent: false },
            { id: 'money', title: 'MONEY', opacity: 0, yOffset: 20, mask: 0, showLabel: false, showContent: false },
            { id: 'soul', title: 'SOUL MESSAGE', opacity: 0, yOffset: 20, mask: 0, showLabel: false, showContent: false }
        ]
    })

    // Animation Logic
    useEffect(() => {
        if (!imagesLoaded || zodiacs.length === 0) return

        const currentZodiacData = zodiacs[currentIndex]
        const currentZodiacIcon = zodiacIconsRef.current[currentZodiacData.name]

        const canvas = canvasRef.current
        if (!canvas) return
        const ctx = canvas.getContext('2d')
        canvas.width = 1080
        canvas.height = 1920

        const animState = animStateRef.current

        // RESET ZODIAC-SPECIFIC STATE (keep deco state as is)
        animState.zodiacX = -300
        animState.zodiacRotation = -360
        animState.zodiacOpacity = 0
        animState.zodiacName = ''
        animState.showName = false
        animState.vibeText = ''
        animState.showVibe = false
        animState.sections.forEach(s => {
            s.opacity = 0
            s.yOffset = 20
            s.mask = 0
            s.showLabel = false
            s.showContent = false
        })

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
                    icon: currentZodiacIcon,
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

                const sectionsData = animState.sections.map(sectionState => {
                    let text = ""
                    if (sectionState.id === 'love') text = currentZodiacData.love
                    else if (sectionState.id === 'career') text = currentZodiacData.career
                    else if (sectionState.id === 'money') text = currentZodiacData.money
                    else if (sectionState.id === 'soul') text = currentZodiacData.soulMessage

                    return {
                        title: sectionState.title,
                        text: text || "",
                        anim: {
                            labelOpacity: sectionState.opacity,
                            labelYOffset: sectionState.yOffset,
                            maskProgress: sectionState.mask,
                            showLabel: sectionState.showLabel,
                            showContent: sectionState.showContent
                        }
                    }
                })

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
                    sections: sectionsData
                })
            }
        })
        timelineRef.current = tl

        // Initial State
        // Initial State (Zodiac only, Deco persists)
        tl.set(animState, {
            zodiacX: -300,
            zodiacRotation: -360,
            zodiacOpacity: 0,
            showName: false,
            showVibe: false
        })

        // Phase 1: Decorative Images Fade-Up Animation (ONLY IF FIRST RUN)
        if (currentIndex === 0) {
            tl.to(animState, {
                decoY: 0,
                decoOpacity: 0.4,
                duration: 1.5,
                ease: "power2.out"
            })
        } else {
            // Ensure they are visible if we jumped here
            animState.decoY = 0
            animState.decoOpacity = 0.4
        }

        // Phase 2: Zodiac Icon Slide-In with Rotation and Fade (1.5-3s)
        tl.to(animState, {
            zodiacX: 0,
            zodiacRotation: 0,
            zodiacOpacity: 1,
            duration: 1.5,
            ease: "power2.out"
        }, "+=0")

        // Phase 3: Zodiac Name Typewriter Reveal
        const zodiacNameFull = (currentZodiacData.name || "LEO").toUpperCase()

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
        const vibeTextFull = "Vibe: " + (currentZodiacData.vibe || "")

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

        // Phase 5: Fade-Up & Mask Reveal for All Sections
        // We'll stagger them
        animState.sections.forEach((section, index) => {
            // Delay based on index
            const labelDelay = index === 0 ? "+=0.3" : "-=0.8" // Overlap subsequent sections

            // 5a. Label Fade Up
            tl.set(section, { showLabel: true }, labelDelay)
            tl.to(section, {
                opacity: 1,
                yOffset: 0,
                duration: 0.8,
                ease: "power2.out"
            })

            // 5b. Content Mask Reveal
            tl.set(section, { showContent: true }, "-=0.4") // Start mask before label finishes
            tl.to(section, {
                mask: 1,
                duration: 1.2,
                ease: "power1.inOut"
            })
        })

        // Phase 6: Hold and Transition
        tl.to({}, { duration: 5 }) // Hold for 5 seconds

        const isLastZodiac = currentIndex === zodiacs.length - 1

        if (!isLastZodiac) {
            // TRANSITION TO NEXT ZODIAC
            // animate current zodiac out
            tl.to(animState, {
                zodiacOpacity: 0,
                duration: 1,
                ease: "power2.in"
            }, "exit")

            // fade out sections
            animState.sections.forEach(section => {
                tl.to(section, {
                    opacity: 0,
                    mask: 0,
                    duration: 0.8
                }, "exit")
            })

            tl.to(animState, {
                showVibe: false,
                duration: 0.5
            }, "exit+=0.5")

            tl.call(() => {
                setCurrentIndex(prev => prev + 1)
            })
        } else {
            // FINAL EXIT (Blackout)
            // Fade EVERYTHING out including decorative elements
            tl.to(animState, {
                decoOpacity: 0, // Fade out bottom elements
                zodiacOpacity: 0,
                duration: 2,
                ease: "power2.inOut"
            }, "finalExit")

            animState.sections.forEach(section => {
                tl.to(section, {
                    opacity: 0,
                    mask: 0,
                    duration: 1
                }, "finalExit")
            })

            tl.to(animState, {
                showVibe: false,
                showName: false,
                duration: 1
            }, "finalExit")
        }

        return () => {
            tl.kill()
        }
    }, [imagesLoaded, zodiacs, currentIndex])

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
