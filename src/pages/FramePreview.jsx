import React, { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import gsap from 'gsap'
import { renderIntroFrame } from '../components/IntroFrame'
import { renderDraftFrame } from '../components/DraftFrame'
import { renderOutroFrame } from '../components/OutroFrame'
import { createZodiacTimeline } from '../components/ZodiacFrame'
import { formatDate } from '../utils/dateFormatter'

// Import Images (Similar to DesignPreview, but we only need a subset for preview if optimized, 
// but easier to copy the load logic to ensure all assets are available)
import heart from '../images/heart.png'
import trophy from '../images/trophy.png'
import moneyBag from '../images/money-bag.png'
import crystalBall from '../images/crystal-ball.png'

import aries from '../images/aries.png'
import taurus from '../images/taurus.png'
import gemini from '../images/gemini.png'
import cancer from '../images/cancer.png'
import leo from '../images/leo.png'
import virgo from '../images/virgo.png'
import libra from '../images/libra.png'
import scorpio from '../images/scorpio.png'
import sagittarius from '../images/sagittarius.png'
import capricorn from '../images/capricorn.png'
import aquarius from '../images/aquarius.png'
import pisces from '../images/pisces.png'

const decorativeSources = [heart, trophy, moneyBag, crystalBall]

// All 12 zodiac icons in standard order for intro ring
const zodiacIconsArray = [aries, taurus, gemini, cancer, leo, virgo, libra, scorpio, sagittarius, capricorn, aquarius, pisces]

const zodiacIcons = {
    'Aries': aries, 'Taurus': taurus, 'Gemini': gemini, 'Cancer': cancer,
    'Leo': leo, 'Virgo': virgo, 'Libra': libra, 'Scorpio': scorpio,
    'Sagittarius': sagittarius, 'Capricorn': capricorn, 'Aquarius': aquarius, 'Pisces': pisces
}

const FramePreview = () => {
    const canvasRef = useRef(null)
    const [imagesLoaded, setImagesLoaded] = useState(false)
    const [zodiacs, setZodiacs] = useState([])
    const imagesRef = useRef([])          // For decorative images
    const zodiacIconsRef = useRef({})     // For Zodiac DraftFrame (object)
    const zodiacRingRef = useRef([])      // For Intro ring (array of 12)
    const timelineRef = useRef(null)

    // UI State
    const [selectedFrame, setSelectedFrame] = useState(null) // 'intro' | 'zodiac' | 'outro'

    // 1. Fetch Data
    useEffect(() => {
        const customData = localStorage.getItem('customZodiacData')
        if (customData) {
            try {
                const parsed = JSON.parse(customData)
                if (parsed.zodiacs) setZodiacs(parsed.zodiacs)
                console.log('FramePreview: Loaded custom zodiac data')
            } catch (e) {
                console.error('FramePreview: Failed to parse custom data', e)
                fetch('/data.json')
                    .then(res => res.json())
                    .then(data => {
                        if (data.zodiacs) setZodiacs(data.zodiacs)
                    })
                    .catch(err => console.error(err))
            }
        } else {
            fetch('/data.json')
                .then(res => res.json())
                .then(data => {
                    if (data.zodiacs) setZodiacs(data.zodiacs)
                })
                .catch(err => console.error(err))
        }
    }, [])

    // 2. Load Assets
    useEffect(() => {
        if (zodiacs.length === 0) return

        let loadedCount = 0
        const uniqueZodiacNames = [...new Set(zodiacs.map(z => z.name))]
        // Total: decorative + unique zodiacs + all 12 for ring
        const totalImages = decorativeSources.length + uniqueZodiacNames.length + zodiacIconsArray.length

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

        // Load zodiac icons for DraftFrame (object by name)
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

        // Load all 12 zodiac icons for IntroFrame ring (array)
        const loadedRing = new Array(zodiacIconsArray.length)
        zodiacIconsArray.forEach((src, index) => {
            const img = new Image()
            img.src = src
            img.onload = () => {
                loadedRing[index] = img
                loadedCount++
                if (loadedCount === totalImages) {
                    imagesRef.current = loadedDeco
                    zodiacRingRef.current = loadedRing
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

        // Read font config saved from /design
        let fontConfig = {}
        try {
            const saved = localStorage.getItem('fontConfig')
            if (saved) fontConfig = JSON.parse(saved)
        } catch { /* use defaults */ }

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
                    images: zodiacRingRef.current,
                    highlightedNames: highlightedNames,
                    textData
                }, fontConfig)
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
                l5: formatDate(new Date())
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
        // ZODIAC ANIMATION (All Zodiacs — Sequential)
        // ----------------------------------------------------------------
        else if (selectedFrame === 'zodiac') {
            zodiacs.forEach((zodiac, index) => {
                const isFirst = index === 0
                const isLast = index === zodiacs.length - 1
                const icon = zodiacIconsRef.current[zodiac.name] || zodiacIconsRef.current['Leo']

                const zodiacTL = createZodiacTimeline(ctx, zodiac, {
                    decorative: imagesRef.current,
                    icon
                }, { isFirst, isLast, fontSizes: fontConfig })

                tl.add(zodiacTL)
            })
        }

        // ----------------------------------------------------------------
        // OUTRO ANIMATION
        // ----------------------------------------------------------------
        else if (selectedFrame === 'outro') {
            const outroState = {
                opacity: 0,
                rotation: -60, // Match Intro initial
                scale: 0,      // Match Intro initial
                text1: '',
                boxWidth: 0
            }

            const updateOutro = () => {
                // Intro and Outro both need the ring images
                // Ensure we pass them
                renderOutroFrame(ctx, {
                    opacity: outroState.opacity,
                    rotation: outroState.rotation,
                    scale: outroState.scale,
                    text1: outroState.text1,
                    boxWidth: outroState.boxWidth,
                    images: zodiacRingRef.current
                }, fontConfig)
            }

            // 1. Enter (Scale/Rotate) - Match Intro Logic
            tl.to(outroState, {
                scale: 1,
                opacity: 1,
                rotation: 120,
                duration: 3.5,
                ease: "power2.out",
                onUpdate: updateOutro
            })

            // 2. Text (Typewriter)
            const fullText = "Want a personalised reading?"
            const textCounter = { val: 0 }
            tl.to(textCounter, {
                val: fullText.length,
                duration: fullText.length * 0.05,
                ease: "none",
                onUpdate: () => {
                    outroState.text1 = fullText.substring(0, Math.ceil(textCounter.val))
                    updateOutro()
                }
            })

            // 3. Yellow Box Reveal
            tl.to(outroState, {
                boxWidth: 100,
                duration: 1.5,
                ease: "power2.out",
                onUpdate: updateOutro
            })

            // 4. Hold
            tl.to({}, { duration: 2 })

            // 5. Exit
            tl.to(outroState, {
                opacity: 0,
                duration: 1.5,
                ease: "power2.inOut",
                onUpdate: updateOutro
            })
        }

        return () => {
            tl.kill()
        }

    }, [imagesLoaded, selectedFrame, zodiacs])

    return (
        <div className='relative flex items-start py-20 gap-3'>
            <div className='w-fit bg-black bg-opacity-90 p-5 rounded-lg text-white sticky top-5'>
                <div className='flex gap-4 mb-5 items-center p-4 rounded-lg'>
                    <label className='text-gray-400 mr-2.5'>Select Frame:</label>
                    <select
                        value={selectedFrame || ''}
                        onChange={(e) => setSelectedFrame(e.target.value)}
                        className='py-2.5 px-2.5 rounded bg-[#222] text-white border border-gray-600 text-base cursor-pointer hover:border-gray-500 transition-colors'
                    >
                        <option value="" disabled>-- Choose Animation --</option>
                        <option value="intro">Intro Frame</option>
                        <option value="zodiac">Zodiac Sequence (All)</option>
                        <option value="outro">Outro Frame</option>
                    </select>
                </div>
                <div className='mt-5'>
                    <Link to="/reel-canvas">
                        <button className='bg-[#DAC477] text-black border-none py-4 px-8 text-lg font-bold rounded-lg cursor-pointer hover:bg-[#c5b46a] transition-colors'>
                            Go to Recording ➡️
                        </button>
                    </Link>
                </div>
            </div>

            <div className='border-none overflow-hidden bg-black' style={{ width: '405px', height: '720px', boxShadow: '0 0 20px rgba(0,0,0,0.5)' }}>
                <canvas ref={canvasRef} className='block' style={{ width: '405px', height: '720px' }} />
            </div>

            {!imagesLoaded && <div className='text-white mt-2.5'>Loading Assets...</div>}
        </div>
    )
}

export default FramePreview