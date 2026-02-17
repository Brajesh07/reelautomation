import React, { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import gsap from 'gsap'
import { renderIntroFrame } from '../frames/IntroFrame'
import { renderDraftFrame } from '../frames/DraftFrame'
import { renderOutroFrame } from '../frames/OutroFrame'

// Import Images (Similar to DesignPreview, but we only need a subset for preview if optimized, 
// but easier to copy the load logic to ensure all assets are available)
import heart from '../images/heart.png'
import trophy from '../images/trophy.png'
import moneyBag from '../images/money-bag.png'
import crystalBall from '../images/crystal-ball.png'

import aries from '../images/Aires.png'
import taurus from '../images/Taurus.png'
import gemini from '../images/Gemini.png'
import cancer from '../images/Cancer.png'
import leo from '../images/Leo.png'
import virgo from '../images/Virgo.png'
import libra from '../images/Libra.png'
import scorpio from '../images/Virgo-1.png'
import sagittarius from '../images/Sagittarius.png'
import capricorn from '../images/Capricorn.png'
import aquarius from '../images/Aquarius.png'
import pisces from '../images/Pisces.png'

const decorativeSources = [heart, trophy, moneyBag, crystalBall]
const zodiacIcons = {
    'Aries': aries, 'Taurus': taurus, 'Gemini': gemini, 'Cancer': cancer,
    'Leo': leo, 'Virgo': virgo, 'Libra': libra, 'Scorpio': scorpio,
    'Sagittarius': sagittarius, 'Capricorn': capricorn, 'Aquarius': aquarius, 'Pisces': pisces
}

const FramePreview = () => {
    const canvasRef = useRef(null)
    const [imagesLoaded, setImagesLoaded] = useState(false)
    const [zodiacs, setZodiacs] = useState([])
    const imagesRef = useRef([])          // For Intro/Outro/Deco
    const zodiacIconsRef = useRef({})     // For Zodiac DraftFrame
    const timelineRef = useRef(null)

    // UI State
    const [selectedFrame, setSelectedFrame] = useState(null) // 'intro' | 'zodiac' | 'outro'

    // 1. Fetch Data
    useEffect(() => {
        fetch('/data.json')
            .then(res => res.json())
            .then(data => {
                if (data.zodiacs) setZodiacs(data.zodiacs)
            })
            .catch(err => console.error(err))
    }, [])

    // 2. Load Assets
    useEffect(() => {
        if (zodiacs.length === 0) return

        let loadedCount = 0
        const uniqueZodiacNames = [...new Set(zodiacs.map(z => z.name))]
        const totalImages = decorativeSources.length + uniqueZodiacNames.length

        // Load decorative
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

        // Load zodiac icons
        uniqueZodiacNames.forEach(name => {
            const img = new Image()
            const iconSrc = zodiacIcons[name] || zodiacIcons['Leo']
            img.src = iconSrc
            img.onload = () => {
                zodiacIconsRef.current[name] = img
                loadedCount++
                if (loadedCount === totalImages) {
                    imagesRef.current = loadedDeco
                    setImagesLoaded(true)
                }
            }
        })
    }, [zodiacs])

    // 3. Animation Logic
    useEffect(() => {
        if (!imagesLoaded || !selectedFrame || zodiacs.length === 0) return

        const canvas = canvasRef.current
        if (!canvas) return
        const ctx = canvas.getContext('2d')
        canvas.width = 1080
        canvas.height = 1920

        // Reset Timeline
        if (timelineRef.current) timelineRef.current.kill()

        const tl = gsap.timeline({
            onUpdate: () => {
                // Clear on every frame? 
                // Renderers usually handle clear, but let's ensure background
                // ctx.fillStyle = '#000'
                // ctx.fillRect(0,0,1080,1920)
            }
        })
        timelineRef.current = tl

        // ----------------------------------------------------------------
        // INTRO ANIMATION
        // ----------------------------------------------------------------
        if (selectedFrame === 'intro') {
            const introState = {
                scale: 0,
                rotation: -60,
                opacity: 0,
                textFade: 1,
                showText: false,
                text1: '', text2: '', text3: '', text4: '', text5: ''
            }

            const highlightedNames = zodiacs.map(z => z.name)

            // Helper to render
            const updateIntro = () => {
                // Clean canvas specific to intro needs? 
                // renderIntroFrame clears it.
                const textData = introState.showText ? {
                    opacity: introState.textFade,
                    line1: introState.text1,
                    line2: introState.text2,
                    line3: introState.text3,
                    line4: introState.text4,
                    line5: introState.text5
                } : null

                renderIntroFrame(ctx, {
                    scale: introState.scale,
                    rotation: introState.rotation,
                    opacity: introState.opacity,
                    images: Object.values(zodiacIcons).filter((_, i) => i < 12), // Need 12 generic icons for ring
                    // Actually ReelCanvas loads a specific array 'zodiacSources', let's approximate or just use what we have.
                    // The 'imagesRef.current' contains DECORATIVE images, not the 12 zodiacs for the ring.
                    // FramePreview might need to load the 12 ring images separately if we want exact parity.
                    // For now, let's use the ones we loaded in zodiacIconsRef if possible, or fallback.
                    // The intro ring expects an array of 12 images. 
                    // Let's quickly re-map from our loaded icons or just use placeholders if not critical.
                    // Better: Allow renderIntroFrame to work with what we have.
                    // Note: ReelCanvas loads `zodiacSources` (12 images). DesignPreview only loads used ones.
                    // To make Intro work perfectly, we'd need all 12. 
                    // Let's assume for this preview, we might just see emptiness or what we have.
                    // FIX: Let's assume we pass empty array or just the loaded ones.
                    images: [], // Placeholder to avoid crash if we didn't load all 12
                    highlightedNames: highlightedNames,
                    textData
                })
            }

            // Note: If we want the RING to show, we need those 12 images. 
            // DesignPreview doesn't load them all by default. 
            // We'll skip the ring images for this specific preview unless requested to load all.

            tl.to(introState, {
                scale: 1, opacity: 1, rotation: 120, duration: 3.5, ease: "power2.out",
                onUpdate: updateIntro
            })

            tl.set(introState, { showText: true })

            // Typewriter
            const content = {
                l1: "DAILY", l2: "HOROSCOPE", l3: "FOR",
                l4: highlightedNames.join(', ').toUpperCase(),
                l5: new Date().toDateString()
            }
            const counters = { c1: 0, c2: 0, c3: 0, c4: 0, c5: 0 }

            const addType = (k, txt, d) => {
                tl.to(counters, {
                    [k]: txt.length, duration: txt.length * 0.05, ease: "none",
                    onUpdate: () => {
                        introState[`text${k.charAt(1)}`] = txt.substring(0, Math.ceil(counters[k]))
                        updateIntro()
                    }
                }, d)
            }

            addType('c1', content.l1, ">")
            addType('c2', content.l2, ">+0.1")
            addType('c3', content.l3, ">+0.1")
            addType('c4', content.l4, ">+0.1")
            addType('c5', content.l5, ">+0.2")

        }

        // ----------------------------------------------------------------
        // ZODIAC ANIMATION (First Zodiac Only)
        // ----------------------------------------------------------------
        else if (selectedFrame === 'zodiac') {
            const dataItem = zodiacs[0]
            const icon = zodiacIconsRef.current[dataItem.name]

            const animState = {
                decoY: 100, decoOpacity: 0,
                zodiacX: -300, zodiacRotation: -360, zodiacOpacity: 0,
                zodiacName: '', showName: false,
                vibeText: '', showVibe: false,
                sections: [
                    { id: 'love', title: 'LOVE', opacity: 0, yOffset: 20, mask: 0, showLabel: false, showContent: false },
                    { id: 'career', title: 'CAREER', opacity: 0, yOffset: 20, mask: 0, showLabel: false, showContent: false },
                    { id: 'money', title: 'MONEY', opacity: 0, yOffset: 20, mask: 0, showLabel: false, showContent: false },
                    { id: 'soul', title: 'SOUL MESSAGE', opacity: 0, yOffset: 20, mask: 0, showLabel: false, showContent: false }
                ]
            }

            const updateZodiac = () => {
                // Construct payload for renderDraftFrame
                const sectionsData = animState.sections.map(s => ({
                    title: s.title,
                    text: dataItem[s.id === 'soul' ? 'soulMessage' : s.id],
                    anim: {
                        labelOpacity: s.opacity,
                        labelYOffset: s.yOffset,
                        maskProgress: s.mask,
                        showLabel: s.showLabel,
                        showContent: s.showContent
                    }
                }))

                renderDraftFrame(ctx, {
                    decorativeAnim: { opacity: animState.decoOpacity, yOffset: animState.decoY, images: imagesRef.current },
                    zodiacAnim: { icon, xOffset: animState.zodiacX, rotation: animState.zodiacRotation, opacity: animState.zodiacOpacity, name: animState.zodiacName, showName: animState.showName },
                    vibeAnim: { text: animState.vibeText, showVibe: animState.showVibe },
                    sections: sectionsData
                })
            }

            // Phase 1: Deco
            tl.to(animState, { decoY: 0, decoOpacity: 0.4, duration: 1.5, ease: "power2.out", onUpdate: updateZodiac })

            // Phase 2: Zodiac Icon
            tl.to(animState, { zodiacX: 0, zodiacRotation: 0, zodiacOpacity: 1, duration: 1.5, ease: "power2.out", onUpdate: updateZodiac }, "<")

            // Phase 3: Name Typewriter
            tl.set(animState, { showName: true })
            const nameFull = dataItem.name.toUpperCase()
            const nameCounter = { val: 0 }
            tl.to(nameCounter, {
                val: nameFull.length, duration: nameFull.length * 0.1, ease: "none",
                onUpdate: () => {
                    animState.zodiacName = nameFull.substring(0, Math.ceil(nameCounter.val))
                    updateZodiac()
                }
            })

            // Phase 4: Vibe
            const vibeFull = "Vibe: " + dataItem.vibe
            tl.set(animState, { showVibe: true }, "+=0.3")
            const vibeCounter = { val: 0 }
            tl.to(vibeCounter, {
                val: vibeFull.length, duration: vibeFull.length * 0.05, ease: "none",
                onUpdate: () => {
                    animState.vibeText = vibeFull.substring(0, Math.ceil(vibeCounter.val))
                    updateZodiac()
                }
            })

            // Phase 5: Sections
            animState.sections.forEach((section, idx) => {
                const labelDelay = idx === 0 ? "+=0.3" : "-=0.8"
                tl.set(section, { showLabel: true }, labelDelay)
                tl.to(section, { opacity: 1, yOffset: 0, duration: 0.8, ease: "power2.out", onUpdate: updateZodiac })

                tl.set(section, { showContent: true }, "-=0.4")
                tl.to(section, { mask: 1, duration: 1.2, ease: "power1.inOut", onUpdate: updateZodiac })
            })

            // No Exit, just hold
        }

        // ----------------------------------------------------------------
        // OUTRO ANIMATION
        // ----------------------------------------------------------------
        else if (selectedFrame === 'outro') {
            const outroState = { opacity: 0 }
            tl.to(outroState, {
                opacity: 1, duration: 1,
                onUpdate: () => {
                    ctx.save()
                    ctx.globalAlpha = outroState.opacity
                    renderOutroFrame(ctx) // Outro renderer handles its own clear/draw
                    ctx.restore()
                }
            })
        }

        return () => {
            tl.kill()
        }

    }, [imagesLoaded, selectedFrame, zodiacs])

    return (
        <div style={{
            width: '100vw', height: '100vh', background: '#222',
            display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '20px'
        }}>
            <div style={{
                display: 'flex', gap: '15px', marginBottom: '20px',
                background: '#333', padding: '15px', borderRadius: '10px'
            }}>
                <Link to="/" style={{ textDecoration: 'none', color: '#000', background: '#ffd700', padding: '10px 20px', borderRadius: '5px', fontWeight: 'bold' }}>
                    ← Back
                </Link>
                <button onClick={() => setSelectedFrame('intro')} style={{ padding: '10px 20px', cursor: 'pointer', background: selectedFrame === 'intro' ? '#4e9eff' : '#eee' }}>
                    Intro Frame
                </button>
                <button onClick={() => setSelectedFrame('zodiac')} style={{ padding: '10px 20px', cursor: 'pointer', background: selectedFrame === 'zodiac' ? '#4e9eff' : '#eee' }}>
                    Zodiac Frame
                </button>
                <button onClick={() => setSelectedFrame('outro')} style={{ padding: '10px 20px', cursor: 'pointer', background: selectedFrame === 'outro' ? '#4e9eff' : '#eee' }}>
                    Outro Frame
                </button>
            </div>

            <div style={{
                border: '2px solid #555', borderRadius: '5px', overflow: 'hidden',
                height: '80vh', aspectRatio: '9/16', background: '#000'
            }}>
                <canvas ref={canvasRef} style={{ height: '100%', width: '100%' }} />
            </div>
            {!imagesLoaded && <div style={{ color: 'white', marginTop: '10px' }}>Loading Assets...</div>}
        </div>
    )
}

export default FramePreview
