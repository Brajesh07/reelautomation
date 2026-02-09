export const renderOutroFrame = (ctx) => {
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
  const centerY = height / 2

  // Main CTA text
  ctx.fillStyle = '#ffffff'
  ctx.font = 'bold 80px Arial'
  ctx.textAlign = 'center'
  ctx.fillText('Want a personalised', centerX, centerY - 80)
  ctx.fillText('reading?', centerX, centerY + 20)

  // Website URL
  ctx.fillStyle = '#ffd700'
  ctx.font = 'bold 90px Arial'
  ctx.fillText('Visit starryvibes.ai', centerX, centerY + 180)

  // Decorative stars around the CTA
  drawStar(ctx, centerX - 420, centerY - 80, 5, 35, 18, '#ffd700')
  drawStar(ctx, centerX + 420, centerY - 50, 5, 30, 15, '#ffd700')
  drawStar(ctx, centerX - 400, centerY + 200, 5, 40, 20, '#ffd700')
  drawStar(ctx, centerX + 410, centerY + 180, 5, 35, 18, '#ffd700')
  
  // Additional smaller stars
  drawStar(ctx, 200, 400, 5, 20, 10, '#ffd700')
  drawStar(ctx, width - 200, 450, 5, 25, 12, '#ffd700')
  drawStar(ctx, 180, height - 400, 5, 22, 11, '#ffd700')
  drawStar(ctx, width - 180, height - 450, 5, 20, 10, '#ffd700')
}

// Helper function to draw stars
const drawStar = (ctx, cx, cy, spikes, outerRadius, innerRadius, color) => {
  let rot = Math.PI / 2 * 3
  let x = cx
  let y = cy
  const step = Math.PI / spikes

  ctx.beginPath()
  ctx.moveTo(cx, cy - outerRadius)
  
  for (let i = 0; i < spikes; i++) {
    x = cx + Math.cos(rot) * outerRadius
    y = cy + Math.sin(rot) * outerRadius
    ctx.lineTo(x, y)
    rot += step

    x = cx + Math.cos(rot) * innerRadius
    y = cy + Math.sin(rot) * innerRadius
    ctx.lineTo(x, y)
    rot += step
  }
  
  ctx.lineTo(cx, cy - outerRadius)
  ctx.closePath()
  ctx.fillStyle = color
  ctx.fill()
}
