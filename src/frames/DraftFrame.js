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
        const iconSize = 400  // Large size as requested
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

            // Text Setup for measurement
            ctx.font = '500 32px "Garamond", serif'

            // Text Wrapping Calculation
            const words = text.split(' ')
            let lines = []
            let currentLine = ''

            words.forEach(word => {
                // Handle newlines explicitly if text contains them
                const wordParts = word.split('\n')
                if (wordParts.length > 1) {
                    // This simple split by space doesn't handle embedded newlines perfectly if we don't pre-process
                    // But for now assuming space-separated words or relying on simple wrapping.
                    // If the text comes with newlines, we might want to respect them.
                    // Let's stick to auto-wrapping for consistency with previous implementation.
                }

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
            // Calculate height even if not showing content yet to reserve space or animate layout if needed?
            // For now, if content isn't shown, height effectively depends on if we want to reserve it.
            // But simpler to just recalc height for layout purposes if we want to stack them purely dynamically.
            // Given the animation flow, likely we want to base this on the text content always.
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

        // Return total height used by this section (Title + Margin + Box + Padding below)
        return titleHeight + titleMargin + dynamicBoxHeight + 50 // +50 margin bottom
    }

    // Dynamic Sections (Love, Career, Money, Soul)
    const sections = data.sections || [] // Expecting an array of section data
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


    // Debug info (optional, remove later)
    // ctx.fillStyle = 'rgba(255, 255, 255, 0.5)'
    // ctx.font = '20px sans-serif'
    // ctx.fillText(`Scale: ${scale.toFixed(2)} Rot: ${rotation.toFixed(0)}`, 20, 40)
}
