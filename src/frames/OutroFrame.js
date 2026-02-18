/**
 * Render function for the Outro Frame
 * @param {CanvasRenderingContext2D} ctx - The canvas context
 * @param {Object} data - The data object containing animation state
 */
export const renderOutroFrame = (ctx, data = {}) => {
  const width = ctx.canvas.width
  const height = ctx.canvas.height
  const centerX = width / 2
  const centerY = height / 2

  const {
    opacity = 1,
    rotation = 0,
    text1 = '',
    boxWidth = 0,
    images = [] // Use images passed from ReelCanvas
  } = data

  // Clear canvas
  ctx.fillStyle = '#000000' // Pure black background
  ctx.fillRect(0, 0, width, height)

  ctx.save()
  ctx.globalAlpha = opacity

  // --- 1. Zodiac Circle ---
  if (images && images.length > 0) {
    const { scale = 1 } = data // Default scale to 1 if not provided
    const radius = 450 // Same radius as IntroFrame
    const iconSize = 150 // Same icon size
    const totalIcons = 12

    ctx.save()
    ctx.translate(centerX, centerY)
    ctx.scale(scale, scale) // Apply scale to the group

    // Rotate the entire group
    // Note: We do NOT use ctx.rotate here because it would rotate the icons (tilting them).
    // Instead, we add the rotation to the angle of each item so they orbit but stay upright.
    // ctx.rotate((rotation * Math.PI) / 180) <--- REMOVED

    images.forEach((img, index) => {
      const angleDeg = (360 / totalIcons) * index
      // Add rotation to the angle (Orbit)
      const angleRad = (angleDeg + rotation) * (Math.PI / 180)

      const x = radius * Math.cos(angleRad)
      const y = radius * Math.sin(angleRad)

      if (img) {
        ctx.save()
        // Multiply by 0.3 so it combines with the global fade opacity
        ctx.globalAlpha = ctx.globalAlpha * 0.3

        // Counter-rotate individual icons so they stay upright if desired?
        // IntroFrame doesn't counter-rotate, so they rotate with the ring.
        // If we want them upright, we would rotate by -rotation - angleRad.
        // The prompt says "Animate the group rotation", implying the whole thing spins.

        ctx.drawImage(img, x - iconSize / 2, y - iconSize / 2, iconSize, iconSize)
        ctx.restore()
      }
    })
    ctx.restore()
  }

  // --- 2. Center Text (Typewriter) ---
  if (text1) {
    ctx.save()
    // Apply text block opacity (matches IntroFrame textOpacity logic if needed, but here text1 clears on exit anyway)

    ctx.fillStyle = '#DAC477' // Gold color to match IntroFrame
    ctx.font = 'bold 42px "Garamond", sans-serif' // Match IntroFrame font
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'

    // Vertical spacing - Matches DraftFrame/IntroFrame logic
    // Intro matches startY = centerY - 120. 
    // We want to center this block roughly there.
    // Centered Group Calculation:
    // Headline (120) + Gap (50) + Box (104) = 274px Total Height
    // Top Y = centerY - 137
    // Line 1 Middle = Top Y + 30 = centerY - 107
    const startY = centerY - 107

    // Manually wrap "Want a personalised reading?"
    const line1Full = "Want a personalised"

    let currentLine1 = ""
    let currentLine2 = ""

    if (text1.length <= line1Full.length) {
      currentLine1 = text1
    } else {
      currentLine1 = line1Full
      currentLine2 = text1.substring(line1Full.length)
    }

    ctx.fillText(currentLine1, centerX, startY)
    if (currentLine2) {
      ctx.fillText(currentLine2, centerX, startY + 60) // 60px line height
    }

    ctx.restore()
  }

  // --- 3. Yellow Box (Reveal) ---
  if (boxWidth > 0) {
    const text = "Visit starryvibes.ai"

    // ZodiacFrame styling match
    const vertPadding = 30
    const horizPadding = 60
    const lineHeight = 44

    ctx.save()
    // Set font for measurement
    ctx.font = '500 32px "Garamond", serif'
    const textMetrics = ctx.measureText(text)
    const fullBoxWidth = textMetrics.width + (horizPadding * 2)
    const boxHeight = lineHeight + (vertPadding * 2) // ~104px

    // Position box relative to centered group
    // Top of group = centerY - 137
    // Box Top = Top + 120 (Headline) + 50 (Gap) = centerY + 33
    const boxY = centerY + 33

    // Draw Mask
    // Center the mask expansion
    const currentBoxWidth = fullBoxWidth * (boxWidth / 100) // boxWidth is 0-100 percentage
    const startX = centerX - fullBoxWidth / 2

    ctx.beginPath()
    ctx.rect(startX, boxY, currentBoxWidth, boxHeight)
    ctx.clip()

    // Draw Box Background
    ctx.fillStyle = '#DAC477' // Gold color
    ctx.fillRect(startX, boxY, fullBoxWidth, boxHeight)

    // Draw Text inside Box
    ctx.fillStyle = '#000000'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    // Text is drawn at full opacity/size, revealed by mask
    ctx.fillText(text, centerX, boxY + boxHeight / 2)

    ctx.restore()
  }

  ctx.restore()
}
