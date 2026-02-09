# Video Export Guide

Due to Puppeteer browser compatibility issues on macOS, here are the best alternatives for exporting your astrology reel:

## Method 1: Screen Recording (Recommended - Easiest)

1. **Start the dev server:**
   ```bash
   npm run dev
   ```

2. **Open http://localhost:3000** in your browser

3. **Use QuickTime Player to record:**
   - Open QuickTime Player
   - File → New Screen Recording
   - Select the canvas area (1080×1920)
   - Let the animation play for 70 seconds
   - Stop recording
   - Export as MP4

## Method 2: OBS Studio (Best Quality)

1. **Install OBS Studio** (free): https://obsproject.com/

2. **Configure OBS:**
   - Create a new scene
   - Add "Window Capture" source
   - Select your browser window
   - Crop to canvas area only
   - Set output resolution to 1080×1920

3. **Record:**
   - Start recording
   - Refresh the page to restart animation
   - Let it play for 70 seconds
   - Stop recording

## Method 3: Browser Extension

Use a Chrome extension like:
- **Loom** - Free screen & tab recording
- **Screencastify** - Records browser tabs
- **Vimeo Record** - High quality recording

## Method 4: FFmpeg Direct Capture (Mac)

```bash
# Install FFmpeg if not already installed
brew install ffmpeg

# Record screen area (adjust coordinates to match your canvas position)
ffmpeg -f avfoundation -framerate 30 -i "1:0" \
  -filter_complex "crop=1080:1920:x:y" \
  -t 70 -c:v libx264 -crf 18 -pix_fmt yuv420p \
  output/astrology-reel.mp4
```

Replace `x:y` with the actual x,y coordinates of your canvas on screen.

## Tips for Best Results

- **Full Screen**: Run browser in full screen or maximize the canvas
- **Stable Connection**: Ensure smooth playback (no lag)
- **Clean Audio**: Mute system sounds or add music in post-production
- **One Take**: The animation auto-plays once, so start recording before refreshing

## After Recording

Your video will be ready for Instagram Reels:
- ✓ 1080×1920 resolution (9:16 vertical)
- ✓ 70 seconds duration
- ✓ 30 FPS (smooth playback)

---

**Note**: The Puppeteer automated export will be fixed in a future update. For now, screen recording is the most reliable method.
