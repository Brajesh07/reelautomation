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
  const { isFirst = false, isLast = false, holdDuration = 5 } = options

  // Initial Animation State
  const animState = {
    decoY: isFirst ? 100 : 0,      // Start low if first, otherwise already up
    decoOpacity: isFirst ? 0 : 0.4, // Start invisible if first, otherwise visible
    zodiacX: -300,
    zodiacRotation: -360,
    zodiacOpacity: 0,
    zodiacName: '',
    showName: false,
    vibeText: '',
    showVibe: false,
    sections: [
      { id: 'love', title: 'LOVE', opacity: 0, yOffset: 20, mask: 0, showLabel: false, showContent: false },
      { id: 'career', title: 'CAREER', opacity: 0, yOffset: 20, mask: 0, showLabel: false, showContent: false },
      { id: 'money', title: 'MONEY', opacity: 0, yOffset: 20, mask: 0, showLabel: false, showContent: false },
      { id: 'soul', title: 'SOUL MESSAGE', opacity: 0, yOffset: 20, mask: 0, showLabel: false, showContent: false }
    ]
  }

  const tl = gsap.timeline({
    onUpdate: () => {
      const sectionsData = animState.sections.map(sectionState => {
        let text = ""
        if (sectionState.id === 'love') text = zodiacData.love
        else if (sectionState.id === 'career') text = zodiacData.career
        else if (sectionState.id === 'money') text = zodiacData.money
        else if (sectionState.id === 'soul') text = zodiacData.soulMessage

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

  // --- Animation Phases ---

  // Phase 1: Decorative Fade Up (Only if first)
  if (isFirst) {
    tl.to(animState, {
      decoY: 0,
      decoOpacity: 0.4,
      duration: 1.5,
      ease: "power2.out"
    })
  }

  // Phase 2: Zodiac Icon Enter
  // Start concurrently with Phase 1 if first, or immediately
  const startPosition = isFirst ? "<" : "+=0"

  tl.to(animState, {
    zodiacX: 0,
    zodiacRotation: 0,
    zodiacOpacity: 1,
    duration: 1.5,
    ease: "power2.out"
  }, startPosition)

  // Phase 3: Name Typewriter
  tl.set(animState, { showName: true })
  const zodiacNameFull = (zodiacData.name || "").toUpperCase()
  const nameCounter = { val: 0 }
  tl.to(nameCounter, {
    val: zodiacNameFull.length,
    duration: zodiacNameFull.length * 0.1,
    ease: "none",
    onUpdate: () => {
      animState.zodiacName = zodiacNameFull.substring(0, Math.ceil(nameCounter.val))
    }
  })

  // Phase 4: Vibe Typewriter
  const vibeFull = "Vibe: " + (zodiacData.vibe || "")
  tl.set(animState, { showVibe: true }, "+=0.3")
  const vibeCounter = { val: 0 }
  tl.to(vibeCounter, {
    val: vibeFull.length,
    duration: vibeFull.length * 0.05,
    ease: "none",
    onUpdate: () => {
      animState.vibeText = vibeFull.substring(0, Math.ceil(vibeCounter.val))
    }
  })

  // Phase 5: Sections Reveal
  animState.sections.forEach((section, idx) => {
    const labelDelay = idx === 0 ? "+=0.3" : "-=0.8"
    tl.set(section, { showLabel: true }, labelDelay)
    tl.to(section, { opacity: 1, yOffset: 0, duration: 0.8, ease: "power2.out" })
    tl.set(section, { showContent: true }, "-=0.4")
    tl.to(section, { mask: 1, duration: 1.2, ease: "power1.inOut" })
  })

  // Phase 6: Hold
  // DesignPreview uses 5s hold. ReelCanvas uses 19s in previous static logic.
  // Let's stick to DesignPreview's concise flow or user's expectation?
  // ReelCanvas had: FadeIn(0.5) + Hold(19) + FadeOut(0.5) = 20s total per zodiac.
  // DesignPreview has roughly: 1.5(Enter) + 0.5(Name) + 1.5(Vibe) + 4x1.2(Sections) ~ 8-10s build up.
  // To match 20s total, we need a Hold of ~10s.
  tl.to({}, { duration: holdDuration })
  // Let's use 5s hold to match DesignPreview "feel" for now, or extend it? 
  // Use 5s for now as it's safe.

  // Phase 7: Transitions / Exit
  if (!isLast) {
    // Transition to next zodiac (Next one will overlap or start after?)
    // In DesignPreview, we fade out current zodiac to prepare for next.
    tl.to(animState, { zodiacOpacity: 0, duration: 1, ease: "power2.in" }, "exit")
    animState.sections.forEach(s => {
      tl.to(s, { opacity: 0, duration: 0.8 }, "exit") // Mask stays 1, opacity fades (fixed bug logic)
    })
    tl.to(animState, { showVibe: false, duration: 0.5 }, "exit+=0.5")
  } else {
    // Final Exit (Fade everything including deco)
    tl.to(animState, {
      decoOpacity: 0,
      zodiacOpacity: 0,
      duration: 2,
      ease: "power2.inOut"
    }, "finalExit")

    animState.sections.forEach(s => {
      tl.to(s, { opacity: 0, duration: 1 }, "finalExit")
    })

    tl.to(animState, {
      showVibe: false,
      showName: false,
      duration: 1
    }, "finalExit")
  }

  return tl
}
