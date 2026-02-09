/**
 * Render function for the Draft/Design Frame
 * @param {CanvasRenderingContext2D} ctx - The canvas context
 * @param {Object} data - The data object containing animation state and images
 */
export const renderDraftFrame = (ctx, data = {}) => {
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
        ctx.fillText('Loading Images...', centerX, centerY)
        return
    }

    const radius = 450 // Radius of the ring
    const iconSize = 150 // Size of each zodiac icon
    const totalIcons = 12

    ctx.save()

    // Apply Group Scale & Opacity around center
    ctx.translate(centerX, centerY)
    ctx.scale(scale, scale)
    // We apply opacity per-item now for the highlight effect, 
    // but the group globalAlpha can serve as the base "fade in" value.
    // However, if we set globalAlpha here, it multiplies. 
    // We'll set it here as the base animation opacity.
    ctx.globalAlpha = opacity

    // Draw Zodiac Ring
    images.forEach((img, index) => {
        // Calculate position on the circle
        const angleDeg = (360 / totalIcons) * index
        const angleRad = (angleDeg + rotation) * (Math.PI / 180)

        const x = radius * Math.cos(angleRad)
        const y = radius * Math.sin(angleRad)

        if (img) {
            // Check highlight logic
            // Default to full visibility if no highlights specified, 
            // OR if this zodiac is in the highlighted list.
            // If highlights ARE specified and this one is NOT in it -> 40% opacity.

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
    // We expect `textData` in the data object
    const {
        opacity: textOpacity = 1, // Default to 1 if not passed, but now controlled by animation
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

        // Font settings - using a system font stack that looks decent
        // In a real app we'd load a specific font
        const baseFont = 'bold 32px "Garamond", sans-serif'
        const titleFont = 'bold 42px "Garamond", sans-serif'

        // Vertical spacing
        const startY = centerY - 120 // Shift up to center the 5-line block (middle line at centerY)
        const lineHeight = 50

        // Draw each line if it has content

        // DAILY
        ctx.font = 'bold 42px "Garamond", sans-serif'
        ctx.fillStyle = '#DAC477'
        ctx.fillText(line1, centerX, startY)

        // HOROSCOPE
        ctx.font = 'bold 42px "Garamond", sans-serif' // Big impact
        ctx.fillStyle = '#DAC477'
        ctx.fillText(line2, centerX, startY + 60)

        // FOR
        ctx.font = 'bold 42px "Garamond", sans-serif' // Small connector
        ctx.fillStyle = '#DAC477'
        ctx.fillText(line3, centerX, startY + 120)

        // ZODIAC NAMES (Highlight color)
        ctx.font = 'bold 42px "Garamond", sans-serif'
        ctx.fillStyle = '#DAC477'
        // Use a max width to prevent overflow if names are long
        ctx.fillText(line4, centerX, startY + 180, 600)

        // DATE
        ctx.font = 'bold 42px "Garamond", sans-serif'
        ctx.fillStyle = '#DAC477'
        ctx.fillText(line5, centerX, startY + 240)

        ctx.restore()
    }



    // Debug info (optional, remove later)
    // ctx.fillStyle = 'rgba(255, 255, 255, 0.5)'
    // ctx.font = '20px sans-serif'
    // ctx.fillText(`Scale: ${scale.toFixed(2)} Rot: ${rotation.toFixed(0)}`, 20, 40)
}
