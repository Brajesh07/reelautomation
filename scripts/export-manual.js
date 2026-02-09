// Simple export script - Manual approach
// This creates a simple HTML page you can open in your browser to manually trigger export

const fs = require('fs');
const path = require('path');

const OUTPUT_DIR = path.join(__dirname, '../output');
const HTML_PATH = path.join(OUTPUT_DIR, 'export.html');

// Create output directory
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

console.log('Creating export HTML file...');

// Create HTML file for manual export
const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Astrology Reel Export</title>
  <style>
    body {
      margin: 0;
      padding: 20px;
      background: #1a1a1a;
      font-family: Arial, sans-serif;
      color: white;
      display: flex;
      flex-direction: column;
      align-items: center;
    }
    
    .controls {
      position: fixed;
      top: 20px;
      right: 20px;
      background: rgba(0, 0, 0, 0.8);
      padding: 20px;
      border-radius: 10px;
      z-index: 1000;
    }
    
    button {
      background: #ffd700;
      color: black;
      border: none;
      padding: 10px 20px;
      border-radius: 5px;
      cursor: pointer;
      font-size: 16px;
      font-weight: bold;
      margin: 5px 0;
      width: 100%;
    }
    
    button:hover {
      background: #ffed4e;
    }
    
    button:disabled {
      background: #666;
      cursor: not-allowed;
    }
    
    .status {
      margin-top: 10px;
      font-size: 14px;
    }
    
    canvas {
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
      margin: 20px;
    }
  </style>
</head>
<body>
  <div class="controls">
    <h3 style="margin-top: 0;">Export Controls</h3>
    <button id="playBtn">▶️ Play Animation</button>
    <button id="resetBtn">🔄 Reset</button>
    <button id="exportBtn" disabled>💾 Export Frame</button>
    <div class="status" id="status">Ready</div>
    <div style="font-size: 12px; margin-top: 10px; opacity: 0.7;">
      Frame: <span id="frameCount">0</span> / 2100
    </div>
  </div>
  
  <canvas id="canvas"></canvas>

  <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js"></script>
  <script type="module">
    const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d');
    const CANVAS_WIDTH = 1080;
    const CANVAS_HEIGHT = 1920;
    
    canvas.width = CANVAS_WIDTH;
    canvas.height = CANVAS_HEIGHT;
    canvas.style.width = '405px';
    canvas.style.height = '720px';

    let data = null;
    let timeline = null;
    let isPlaying = false;
    let frameNumber = 0;

    // Load data
    fetch('../public/data.json')
      .then(res => res.json())
      .then(loadedData => {
        data = loadedData;
        document.getElementById('status').textContent = 'Data loaded';
        setupAnimation();
      })
      .catch(err => {
        document.getElementById('status').textContent = 'Error loading data';
        console.error(err);
      });

    function setupAnimation() {
      // Copy frame rendering functions here
      ${fs.readFileSync(path.join(__dirname, '../src/frames/IntroFrame.js'), 'utf8')}
      ${fs.readFileSync(path.join(__dirname, '../src/frames/ZodiacFrame.js'), 'utf8')}
      ${fs.readFileSync(path.join(__dirname, '../src/frames/OutroFrame.js'), 'utf8')}

      let opacity = { value: 1 };
      timeline = gsap.timeline({ paused: true });

      // Frame 1: Intro (6 seconds)
      timeline.add(() => renderIntroFrame(ctx, data))
      timeline.to({}, { duration: 5.5 })
      timeline.to(opacity, { 
        value: 0, 
        duration: 0.5,
        onUpdate: () => {
          ctx.globalAlpha = opacity.value;
          renderIntroFrame(ctx, data);
        }
      })

      // Frame 2-4: Zodiacs (20 seconds each)
      for (let i = 0; i < 3; i++) {
        timeline.add(() => { opacity.value = 0; ctx.globalAlpha = opacity.value; })
        timeline.to(opacity, { 
          value: 1, 
          duration: 0.5,
          onUpdate: () => {
            ctx.globalAlpha = opacity.value;
            renderZodiacFrame(ctx, data.zodiacs[i]);
          }
        })
        timeline.to({}, { duration: 19 })
        timeline.to(opacity, { 
          value: 0, 
          duration: 0.5,
          onUpdate: () => {
            ctx.globalAlpha = opacity.value;
            renderZodiacFrame(ctx, data.zodiacs[i]);
          }
        })
      }

      // Frame 5: Outro (4 seconds)
      timeline.add(() => { opacity.value = 0; ctx.globalAlpha = opacity.value; })
      timeline.to(opacity, { 
        value: 1, 
        duration: 0.5,
        onUpdate: () => {
          ctx.globalAlpha = opacity.value;
          renderOutroFrame(ctx);
        }
      })
      timeline.to({}, { duration: 3.5 })
      timeline.add(() => { ctx.globalAlpha = 1; })

      document.getElementById('playBtn').disabled = false;
      document.getElementById('exportBtn').disabled = false;
    }

    // Controls
    document.getElementById('playBtn').addEventListener('click', () => {
      if (!timeline) return;
      
      if (isPlaying) {
        timeline.pause();
        document.getElementById('playBtn').textContent = '▶️ Play Animation';
        isPlaying = false;
      } else {
        timeline.play();
        document.getElementById('playBtn').textContent = '⏸️ Pause';
        isPlaying = true;
      }
    });

    document.getElementById('resetBtn').addEventListener('click', () => {
      if (!timeline) return;
      timeline.restart();
      timeline.pause();
      document.getElementById('playBtn').textContent = '▶️ Play Animation';
      isPlaying = false;
      frameNumber = 0;
      document.getElementById('frameCount').textContent = frameNumber;
    });

    document.getElementById('exportBtn').addEventListener('click', () => {
      const link = document.createElement('a');
      link.download = \`frame_\${String(frameNumber).padStart(6, '0')}.png\`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      
      frameNumber++;
      document.getElementById('frameCount').textContent = frameNumber;
      document.getElementById('status').textContent = \`Exported frame \${frameNumber}\`;
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      if (e.code === 'Space') {
        e.preventDefault();
        document.getElementById('playBtn').click();
      } else if (e.code === 'KeyE') {
        e.preventDefault();
        document.getElementById('exportBtn').click();
      } else if (e.code === 'KeyR') {
        e.preventDefault();
        document.getElementById('resetBtn').click();
      }
    });
  </script>
</body>
</html>`;

fs.writeFileSync(HTML_PATH, htmlContent);

console.log('✓ Export HTML created!');
console.log('\\nOpen this file in your browser:');
console.log(HTML_PATH);
console.log('\\nOr run: open ' + HTML_PATH);
