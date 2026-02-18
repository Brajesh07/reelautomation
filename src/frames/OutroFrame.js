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
  ctx.fillStyle = '#0a0a1a' // Deep dark blue background
  ctx.fillRect(0, 0, width, height)

  // Background gradient (optional, matching previous style)
  const gradient = ctx.createLinearGradient(0, 0, 0, height)
  gradient.addColorStop(0, '#1a1a2e')
  gradient.addColorStop(1, '#0f0f1e')
  ctx.fillStyle = gradient
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
    ctx.fillStyle = '#ffffff'
    ctx.font = 'bold 80px "Garamond", serif' // Using Garamond to match theme
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'

    // Split text into two lines if needed or handle as one block
    // "Want a personalised reading?"
    // Let's manually wrap it to look good
    // Line 1: Want a personalised
    // Line 2: reading?

    // Implementation: simple wrap or pre-calculated
    // Since text1 is being typed, we need to handle wrapping dynamically or just render what is passed
    // The prompt says "Display the text: 'Want a personalised reading?' Use typewriter animation."
    // We can assume text1 contains the *current* string to display.
    // To handle wrapping gracefully during typing, we can check lengths.

    const fullText = "Want a personalised reading?"
    const line1Full = "Want a personalised"

    // Determine what part of text1 belongs to line 1 and line 2
    let currentLine1 = ""
    let currentLine2 = ""

    if (text1.length <= line1Full.length) {
      currentLine1 = text1
    } else {
      currentLine1 = line1Full
      currentLine2 = text1.substring(line1Full.length)
    }

    ctx.fillText(currentLine1, centerX, centerY - 50)
    if (currentLine2) {
      ctx.fillText(currentLine2, centerX, centerY + 50)
    }

    ctx.restore()
  }

  // --- 3. Yellow Box (Reveal) ---
  if (boxWidth > 0) {
    const boxHeight = 140
    const fullBoxWidth = 800
    const boxY = centerY + 150

    ctx.save()

    // Draw Mask
    // Center the mask expansion
    const currentBoxWidth = fullBoxWidth * (boxWidth / 100) // boxWidth is 0-100 percentage or 0-1 factor
    // Prompt says: "Reveal using horizontal mask animation (left → right)."
    // So distinct from center expansion.
    // Start X is (centerX - fullBoxWidth/2)

    const startX = centerX - fullBoxWidth / 2

    ctx.beginPath()
    ctx.rect(startX, boxY, currentBoxWidth, boxHeight)
    ctx.clip()

    // Draw Box Background
    ctx.fillStyle = '#DAC477' // Gold color
    ctx.fillRect(startX, boxY, fullBoxWidth, boxHeight)

    // Draw Text inside Box
    // "Visit starryvibes.ai"
    // "Do not scale text." -> Text draws at full size, revealed by mask
    ctx.fillStyle = '#000000'
    ctx.font = 'bold 60px "Garamond", serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText("Visit starryvibes.ai", centerX, boxY + boxHeight / 2)

    ctx.restore()
  }

  ctx.restore()
}
