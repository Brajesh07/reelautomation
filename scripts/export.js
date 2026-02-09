const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

// Configuration
const OUTPUT_DIR = path.join(__dirname, '../output');
const FRAME_RATE = 30; // 30 FPS
const TOTAL_DURATION = 70; // 70 seconds
const TOTAL_FRAMES = FRAME_RATE * TOTAL_DURATION; // 2100 frames
const WIDTH = 1080;
const HEIGHT = 1920;

async function captureFrames() {
  console.log('Starting frame capture...');
  
  // Create output directory
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  // Launch browser with better compatibility
  let browser;
  try {
    // Try to use system Chrome first
    browser = await puppeteer.launch({
      headless: 'new',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--disable-software-rasterizer',
        '--disable-features=IsolateOrigins,site-per-process'
      ]
    });
  } catch (error) {
    console.error('Failed to launch browser:', error.message);
    console.log('\\n⚠️  Puppeteer browser launch failed.');
    console.log('\\nAlternative: Use the manual export method instead.');
    console.log('Run: node scripts/export-manual.js');
    throw error;
  }

  const page = await browser.newPage();
  
  // Set viewport to match canvas dimensions
  await page.setViewport({
    width: WIDTH,
    height: HEIGHT,
    deviceScaleFactor: 1
  });

  // Navigate to the local server
  // Make sure to run `npm run dev` before running this script
  const url = 'http://localhost:3000';
  console.log(`Navigating to ${url}...`);
  
  await page.goto(url, { waitUntil: 'networkidle0' });
  
  // Wait for canvas to be ready
  await page.waitForSelector('canvas');
  console.log('Canvas ready. Starting capture...');

  // Get canvas element
  const canvas = await page.$('canvas');

  // Capture frames at intervals
  const frameInterval = 1000 / FRAME_RATE; // milliseconds per frame
  
  for (let i = 0; i < TOTAL_FRAMES; i++) {
    const currentTime = i * frameInterval;
    
    // Wait for the specific time
    await page.evaluate((time) => {
      return new Promise((resolve) => {
        setTimeout(resolve, time);
      });
    }, currentTime);

    // Capture screenshot of canvas
    const screenshot = await canvas.screenshot({
      type: 'png',
      omitBackground: false
    });

    // Save frame
    const frameNumber = String(i).padStart(6, '0');
    const framePath = path.join(OUTPUT_DIR, `frame_${frameNumber}.png`);
    fs.writeFileSync(framePath, screenshot);

    // Progress indicator
    if (i % 100 === 0) {
      const percent = ((i / TOTAL_FRAMES) * 100).toFixed(1);
      console.log(`Progress: ${percent}% (Frame ${i}/${TOTAL_FRAMES})`);
    }
  }

  console.log('Frame capture complete!');
  await browser.close();
}

async function convertToVideo() {
  console.log('\nConverting frames to video...');
  
  const { exec } = require('child_process');
  const util = require('util');
  const execPromise = util.promisify(exec);

  const inputPattern = path.join(OUTPUT_DIR, 'frame_%06d.png');
  const outputVideo = path.join(OUTPUT_DIR, 'astrology-reel.mp4');

  // FFmpeg command to create video
  // -framerate 30: 30 FPS
  // -i: input pattern
  // -c:v libx264: H.264 codec
  // -pix_fmt yuv420p: pixel format for compatibility
  // -crf 18: quality (lower = better, 18 is visually lossless)
  const ffmpegCmd = `ffmpeg -framerate ${FRAME_RATE} -i "${inputPattern}" -c:v libx264 -pix_fmt yuv420p -crf 18 "${outputVideo}"`;

  try {
    console.log('Running FFmpeg...');
    const { stdout, stderr } = await execPromise(ffmpegCmd);
    console.log('Video created successfully!');
    console.log(`Output: ${outputVideo}`);
    
    // Optionally clean up frames
    console.log('\nTo clean up frames, run: rm -rf output/frame_*.png');
    
  } catch (error) {
    console.error('Error creating video:', error);
    throw error;
  }
}

async function main() {
  try {
    console.log('=== Astrology Reel Export ===\n');
    console.log(`Canvas Size: ${WIDTH}x${HEIGHT}`);
    console.log(`Duration: ${TOTAL_DURATION} seconds`);
    console.log(`Frame Rate: ${FRAME_RATE} FPS`);
    console.log(`Total Frames: ${TOTAL_FRAMES}\n`);
    
    // Step 1: Capture frames
    await captureFrames();
    
    // Step 2: Convert to video
    await convertToVideo();
    
    console.log('\n=== Export Complete ===');
    console.log('Your video is ready for Instagram Reels!');
    
  } catch (error) {
    console.error('Export failed:', error);
    process.exit(1);
  }
}

// Run the export
main();
