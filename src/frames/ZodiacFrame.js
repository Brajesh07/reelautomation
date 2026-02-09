export const renderZodiacFrame = (ctx, zodiac) => {
  const width = ctx.canvas.width
  const height = ctx.canvas.height

  // Clear canvas
  ctx.fillStyle = '#0a0a1a'
  ctx.fillRect(0, 0, width, height)

  // Background gradient
  const gradient = ctx.createLinearGradient(0, 0, 0, height)
  gradient.addColorStop(0, '#1a1a2e')
  gradient.addColorStop(1, '#0f0f1e')
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, width, height)

  const centerX = width / 2
  let yPos = 250

  // Zodiac name (dynamic)
  ctx.fillStyle = '#ffd700'
  ctx.font = 'bold 100px Arial'
  ctx.textAlign = 'center'
  ctx.fillText(zodiac.name.toUpperCase(), centerX, yPos)
  yPos += 140

  // Vibe sentence (dynamic)
  ctx.fillStyle = '#ffffff'
  ctx.font = '50px Arial'
  wrapText(ctx, zodiac.vibe, centerX, yPos, width - 200, 65)
  yPos += 180

  // Love section
  yPos = renderSection(ctx, 'Love:', zodiac.love, centerX, yPos)
  yPos += 60

  // Career section
  yPos = renderSection(ctx, 'Career:', zodiac.career, centerX, yPos)
  yPos += 60

  // Money section
  yPos = renderSection(ctx, 'Money:', zodiac.money, centerX, yPos)
  yPos += 60

  // Soul Message section
  yPos = renderSection(ctx, 'Soul Message:', zodiac.soulMessage, centerX, yPos)

  // Decorative elements
  drawCircle(ctx, 150, 150, 50, '#ffd700', 0.3)
  drawCircle(ctx, width - 150, 200, 40, '#ffd700', 0.2)
  drawCircle(ctx, 120, height - 200, 60, '#ffd700', 0.25)
  drawCircle(ctx, width - 120, height - 250, 45, '#ffd700', 0.3)
}

// Render a section with label and yellow box content
const renderSection = (ctx, label, content, x, y) => {
  const width = ctx.canvas.width
  const padding = 30
  const boxWidth = width - 200

  // Label (static) - gold color
  ctx.fillStyle = '#ffd700'
  ctx.font = 'bold 55px Arial'
  ctx.textAlign = 'left'
  ctx.fillText(label, 100, y)
  y += 20

  // Split content by \n
  const lines = content.split('\n')
  const lineHeight = 50

  // Calculate box height based on number of lines
  const boxHeight = lines.length * lineHeight + padding * 2

  // Draw yellow box
  ctx.fillStyle = '#ffe680'
  ctx.fillRect(100, y, boxWidth, boxHeight)

  // Draw content in box (black text)
  ctx.fillStyle = '#000000'
  ctx.font = '45px Arial'
  ctx.textAlign = 'left'
  
  lines.forEach((line, i) => {
    ctx.fillText(line, 100 + padding, y + padding + (i + 1) * lineHeight)
  })

  return y + boxHeight + padding
}

// Helper to wrap text
const wrapText = (ctx, text, x, y, maxWidth, lineHeight) => {
  const words = text.split(' ')
  let line = ''
  let lines = []

  for (let n = 0; n < words.length; n++) {
    const testLine = line + words[n] + ' '
    const metrics = ctx.measureText(testLine)
    const testWidth = metrics.width
    
    if (testWidth > maxWidth && n > 0) {
      lines.push(line)
      line = words[n] + ' '
    } else {
      line = testLine
    }
  }
  lines.push(line)

  ctx.textAlign = 'center'
  lines.forEach((line, i) => {
    ctx.fillText(line.trim(), x, y + i * lineHeight)
  })
}

// Helper to draw decorative circles
const drawCircle = (ctx, x, y, radius, color, alpha) => {
  ctx.save()
  ctx.globalAlpha = alpha
  ctx.fillStyle = color
  ctx.beginPath()
  ctx.arc(x, y, radius, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()
}
