/**
 * Render function for the Intro Frame (Official Zodiac Animation)
 * @param {CanvasRenderingContext2D} ctx - The canvas context
 * @param {Object} data - The data object containing animation state and images
 */
export const renderIntroFrame = (ctx, data = {}) => {
  const width = ctx.canvas.width
  const height = ctx.canvas.height
  const centerX = width / 2
  const centerY = height / 2

  // Default animation state
  // Standard Zodiac Order to map indices
  const zodiacOrder = [
    'Aries', 'Taurus', 'Gemini', 'Cancer',
    'Leo', 'Virgo', 'Libra', 'Scorpio',
    'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'
  ]

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

  if (!images || images.length === 0) {
    // Fallback if no images
    ctx.fillStyle = '#fff'
    ctx.font = '40px sans-serif'
    ctx.textAlign = 'center'
    // ctx.fillText('Loading Images...', centerX, centerY) 
    // Commented out to avoid text flash during loading if data isn't ready
    return
  }

  const radius = 450 // Radius of the ring
  const iconSize = 150 // Size of each zodiac icon
  const totalIcons = 12

  ctx.save()

  // Apply Group Scale & Opacity around center
  ctx.translate(centerX, centerY)
  ctx.scale(scale, scale)
  ctx.globalAlpha = opacity

  // Draw Zodiac Ring
  images.forEach((img, index) => {
    // Calculate position on the circle
    const angleDeg = (360 / totalIcons) * index
    const angleRad = (angleDeg + rotation) * (Math.PI / 180)

    const x = radius * Math.cos(angleRad)
    const y = radius * Math.sin(angleRad)

    if (img) {
      let itemOpacity = 1
      const zodiacName = zodiacOrder[index]

      if (highlightedNames.length > 0) {
        const isHighlighted = highlightedNames.includes(zodiacName)
        if (!isHighlighted) {
          itemOpacity = 0.4
        }
      }

      ctx.save()
      ctx.globalAlpha = ctx.globalAlpha * itemOpacity // Combine group opacity with item opacity
      ctx.drawImage(img, x - iconSize / 2, y - iconSize / 2, iconSize, iconSize)
      ctx.restore()
    }
  })

  ctx.restore()

  // Draw Central Text (Typewriter Effect)
  const {
    opacity: textOpacity = 1,
    line1 = '',
    line2 = '',
    line3 = '',
    line4 = '',
    line5 = ''
  } = data.textData || {}

  if (data.textData) {
    ctx.save()
    // Apply text block opacity
    ctx.globalAlpha = textOpacity

    ctx.fillStyle = '#ffffff'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'

    // Vertical spacing - Matches DraftFrame
    const startY = centerY - 120

    // DAILY
    ctx.font = 'bold 42px "Garamond", sans-serif'
    ctx.fillStyle = '#DAC477'
    ctx.fillText(line1, centerX, startY)

    // HOROSCOPE
    ctx.font = 'bold 42px "Garamond", sans-serif'
    ctx.fillStyle = '#DAC477'
    ctx.fillText(line2, centerX, startY + 60)

    // FOR
    ctx.font = 'bold 42px "Garamond", sans-serif'
    ctx.fillStyle = '#DAC477'
    ctx.fillText(line3, centerX, startY + 120)

    // ZODIAC NAMES (Highlight color)
    ctx.font = 'bold 42px "Garamond", sans-serif'
    ctx.fillStyle = '#DAC477'
    ctx.fillText(line4, centerX, startY + 180, 600)

    // DATE
    ctx.font = 'bold 42px "Garamond", sans-serif'
    ctx.fillStyle = '#DAC477'
    ctx.fillText(line5, centerX, startY + 240)

    ctx.restore()
  }
}
