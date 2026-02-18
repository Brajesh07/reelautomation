import gsap from 'gsap'

/**
 * Render function for the Zodiac Frame (Production)
 * Copied and adapted from DraftFrame.js
 * @param {CanvasRenderingContext2D} ctx - The canvas context
 * @param {Object} data - The data object containing animation state and images
 */
export const renderZodiacFrame = (ctx, data = {}) => {
  const width = ctx.canvas.width
  const height = ctx.canvas.height
  const centerX = width / 2
  const centerY = height / 2

  // Default animation state
  const {
    scale = 1,
    rotation = 0,
    opacity = 1,
    images = [],
    highlightedNames = [] // Configurable highlighted names
  } = data

  // Clear canvas
  ctx.fillStyle = '#000000'
  ctx.fillRect(0, 0, width, height)

  // Decorative Images (Heart, Trophy, Coin Bag, Crystal Ball)
  const {
    opacity: decoOpacity = 1,
    yOffset = 0,
    images: decoImages = []
  } = data.decorativeAnim || {}

  if (decoImages && decoImages.length === 4) {
    const [heart, trophy, moneyBag, crystalBall] = decoImages

    // Positioning: Bottom of screen with safe margin
    const bottomMargin = 120
    const baseY = height - bottomMargin
    const decoY = baseY + yOffset

    ctx.save()
    ctx.globalAlpha = decoOpacity

    // Layout: Horizontal row, overlapping, centered as a group
    const iconSize = 400  // Large size
    const spacing = -100   // Negative spacing for overlap effect
    const totalWidth = (iconSize * 4) + (spacing * 3)
    const startX = centerX - (totalWidth / 2)

    // Heart (leftmost)
    if (heart) ctx.drawImage(heart, startX, decoY - iconSize / 2, iconSize, iconSize)

    // Trophy
    if (trophy) ctx.drawImage(trophy, startX + iconSize + spacing, decoY - iconSize / 2, iconSize, iconSize)

    // Money Bag
    if (moneyBag) ctx.drawImage(moneyBag, startX + (iconSize + spacing) * 2, decoY - iconSize / 2, iconSize, iconSize)

    // Crystal Ball (rightmost)
    if (crystalBall) ctx.drawImage(crystalBall, startX + (iconSize + spacing) * 3, decoY - iconSize / 2, iconSize, iconSize)

    ctx.restore()
  }


  // Zodiac Icon and Name
  const {
    icon = null,
    xOffset = 0,
    rotation: zodiacRotation = 0,
    opacity: zodiacOpacity = 1,
    name = '',
    showName = false
  } = data.zodiacAnim || {}

  if (icon) {
    const zodiacIconSize = 100  // Position of the icon and text X-axis
    const zodiacY = 200 // Position of the icon and text Y-axis
    const iconTextSpacing = 40 // Spacing between icon and text

    // Measure text width to calculate total group width
    ctx.save()
    ctx.font = 'bold 48px "Garamond", serif'
    const textWidth = name ? ctx.measureText(name).width : 0
    ctx.restore()

    // Calculate total width of icon + spacing + text
    const totalWidth = zodiacIconSize + (name ? iconTextSpacing + textWidth : 0)

    // Center the group horizontally
    const groupStartX = centerX - (totalWidth / 2) + xOffset
    const zodiacX = groupStartX

    ctx.save()
    ctx.globalAlpha = zodiacOpacity

    // Apply rotation around icon center
    ctx.translate(zodiacX + zodiacIconSize / 2, zodiacY + zodiacIconSize / 2)
    ctx.rotate((zodiacRotation * Math.PI) / 180)
    ctx.drawImage(icon, -zodiacIconSize / 2, -zodiacIconSize / 2, zodiacIconSize, zodiacIconSize)
    ctx.restore()

    // Zodiac Name (to the right of icon)
    if (showName && name) {
      ctx.save()
      ctx.globalAlpha = zodiacOpacity
      ctx.fillStyle = '#DAC477'
      ctx.font = 'bold 48px "Garamond", serif'
      ctx.textAlign = 'left'
      ctx.textBaseline = 'middle'

      const nameX = zodiacX + zodiacIconSize + iconTextSpacing
      const nameY = zodiacY + zodiacIconSize / 2

      ctx.fillText(name, nameX, nameY)
      ctx.restore()
    }
  }

  // Vibe Text (appears below zodiac name)
  const {
    text: vibeText = '',
    showVibe = false
  } = data.vibeAnim || {}

  if (showVibe && vibeText) {
    const vibeY = 400 // Increased from 300 to add more space above vibe text
    const vibeMaxWidth = 900 // Maximum width for text wrapping
    const vibeLineHeight = 50 // Line height for multi-line text

    ctx.save()
    ctx.fillStyle = '#FFFFFF'
    ctx.font = '36px "Garamond", serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'top'

    // Simple text wrapping
    const words = vibeText.split(' ')
    let lines = []
    let currentLine = ''

    words.forEach(word => {
      const testLine = currentLine ? currentLine + ' ' + word : word
      const metrics = ctx.measureText(testLine)

      if (metrics.width > vibeMaxWidth && currentLine) {
        lines.push(currentLine)
        currentLine = word
      } else {
        currentLine = testLine
      }
    })
    if (currentLine) lines.push(currentLine)

    // Render each line centered
    lines.forEach((line, index) => {
      ctx.fillText(line, centerX, vibeY + (index * vibeLineHeight))
    })

    ctx.restore()
  }

  // Generic Section Renderer
  const drawSection = (ctx, title, text, startY, options = {}) => {
    const {
      labelOpacity = 0,
      labelYOffset = 0,
      maskProgress = 0,
      showLabel = false,
      showContent = false
    } = options

    const boxWidth = 900
    const vertPadding = 30
    const horizPadding = 60
    const lineHeight = 44
    const titleHeight = 50 // Space for title
    const titleMargin = 30 // Space between title and box

    // 1. Section Title (Fade Up)
    if (showLabel) {
      ctx.save()
      ctx.globalAlpha = labelOpacity
      ctx.fillStyle = '#DAC477'
      ctx.font = 'bold 40px "Garamond", serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'top'
      ctx.fillText(title, centerX, startY + labelYOffset)
      ctx.restore()
    }

    const boxStartY = startY + titleHeight + titleMargin
    let dynamicBoxHeight = 0

    // 2. Section Content (Horizontal Mask Reveal)
    if (showContent && text) {
      ctx.save()
      // Apply opacity to the entire content block (container + text)
      // This ensures it fades out gracefully during exit
      ctx.globalAlpha = labelOpacity

      // Text Setup for measurement
      ctx.font = '500 32px "Garamond", serif'

      // Text Wrapping Calculation
      const words = text.split(' ')
      let lines = []
      let currentLine = ''

      words.forEach(word => {
        const testLine = currentLine ? currentLine + ' ' + word : word
        if (ctx.measureText(testLine).width > boxWidth - horizPadding * 1.5) {
          lines.push(currentLine)
          currentLine = word
        } else {
          currentLine = testLine
        }
      })
      if (currentLine) lines.push(currentLine)

      // Dynamic Box Height
      dynamicBoxHeight = (lines.length * lineHeight) + (vertPadding * 1.5)

      // Masking
      const maskWidth = boxWidth * maskProgress
      ctx.beginPath()
      ctx.rect(centerX - boxWidth / 2, boxStartY, maskWidth, dynamicBoxHeight)
      ctx.clip()

      // Draw Background Strip (Solid Highlight)
      ctx.fillStyle = '#DAC477'
      ctx.fillRect(centerX - boxWidth / 2, boxStartY, boxWidth, dynamicBoxHeight)

      // Draw Text (Solid Black)
      ctx.fillStyle = '#000000'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'top'

      lines.forEach((line, index) => {
        ctx.fillText(line, centerX, boxStartY + vertPadding + (index * lineHeight))
      })

      ctx.restore()
    } else {
      // Calculate height for layout purposes even if not shown
      ctx.save()
      ctx.font = '500 32px "Garamond", serif'
      const words = text.split(' ')
      let lines = []
      let currentLine = ''
      words.forEach(word => {
        const testLine = currentLine ? currentLine + ' ' + word : word
        if (ctx.measureText(testLine).width > boxWidth - horizPadding * 1.5) {
          lines.push(currentLine)
          currentLine = word
        } else {
          currentLine = testLine
        }
      })
      if (currentLine) lines.push(currentLine)
      dynamicBoxHeight = (lines.length * lineHeight) + (vertPadding * 1.5)
      ctx.restore()
    }

    // Return total height used by this section
    return titleHeight + titleMargin + dynamicBoxHeight + 50
  }

  // Dynamic Sections (Love, Career, Money, Soul)
  const sections = data.sections || []
  let currentY = 550 // Starting Y position (below Vibe text)

  sections.forEach(section => {
    const heightUsed = drawSection(
      ctx,
      section.title,
      section.text,
      currentY,
      section.anim // Animation state for this specific section
    )
    currentY += heightUsed
  })
}

