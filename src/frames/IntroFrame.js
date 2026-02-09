export const renderIntroFrame = (ctx, data) => {
  const width = ctx.canvas.width
  const height = ctx.canvas.height

  // Clear canvas
  ctx.fillStyle = '#0a0a1a'
  ctx.fillRect(0, 0, width, height)

  // Add gradient background
  const gradient = ctx.createLinearGradient(0, 0, 0, height)
  gradient.addColorStop(0, '#1a1a2e')
  gradient.addColorStop(1, '#0f0f1e')
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, width, height)

  // Parse date to get day, month, year
  const dateParts = data.date.split(' ')
  const day = dateParts[0]
  const month = dateParts[1]
  const year = dateParts[2]

  // Get zodiac names
  const zodiac1 = data.zodiacs[0].name.toUpperCase()
  const zodiac2 = data.zodiacs[1].name.toUpperCase()
  const zodiac3 = data.zodiacs[2].name.toUpperCase()

  // Center position
  const centerX = width / 2
  let yPos = 600

  // Title: DAILY
  ctx.fillStyle = '#ffffff'
  ctx.font = 'bold 120px Arial'
  ctx.textAlign = 'center'
  ctx.fillText('DAILY', centerX, yPos)
  yPos += 140

  // Title: HOROSCOPE
  ctx.fillText('HOROSCOPE', centerX, yPos)
  yPos += 140

  // Title: FOR
  ctx.font = 'bold 80px Arial'
  ctx.fillText('FOR', centerX, yPos)
  yPos += 120

  // Zodiac names (dynamic)
  ctx.fillStyle = '#ffd700'
  ctx.font = 'bold 70px Arial'
  ctx.fillText(`${zodiac1}, ${zodiac2}, ${zodiac3}`, centerX, yPos)
  yPos += 120

  // Date: {day}th {month} {year}
  ctx.fillStyle = '#ffffff'
  ctx.font = '60px Arial'
  const dateText = `${day}th ${month} ${year}`
  ctx.fillText(dateText, centerX, yPos)

  // Decorative stars
  drawStar(ctx, centerX - 400, 400, 5, 30, 15, '#ffd700')
  drawStar(ctx, centerX + 400, 450, 5, 25, 12, '#ffd700')
  drawStar(ctx, centerX - 450, 1400, 5, 35, 18, '#ffd700')
  drawStar(ctx, centerX + 420, 1350, 5, 28, 14, '#ffd700')
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
