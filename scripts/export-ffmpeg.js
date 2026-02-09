#!/usr/bin/env node

const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);
const path = require('path');
const fs = require('fs');

const OUTPUT_DIR = path.join(__dirname, '../output');
const OUTPUT_VIDEO = path.join(OUTPUT_DIR, 'astrology-reel.mp4');
const DURATION = 70; // 70 seconds

// Create output directory
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

console.log('=== FFmpeg Screen Capture Export ===\n');
console.log('This will capture your screen while the animation plays.');
console.log('Duration: 70 seconds');
console.log('Output: ' + OUTPUT_VIDEO);
console.log('\n📋 SETUP INSTRUCTIONS:\n');
console.log('1. Open http://localhost:3000 in your browser (Chrome recommended)');
console.log('2. Position the browser window so the canvas is visible');
console.log('3. Make sure the animation is ready to start');
console.log('4. Press ENTER here to start recording');
console.log('5. Immediately refresh the browser page to start the animation');
console.log('6. Recording will stop automatically after 70 seconds\n');

// Wait for user input
const readline = require('readline').createInterface({
  input: process.stdin,
  output: process.stdout
});

readline.question('Press ENTER when ready to start recording... ', async () => {
  readline.close();
  
  console.log('\n🎬 Starting recording in 3 seconds...');
  console.log('Refresh your browser NOW!\n');
  
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  try {
    // List available screen capture devices
    console.log('Detecting screen devices...\n');
    
    // FFmpeg command for macOS screen capture
    // Using avfoundation to capture screen
    const ffmpegCmd = `ffmpeg -f avfoundation -framerate 30 -capture_cursor 0 -i "1:none" -t ${DURATION} -c:v libx264 -crf 18 -pix_fmt yuv420p -vf "scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2" "${OUTPUT_VIDEO}"`;
    
    console.log('🔴 RECORDING STARTED - Refresh browser now!');
    console.log('⏱️  Recording for 70 seconds...\n');
    
    const startTime = Date.now();
    
    // Show progress
    const progressInterval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      const remaining = DURATION - elapsed;
      if (remaining > 0) {
        process.stdout.write(`\r⏱️  Recording: ${elapsed}s / ${DURATION}s (${remaining}s remaining)`);
      }
    }, 1000);
    
    const { stdout, stderr } = await execPromise(ffmpegCmd);
    
    clearInterval(progressInterval);
    console.log('\n\n✅ Recording complete!');
    console.log(`📹 Video saved: ${OUTPUT_VIDEO}`);
    console.log('\nYour video is ready for Instagram Reels! (1080×1920, 9:16 vertical)\n');
    
  } catch (error) {
    console.error('\n❌ Recording failed:', error.message);
    console.log('\n💡 Troubleshooting:\n');
    console.log('1. Grant screen recording permission to Terminal in System Preferences');
    console.log('   → System Preferences → Privacy & Security → Screen Recording');
    console.log('2. Make sure FFmpeg is installed: ffmpeg -version');
    console.log('3. Try listing available devices: ffmpeg -f avfoundation -list_devices true -i ""');
    console.log('\n📖 Alternative: Use QuickTime Player for screen recording\n');
    process.exit(1);
  }
});