/**
 * Creates a GSAP timeline for a single zodiac's full animation sequence.
 * This encapsulates the logic from DesignPreview.jsx.
 * 
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 * @param {Object} zodiacData - Data for the specific zodiac (name, vibe, love...)
 * @param {Object} resources - { decorative: [img...], icon: img }
 * @param {Object} options - { isFirst: boolean, isLast: boolean }
 * @returns {GSAPTimeline} - The GSAP timeline for this zodiac
 */
export const createZodiacTimeline = (ctx, zodiacData, resources, options = {}) => {
  const { isFirst = false, isLast = false } = options

  // Initial Animation State
  const animState = {
    decoY: isFirst ? 100 : 0,
    decoOpacity: isFirst ? 0 : 0.4,
    zodiacX: -300,
    zodiacRotation: -360,
    zodiacOpacity: 0,
    zodiacName: '',
    showName: false,
    vibeText: '',
    showVibe: false,
    sections: [
      { id: 'love', title: 'LOVE', text: zodiacData.love, opacity: 0, yOffset: 20, mask: 0, showLabel: false, showContent: false },
      { id: 'career', title: 'CAREER', text: zodiacData.career, opacity: 0, yOffset: 20, mask: 0, showLabel: false, showContent: false },
      { id: 'money', title: 'MONEY', text: zodiacData.money, opacity: 0, yOffset: 20, mask: 0, showLabel: false, showContent: false },
      { id: 'soul', title: 'SOUL MESSAGE', text: zodiacData.soulMessage, opacity: 0, yOffset: 20, mask: 0, showLabel: false, showContent: false }
    ]
  }

  const tl = gsap.timeline({
    onUpdate: () => {
      const sectionsData = animState.sections.map(s => ({
        title: s.title,
        text: s.text || "",
        anim: {
          labelOpacity: s.opacity,
          labelYOffset: s.yOffset,
          maskProgress: s.mask,
          showLabel: s.showLabel,
          showContent: s.showContent
        }
      }))

      renderZodiacFrame(ctx, {
        decorativeAnim: {
          opacity: animState.decoOpacity,
          yOffset: animState.decoY,
          images: resources.decorative
        },
        zodiacAnim: {
          icon: resources.icon,
          xOffset: animState.zodiacX,
          rotation: animState.zodiacRotation,
          opacity: animState.zodiacOpacity,
          name: animState.zodiacName,
          showName: animState.showName
        },
        vibeAnim: {
          text: animState.vibeText,
          showVibe: animState.showVibe
        },
        sections: sectionsData
      })
    }
  })

  // --- Strict Timing Implementation (Total 13s) ---

  // 1. Icon Entry (0s -> 1.5s)
  const entryDuration = 1.5

  if (isFirst) {
    tl.to(animState, { decoY: 0, decoOpacity: 0.4, duration: entryDuration, ease: "power2.out" }, 0)
  }

  const iconStart = isFirst ? 0 : 0 // Always start at 0 relative to timeline start
  tl.to(animState, {
    zodiacX: 0,
    zodiacRotation: 0,
    zodiacOpacity: 1,
    duration: entryDuration,
    ease: "power2.out"
  }, iconStart)

  // 2. Name Typewriter (1.5s -> 2.5s) [Duration: 1.0s]
  const nameStart = 1.5
  const nameDuration = 1.0
  const zodiacNameFull = (zodiacData.name || "").toUpperCase()

  tl.set(animState, { showName: true }, nameStart)
  const nameCounter = { val: 0 }
  tl.to(nameCounter, {
    val: zodiacNameFull.length,
    duration: nameDuration,
    ease: "none",
    onUpdate: () => {
      animState.zodiacName = zodiacNameFull.substring(0, Math.ceil(nameCounter.val))
    }
  }, nameStart)

  // 3. Vibe Typewriter (2.5s -> 4.0s) [Duration: 1.5s]
  const vibeStart = 2.5
  const vibeDuration = 1.5
  const vibeFull = "Vibe: " + (zodiacData.vibe || "")

  tl.set(animState, { showVibe: true }, vibeStart)
  const vibeCounter = { val: 0 }
  tl.to(vibeCounter, {
    val: vibeFull.length,
    duration: vibeDuration,
    ease: "none",
    onUpdate: () => {
      animState.vibeText = vibeFull.substring(0, Math.ceil(vibeCounter.val))
    }
  }, vibeStart)

  // 4. Sections (4.0s -> 9.0s) [Duration: 5.0s Window]
  const sectionsStart = 4.0
  const sectionDuration = 1.25
  const sectionOverlap = 0.2

  animState.sections.forEach((section, idx) => {
    // Start time: 4.0 + (1.25 - 0.2) * idx
    // idx 0: 4.0
    // idx 1: 5.05
    // idx 2: 6.10
    // idx 3: 7.15 (Ends at 8.4) -> Fits within 9.0
    const delay = sectionsStart + (idx * (sectionDuration - sectionOverlap))

    tl.set(section, { showLabel: true }, delay)
    // Fade Up
    tl.to(section, { opacity: 1, yOffset: 0, duration: 0.5, ease: "power2.out" }, delay)
    // Mask Reveal (starts slightly after fade up)
    tl.set(section, { showContent: true }, delay + 0.3)
    tl.to(section, { mask: 1, duration: 0.9, ease: "power1.inOut" }, delay + 0.3)
  })

  // 5. Hold (9.0s -> 11.0s) [Duration: 2.0s]
  // We don't need a specific tween for "hold", just ensure nothing changes.
  // We can add a dummy tween to enforce timeline length if needed, or rely on the next event start time.

  // 6. Fade Out (11.0s -> 13.0s) [Duration: 2.0s]
  const exitStart = 11.0
  const exitDuration = 2.0

  if (!isLast) {
    // Fade out specific elements for transition
    tl.to(animState, { zodiacOpacity: 0, duration: exitDuration, ease: "power2.inOut" }, exitStart)
    animState.sections.forEach(s => {
      tl.to(s, { opacity: 0, duration: exitDuration * 0.8 }, exitStart)
    })
    tl.to(animState, { showVibe: false, duration: 0.5 }, exitStart + 0.5)
  } else {
    // Final Exit (Fade everything to black)
    tl.to(animState, {
      decoOpacity: 0,
      zodiacOpacity: 0,
      duration: exitDuration,
      ease: "power2.inOut"
    }, exitStart)

    animState.sections.forEach(s => {
      tl.to(s, { opacity: 0, duration: exitDuration }, exitStart)
    })

    tl.to(animState, { showName: false, showVibe: false, duration: 0.1 }, exitStart + exitDuration)
  }

  // Log duration for verification
  console.log(`[ZodiacFrame] Timeline Duration: ${tl.totalDuration()}s (Target: 13s)`)

  return tl
}
