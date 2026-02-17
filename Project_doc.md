# Animation System Documentation

## Overview

The animation system consists of multiple components working together to create a professional astrology reel video:

### Component Quick Reference

| Component | Type | Purpose | Key Features |
|-----------|------|---------|-------------|
| **ReelCanvas** | Component | Main video player | Full 70s sequence, video recording, navigation |
| **DesignPreview** | Page | Multi-zodiac editor | Complex animations, all zodiacs, phase-by-phase |
| **FramePreview** | Page | Frame tester | Test Intro/Zodiac/Outro individually |
| **IntroFrame** | Renderer | Opening sequence | Spinning zodiac ring, typewriter text |
| **DraftFrame** | Renderer | Animated horoscope | 6 animation phases, decorative elements |
| **ZodiacFrame** | Renderer | Static horoscope | Simple card layout, yellow boxes |
| **OutroFrame** | Renderer | Closing CTA | Website promotion, decorative stars |

### Video Sequence (70 seconds total)

```
┌─────────────────────────────────────────────────────┐
│ Intro (12s)                                         │
│ • Spinning zodiac ring                              │
│ • "DAILY HOROSCOPE FOR..." typewriter text          │
├─────────────────────────────────────────────────────┤
│ Zodiac 1 (20s) - Leo                                │
│ • Fade in → Hold → Fade out                         │
├─────────────────────────────────────────────────────┤
│ Zodiac 2 (20s) - Aries                              │
│ • Fade in → Hold → Fade out                         │
├─────────────────────────────────────────────────────┤
│ Zodiac 3 (20s) - Taurus                             │
│ • Fade in → Hold → Fade out                         │
├─────────────────────────────────────────────────────┤
│ Outro (4s)                                          │
│ • "Want a personalised reading?"                    │
│ • "Visit starryvibes.ai"                            │
└─────────────────────────────────────────────────────┘
```

### Technologies Used

- **React** - Component lifecycle and state management
- **GSAP (GreenSock)** - Animation timeline and tweening
- **HTML5 Canvas** - Rendering graphics and text (1080×1920 resolution)
- **MediaRecorder API** - Canvas-to-video recording
- **React Router** - Multi-page navigation
- **Vite** - Fast development and bundling

---

## Quick Start Guide

### Running the Project

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Open browser to http://localhost:5173
```

### Navigation

1. **Main Player** (`/`) - ReelCanvas
   - View the complete 70-second video
   - Click "🎬 Start Recording" to export as WebM
   - Use navigation buttons to switch views

2. **Design Editor** (`/design`) - DesignPreview
   - See detailed animations for all zodiacs
   - Test complex animation phases
   - Use "Replay" to restart animation

3. **Frame Tester** (`/frame-preview`) - FramePreview
   - Click "Intro Frame" to test opening animation
   - Click "Zodiac Frame" to test horoscope card (first zodiac only)
   - Click "Outro Frame" to test closing CTA

### Modifying Content

**Edit Horoscope Data**:
- Open `public/data.json`
- Modify zodiac objects with new content
- Refresh browser to see changes

```json
{
  "zodiacs": [
    {
      "name": "Leo",
      "vibe": "Your custom vibe text here",
      "love": "Your love horoscope...",
      "career": "Your career advice...",
      "money": "Your money forecast...",
      "soulMessage": "Your soul message..."
    }
  ]
}
```

**Change Visual Assets**:
- Replace images in `src/images/` folder
- Keep same filenames or update imports in components
- Supported formats: PNG (recommended for transparency)

---

## Animation Flow

### Phase Breakdown

The animation progresses through 6 distinct phases for each zodiac sign:

#### **Phase 1: Decorative Images Entry** (1.5s)
*Only executes for the first zodiac*

- **Elements**: Heart, Trophy, Money Bag, Crystal Ball
- **Animation**: 
  - Fade from `opacity: 0` to `opacity: 0.4`
  - Slide up from `yOffset: 100px` to `yOffset: 0`
- **Easing**: `power2.out` (smooth deceleration)
- **Purpose**: Establishes visual foundation and background ambiance

```javascript
tl.to(animState, {
    decoY: 0,
    decoOpacity: 0.4,
    duration: 1.5,
    ease: "power2.out"
})
```

#### **Phase 2: Zodiac Icon Entry** (1.5s)

- **Elements**: Zodiac symbol icon
- **Animation**:
  - Slide from left: `xOffset: -300px` to `xOffset: 0`
  - Rotate: `rotation: -360°` to `rotation: 0°`
  - Fade in: `opacity: 0` to `opacity: 1`
- **Easing**: `power2.out`
- **Purpose**: Dynamic introduction of the current zodiac sign

```javascript
tl.to(animState, {
    zodiacX: 0,
    zodiacRotation: 0,
    zodiacOpacity: 1,
    duration: 1.5,
    ease: "power2.out"
})
```

#### **Phase 3: Zodiac Name Typewriter** (~0.1s per character)

- **Elements**: Zodiac name text (e.g., "LEO")
- **Animation**:
  - Character-by-character reveal
  - Duration: `0.1s × character count`
- **Easing**: `none` (linear for typing effect)
- **Implementation**: Substring progression

```javascript
tl.to(nameCounter, {
    value: zodiacNameFull.length,
    duration: zodiacNameFull.length * 0.1,
    onUpdate: () => {
        animState.zodiacName = zodiacNameFull.substring(0, Math.ceil(nameCounter.value))
    }
})
```

#### **Phase 4: Vibe Text Typewriter** (~0.05s per character)

- **Elements**: "Vibe: [description]" text
- **Animation**:
  - Appears 0.3s after name completes
  - Character-by-character reveal
  - Duration: `0.05s × character count` (faster than name)
- **Easing**: `none`

```javascript
tl.to(vibeCounter, {
    value: vibeTextFull.length,
    duration: vibeTextFull.length * 0.05,
    onUpdate: () => {
        animState.vibeText = vibeTextFull.substring(0, Math.ceil(vibeCounter.value))
    }
})
```

#### **Phase 5: Section Reveals** (Staggered)

Four sections animate in sequence: **Love**, **Career**, **Money**, **Soul Message**

Each section has a two-part animation:

**Part A: Label Fade-Up** (0.8s)
- Opacity: `0` to `1`
- Vertical slide: `yOffset: 20px` to `yOffset: 0`
- Easing: `power2.out`

**Part B: Content Mask Reveal** (1.2s)
- Starts 0.4s before label completes
- Horizontal mask: `maskProgress: 0` to `maskProgress: 1`
- Reveals text left-to-right
- Easing: `power1.inOut`

**Staggering**: Each section starts 0.8s before previous completes (overlap)

```javascript
// First section: starts after 0.3s pause
// Subsequent sections: overlap by 0.8s ("-=0.8")
animState.sections.forEach((section, index) => {
    const labelDelay = index === 0 ? "+=0.3" : "-=0.8"
    
    // Label fade-up
    tl.to(section, { opacity: 1, yOffset: 0, duration: 0.8 })
    
    // Content mask reveal
    tl.to(section, { mask: 1, duration: 1.2 }, "-=0.4")
})
```

#### **Phase 6: Hold & Transition** (5s + transition)

**Hold State**: All elements visible for 5 seconds

**Transition Logic**:

1. **If NOT last zodiac**:
   - Fade out zodiac icon (1s)
   - Fade out all sections (0.8s) and collapse masks
   - Hide vibe text (0.5s)
   - Decorative elements persist
   - Advance to next zodiac: `setCurrentIndex(prev => prev + 1)`

2. **If last zodiac** (Final Exit):
   - Fade out ALL elements including decoratives (2s)
   - Complete blackout
   - Animation ends

```javascript
if (!isLastZodiac) {
    // Transition to next (decoratives persist)
    tl.to(animState, { zodiacOpacity: 0, duration: 1 }, "exit")
    
    // Fade out sections
    animState.sections.forEach(section => {
        tl.to(section, {
            opacity: 0,
            mask: 0,
            duration: 0.8
        }, "exit")
    })

    tl.call(() => setCurrentIndex(prev => prev + 1))
} else {
    // Final blackout
    tl.to(animState, { 
        decoOpacity: 0, 
        zodiacOpacity: 0, 
        duration: 2 
    }, "finalExit")
    
    // Fade out sections
    animState.sections.forEach(section => {
        tl.to(section, { opacity: 0, mask: 0, duration: 1 }, "finalExit")
    })
}
```

---

## State Management

### Animation State Structure

The `animStateRef` object persists across renders and contains:

```javascript
animStateRef.current = {
    // Decorative Elements (persist across zodiacs)
    decoY: 100,           // Vertical offset
    decoOpacity: 0,       // Transparency
    
    // Zodiac Icon (resets per zodiac)
    zodiacX: -300,        // Horizontal offset
    zodiacRotation: -360, // Rotation in degrees
    zodiacOpacity: 0,     // Transparency
    zodiacName: '',       // Current name text
    showName: false,      // Display toggle
    
    // Vibe Text (resets per zodiac)
    vibeText: '',         // Current vibe text
    showVibe: false,      // Display toggle
    
    // Sections (resets per zodiac)
    sections: [
        { 
            id: 'love', 
            title: 'LOVE', 
            opacity: 0,        // Label opacity
            yOffset: 20,       // Label vertical offset
            mask: 0,           // Content mask progress (0-1)
            showLabel: false,  // Label display toggle
            showContent: false // Content display toggle
        },
        // ... career, money, soul
    ]
}
```

### State Reset Strategy

**Per-Zodiac Reset** (zodiac-specific elements):
```javascript
animState.zodiacX = -300
animState.zodiacRotation = -360
animState.zodiacOpacity = 0
animState.zodiacName = ''
animState.showName = false
animState.vibeText = ''
animState.showVibe = false
animState.sections.forEach(s => { /* reset */ })
```

**Persistent Elements** (decoratives):
- Only initialized on first run (`currentIndex === 0`)
- Maintained throughout all zodiac transitions
- Only fade out at final exit

---

## Rendering System

### DraftFrame.js Rendering Function

```javascript
renderDraftFrame(ctx, data)
```

**Parameters**:
- `ctx`: Canvas 2D rendering context
- `data`: Animation state object

**Canvas Dimensions**: 1080×1920 (9:16 aspect ratio)

### Element Rendering Order

1. **Background**: Solid black fill
2. **Zodiac Ring**: Currently disabled (`scale: 0, opacity: 0`)
3. **Central Text**: Typewriter text blocks (disabled in current version)
4. **Decorative Images**: Bottom row of icons with overlap
5. **Zodiac Icon + Name**: Top-left positioning with dynamic centering
6. **Vibe Text**: Below zodiac name with text wrapping
7. **Sections**: Dynamic vertical stacking with text wrapping

### Decorative Images Layout

```javascript
const iconSize = 400          // Large icon size
const spacing = -100          // Negative for overlap effect
const totalWidth = (iconSize * 4) + (spacing * 3)
const startX = centerX - (totalWidth / 2)  // Centered group

// Positions: [Heart] [Trophy] [MoneyBag] [CrystalBall]
```

### Zodiac Icon + Name Layout

**Dynamic Centering Logic**:
1. Measure text width: `ctx.measureText(name).width`
2. Calculate total width: `iconSize + spacing + textWidth`
3. Center group: `groupStartX = centerX - (totalWidth / 2) + xOffset`

**Positioning**:
- Icon: 100×100px at (groupStartX, 200)
- Name: 48px bold, 40px spacing from icon
- Both use same vertical center: `Y = 200 + iconSize/2`

### Section Rendering (Generic Function)

```javascript
drawSection(ctx, title, text, startY, options)
```

**Features**:
- Dynamic height calculation based on wrapped text
- Two-layer animation: label + content
- Horizontal mask clipping for reveal effect
- Text wrapping with 900px max width

**Layout**:
```
[Title Label]          ← Fades up
  ↓ 30px margin
┌────────────────────┐
│ [Wrapped Content]  │ ← Mask reveals left-to-right
└────────────────────┘
  ↓ 50px margin
[Next Section]
```

**Masking Implementation**:
```javascript
const maskWidth = boxWidth * maskProgress  // 0-1 progress
ctx.beginPath()
ctx.rect(centerX - boxWidth/2, boxStartY, maskWidth, dynamicBoxHeight)
ctx.clip()  // Only content within mask renders
```

---

## Data Flow

### Data Loading Pipeline

1. **Fetch JSON Data**: `/data.json`
   ```javascript
   fetch('/data.json')
       .then(res => res.json())
       .then(data => setZodiacs(data.zodiacs))
   ```

2. **Load Assets**: Decorative images + zodiac icons
   ```javascript
   // Track loading with counter
   loadedCount++
   if (loadedCount === totalImages) setImagesLoaded(true)
   ```

3. **Trigger Animation**: When `imagesLoaded && zodiacs.length > 0`

### Expected Data Structure

```json
{
    "zodiacs": [
        {
            "name": "Leo",
            "vibe": "Confident and charismatic energy",
            "love": "Romance blooms today...",
            "career": "Leadership opportunities arise...",
            "money": "Financial gains through...",
            "soulMessage": "Trust your inner fire..."
        }
    ]
}
```

### Image Assets

**Decorative**:
- `heart.png`
- `trophy.png`
- `money-bag.png`
- `crystal-ball.png`

**Zodiac Icons** (12 total):
- `Aires.png` (note: typo in filename)
- `Taurus.png`, `Gemini.png`, `Cancer.png`
- `Leo.png`, `Virgo.png`, `Libra.png`
- `Virgo-1.png` (used as Scorpio)
- `Sagittarius.png`, `Capricorn.png`
- `Aquarius.png`, `Pisces.png`

---

## Timeline Synchronization

### GSAP Timeline Features

**onUpdate Callback**: Renders canvas on every frame
```javascript
const tl = gsap.timeline({
    repeat: 0,
    onUpdate: () => {
        ctx.fillRect(0, 0, canvas.width, canvas.height)  // Clear
        renderDraftFrame(ctx, animationData)              // Redraw
    }
})
```

**Label System**: Named points for synchronization
```javascript
tl.to(..., "exit")           // Create label
tl.to(..., "exit+=0.5")      // 0.5s after label
tl.to(..., "finalExit")      // New label
```

**Relative Timing**:
- `"+=0.3"`: 0.3s after previous
- `"-=0.8"`: 0.8s before previous ends (overlap)

---

## Performance Considerations

### Optimization Strategies

1. **useRef for Animation State**
   - Prevents unnecessary re-renders
   - Maintains continuity across React updates

2. **Image Preloading**
   - All assets loaded before animation starts
   - Prevents frame drops from lazy loading

3. **Canvas Clearing**
   - Full clear + redraw each frame
   - Simple but effective for animation

4. **Timeline Cleanup**
   - `tl.kill()` in useEffect cleanup
   - Prevents memory leaks on unmount

### Canvas Update Frequency

- **GSAP Default**: ~60 FPS
- **Update Trigger**: `onUpdate` callback fires on every GSAP tick
- **Render Cost**: Full canvas clear + redraw per frame

---

## User Interactions

### Replay Functionality

```javascript
const handleReplay = () => {
    if (timelineRef.current) {
        timelineRef.current.restart()
    }
}
```

**Behavior**:
- Restarts timeline from beginning of the *current* zodiac
- Does NOT reset to the first zodiac (currentIndex persists)
- Note: May need enhancement to fully reset state to start of reel

### Navigation

- **Back Button**: Links to main reel view (`/`)
- No play/pause controls (auto-play only)

---

## Visual Styling

### Typography

**Fonts**: Garamond (serif family)
- Zodiac Name: 48px bold
- Vibe Text: 36px regular
- Section Titles: 40px bold
- Section Content: 32px medium (weight 500)

**Colors**:
- Background: `#000000` (black)
- Primary Text: `#FFFFFF` (white)
- Accent/Highlights: `#DAC477` (golden)
- Section Background: `#DAC477` (golden strip)
- Section Text: `#000000` (black on golden)

### Layout Measurements

```
Canvas: 1080×1920

Zodiac Icon Position:
  Y: 200px from top
  Size: 100×100px

Vibe Text:
  Y: 400px from top
  Max Width: 900px
  Line Height: 50px

Sections:
  Start Y: 550px
  Box Width: 900px
  Padding: 30px (vertical), 60px (horizontal)
  Line Height: 44px
  Spacing: 50px between sections

Decorative Images:
  Y: 120px from bottom (baseY = 1800)
  Size: 400×400px
  Spacing: -100px (overlap)
```

---

## Known Limitations & Issues

### Current Limitations

1. **Zodiac Ring Disabled**
   - Code exists but not activated (`scale: 0, opacity: 0`)
   - Could be enabled for enhanced visual

2. **Replay State Management**
   - `currentIndex` persists after replay
   - Should reset to 0 for true replay

3. **Filename Typo**
   - `Aires.png` should be `Aries.png`
   - `Virgo-1.png` used as Scorpio placeholder

4. **Hardcoded Layout**
   - Positions not responsive to content
   - May overflow with very long text

### Potential Improvements

- Add progress indicator showing `currentIndex + 1` of `total`
- Implement play/pause controls
- Add skip forward/backward buttons
- Make layout responsive to text length
- Export animation to video file
- Add loading progress bar for assets

---

## Debug Information

### Debug Overlay (Currently Commented Out)

```javascript
// Located in DraftFrame.js
ctx.fillStyle = 'rgba(255, 255, 255, 0.5)'
ctx.font = '20px sans-serif'
ctx.fillText(`Scale: ${scale.toFixed(2)} Rot: ${rotation.toFixed(0)}`, 20, 40)
```

Can be uncommented for development to show:
- Scale values
- Rotation values
- Other animation state

---

## File Dependencies

### Critical Files

**Core Application**:
- `src/App.jsx` - Main app with routing setup (/, /design, /frame-preview)
- `src/main.jsx` - React entry point, wraps App with BrowserRouter

**Pages (Route Components)**:
- `src/pages/index.jsx` - Placeholder component (not actively used)
- `src/pages/DesignPreview.jsx` - Multi-zodiac animation editor with complex timeline
- `src/pages/FramePreview.jsx` - Developer tool for testing individual frames

**Components**:
- `src/components/ReelCanvas.jsx` - Main video player with full sequence + recording

**Frames (Canvas Renderers)**:
- `src/frames/IntroFrame.js` - Spinning zodiac ring with typewriter intro text
- `src/frames/DraftFrame.js` - Complex animated horoscope card with phases
- `src/frames/ZodiacFrame.js` - Simple static horoscope card renderer
- `src/frames/OutroFrame.js` - Call-to-action closing frame with stars

**Data & Assets**:
- `public/data.json` - Zodiac horoscope content (name, vibe, love, career, money, soulMessage)
- `src/images/*.png` - Visual assets (decorative icons + 12 zodiac symbols)

**Styles**:
- `src/index.css` - Global styles, font definitions (Garamond)

**Build Configuration**:
- `vite.config.js` - Vite bundler configuration
- `package.json` - Dependencies (React, GSAP, React Router)

### Routing Map

```
App.jsx (BrowserRouter)
  ├─ Route "/"              → ReelCanvas (full video player)
  ├─ Route "/design"        → DesignPreview (multi-zodiac editor)
  └─ Route "/frame-preview" → FramePreview (frame tester)
```

### Image Assets Explained

**Decorative Images** (used in DraftFrame):
- `heart.png` - Love/romance symbol
- `trophy.png` - Achievement/success symbol
- `money-bag.png` - Wealth/prosperity symbol
- `crystal-ball.png` - Mysticism/fortune-telling symbol

**Zodiac Icons** (12 total for ring + individual cards):
- `Aires.png` ⚠️ **Note: typo in filename** (should be Aries)
- `Taurus.png`, `Gemini.png`, `Cancer.png`
- `Leo.png`, `Virgo.png`, `Libra.png`
- `Virgo-1.png` ⚠️ **Note: used as Scorpio placeholder**
- `Sagittarius.png`, `Capricorn.png`
- `Aquarius.png`, `Pisces.png`

---

# Project Explanation

This project is a React + Vite app that renders a vertical 9:16 horoscope reel using an HTML5 canvas. The system is split into:

- **Pages** (route-level views)
- **Components** (reusable UI + canvas wrappers)
- **Frames** (canvas renderers that draw each animation frame)

The animation is orchestrated by a GSAP timeline in a page-level controller, and each frame is rendered by a pure canvas drawing function.

## App Architecture (High Level)

```
App.jsx
  ├─ Router (react-router-dom)
  │   ├─ /              → components/ReelCanvas.jsx (full video player + recording)
  │   ├─ /design        → pages/DesignPreview.jsx (multi-zodiac animation editor)
  │   └─ /frame-preview → pages/FramePreview.jsx (individual frame tester)
  └─ Fetches /data.json (loads zodiac horoscope data)
```

### Route Breakdown

**1. "/" (Home) - ReelCanvas**
- **What users see**: Complete 70-second astrology reel video
- **Sequence**: Intro → Zodiac 1 → Zodiac 2 → Zodiac 3 → Outro
- **Features**: Video recording, navigation to other views
- **Use case**: Main entry point, production video viewing/export

**2. "/design" - DesignPreview**  
- **What users see**: Advanced multi-zodiac editor with complex animations
- **Sequence**: Cycles through ALL zodiacs in data.json with full animation phases
- **Features**: Detailed animation phases (icon entry, typewriter effects, section reveals)
- **Use case**: Testing full animation system, working with multiple zodiacs

**3. "/frame-preview" - FramePreview**
- **What users see**: Developer tool with buttons to test individual frames
- **Options**: Test Intro, Zodiac, or Outro separately
- **Features**: Isolated testing without running full sequence
- **Use case**: Development, debugging, fine-tuning individual frames

### Data Flow

```
App.jsx
  ↓ fetch('/data.json')
  ↓
{ zodiacs: [...] }
  ↓ passed as props
ReelCanvas / DesignPreview / FramePreview
  ↓ build GSAP timeline
Animation State (useRef)
  ↓ onUpdate callback
Canvas Renderer (IntroFrame / DraftFrame / ZodiacFrame / OutroFrame)
  ↓ drawImage() + fillText()
Visual Output on Canvas
```

---

## Pages

### `src/pages/index.jsx`

**Purpose**: Simple placeholder component (currently minimal implementation).

**Responsibilities**:
- Returns a basic div with "index" text
- Serves as placeholder for future homepage/entry point
- Not currently used in the main routing flow

**Current State**: 
- Minimal implementation - just returns `<div>index</div>`
- Can be expanded to show reel gallery, selection menu, or dashboard

**Key Concepts**:
- Placeholder for future expansion
- Not actively used in current app flow (App.jsx routes "/" to ReelCanvas instead)

---

### `src/pages/DesignPreview.jsx`

**Purpose**: Advanced animation controller for multi-zodiac reel with complex GSAP timeline.

**What it does in Simple English**:
This page shows a smooth, professional horoscope animation that loops through multiple zodiac signs (like Leo, Aries, etc.). Each zodiac gets its own screen time with:
1. A decorative background with icons (heart, trophy, money bag, crystal ball)
2. The zodiac symbol that spins in from the left
3. The zodiac name that types out letter by letter
4. A "vibe" description that types out
5. Four sections (Love, Career, Money, Soul Message) that fade in one by one
6. After showing everything, it fades out and moves to the next zodiac

**Responsibilities**:
- Fetches horoscope data from `public/data.json`
- Preloads all decorative images + zodiac icon images
- Creates a complex GSAP timeline with 6 animation phases per zodiac
- Maintains animation state in `animStateRef` (not React state - this avoids re-renders)
- Invokes `renderDraftFrame` on every animation frame to draw on canvas
- Manages transitions between multiple zodiac signs
- Provides "Back" and "Replay" buttons for user interaction

**Key Code Concepts**:
```javascript
// Animation state stored in useRef (not useState) to avoid re-renders
const animStateRef = useRef({
  decoY: 100,           // Decorative images vertical offset
  decoOpacity: 0,       // Decorative images transparency
  zodiacX: -300,        // Zodiac icon horizontal position (starts off-screen)
  zodiacRotation: -360, // Zodiac icon rotation (spins as it enters)
  zodiacOpacity: 0,     // Zodiac icon transparency
  zodiacName: '',       // Current typed text for name
  vibeText: '',         // Current typed text for vibe
  sections: [...]       // Array of 4 sections with their own animation states
})

// GSAP timeline updates canvas on every frame
const tl = gsap.timeline({
  onUpdate: () => {
    renderDraftFrame(ctx, animationData) // Redraw canvas with current state
  }
})
```

**Key Hooks**:
- `useEffect` to fetch data and load images
- `useEffect` to build GSAP timeline when data/images ready
- `useRef` for animation state (animStateRef) and timeline instance (timelineRef)
- `useState` for currentIndex (which zodiac is showing), imagesLoaded flag, and zodiac data array

---

### `src/pages/FramePreview.jsx`

**Purpose**: Testing/preview tool for individual frame types (Intro, Zodiac, Outro).

**What it does in Simple English**:
This is a developer tool page that lets you preview and test each type of animation frame separately. Instead of watching the whole 70-second video, you can click a button to see just the intro animation, just one zodiac card, or just the outro. It's like a backstage view where you can test each piece individually.

**Responsibilities**:
- Loads the same data and images as other pages
- Provides UI buttons to switch between frame types
- Creates separate GSAP timelines for each frame type
- Allows testing Intro/Zodiac/Outro animations in isolation
- Useful for development, debugging, and fine-tuning individual frames

**Key Features**:
- **Button Controls**: "Intro Frame", "Zodiac Frame", "Outro Frame" buttons
- **Isolated Testing**: Each frame runs its own animation independently
- **Same Renderers**: Uses the actual renderIntroFrame, renderDraftFrame, renderOutroFrame functions
- **Development Tool**: Not meant for end users, but for developers testing animations

**Key Code Concepts**:
```javascript
// UI state to track which frame is selected
const [selectedFrame, setSelectedFrame] = useState(null) // 'intro' | 'zodiac' | 'outro'

// Different animation logic based on selection
useEffect(() => {
  if (selectedFrame === 'intro') {
    // Build intro animation timeline
  } else if (selectedFrame === 'zodiac') {
    // Build zodiac animation timeline (first zodiac only)
  } else if (selectedFrame === 'outro') {
    // Build outro animation timeline
  }
}, [selectedFrame])

// Buttons to switch frames
<button onClick={() => setSelectedFrame('intro')}>Intro Frame</button>
<button onClick={() => setSelectedFrame('zodiac')}>Zodiac Frame</button>
<button onClick={() => setSelectedFrame('outro')}>Outro Frame</button>
```

**When to use it**:
- Testing individual frame animations without running the full sequence
- Debugging specific animation phases
- Fine-tuning timing, easing, or visual elements
- Showing stakeholders individual frame designs

## Components

### `src/components/ReelCanvas.jsx`

**Purpose**: Main reel player with full video sequence (Intro → 3 Zodiacs → Outro) and recording functionality.

**What it does in Simple English**:
This is the main video player for your astrology reel. When you open the app, this component shows the complete 70-second video sequence:
1. **Intro** (12 seconds): Spinning zodiac ring with "DAILY HOROSCOPE FOR..." text
2. **Zodiac 1** (20 seconds): First zodiac sign's horoscope
3. **Zodiac 2** (20 seconds): Second zodiac sign's horoscope  
4. **Zodiac 3** (20 seconds): Third zodiac sign's horoscope
5. **Outro** (4 seconds): "Visit starryvibes.ai" call-to-action

It also lets you **record the canvas as a video file** (WebM format) with a single button click.

**Responsibilities**:
- Creates and manages the main 1080×1920 canvas
- Loads all 12 zodiac icon images for the intro ring
- Builds the master GSAP timeline for the full video sequence
- Orchestrates all three frame types: Intro, Zodiac (×3), Outro
- Provides video recording functionality using MediaRecorder API
- Offers navigation buttons to other views (Design Preview, Frame Preview)

**Key Features**:

**1. Complete Timeline**:
```javascript
// Intro → Zodiac 1 → Zodiac 2 → Zodiac 3 → Outro
tl.to(introAnimState, { ... }) // Intro animations
tl.to(opacity, { ... })         // Fade in Zodiac 1
tl.to({}, { duration: 19 })     // Hold for 19 seconds
tl.to(opacity, { ... })         // Fade out Zodiac 1
// ... repeat for Zodiac 2, 3, then Outro
```

**2. Video Recording**:
```javascript
// Records the canvas at 30fps
const stream = canvas.captureStream(30)
const mediaRecorder = new MediaRecorder(stream, {
  videoBitsPerSecond: 8000000 // High quality 8Mbps
})
```

**3. Navigation Panel**:
- "🎨 Open Design Preview" - Goes to advanced multi-zodiac editor
- "🖼️ Frame Preview" - Opens frame testing tool
- "🎬 Start Recording" - Records canvas to WebM video file

**Key Code Concepts**:
```javascript
// Loads all 12 zodiac images for intro ring
const zodiacSources = [aires, taurus, gemini, ...] // 12 images
imagesRef.current = loadedImages

// Master timeline with all frames
const tl = gsap.timeline({ paused: true })

// Intro frame
tl.to(introAnimState, {
  scale: 1,
  rotation: 120,
  onUpdate: () => renderIntroFrame(ctx, {...})
})

// Zodiac frames (fade in → hold → fade out)
tl.to(opacity, {
  value: 1,
  onUpdate: () => renderZodiacFrame(ctx, data.zodiacs[0])
})

// Outro frame
tl.to(opacity, {
  value: 1,
  onUpdate: () => renderOutroFrame(ctx)
})
```

**Why it exists**:
- Main entry point for viewing the complete astrology reel
- Provides production-ready video export functionality
- Serves as the homepage (routed to "/" in App.jsx)
- Allows easy recording and sharing of the final video

## Frames (Canvas Renderers)

Frames are pure drawing functions. They render a single frame based on the current animation state.

---

### `src/frames/IntroFrame.js`

**Purpose**: Renders the opening title sequence with spinning zodiac ring and typewriter text.

**What it does in Simple English**:
Imagine a circle of 12 zodiac symbols (Aries, Taurus, Leo, etc.) arranged like numbers on a clock. This intro animation makes that circle:
1. **Spin slowly** while rotating around the center
2. **Zoom in** from tiny to full size
3. **Fade in** from invisible to visible
4. Show **highlighted names** in full color (the zodiacs in today's horoscope) while dimming others to 40% opacity
5. Display text in the center that **types out letter by letter**: "DAILY HOROSCOPE FOR LEO, ARIES FOR 17th Feb 2026"

It creates a dramatic opening that tells viewers exactly what they're about to see.

**Responsibilities**:
- Draws a circular ring of 12 zodiac icons arranged at equal angles (30° apart)
- Applies group transformations: scale, rotation, opacity
- Selectively highlights specific zodiac names (makes some bright, others dim)
- Renders multi-line centered text with typewriter effect
- Uses golden color (#DAC477) for all text
- Clears canvas with black background

**Key Visual Elements**:

**1. Zodiac Ring**:
- 12 icons positioned in a circle
- Radius: 450px from center
- Icon size: 150×150px each
- Rotates as a group based on `rotation` parameter
- Scales as a group based on `scale` parameter

**2. Selective Highlighting**:
```javascript
// If zodiac is in highlightedNames array, show at full opacity
// Otherwise, show at 40% opacity (dimmed)
if (highlightedNames.includes(zodiacName)) {
  itemOpacity = 1  // Bright
} else {
  itemOpacity = 0.4  // Dimmed
}
```

**3. Typewriter Text Block**:
- 5 lines of text, each typed out progressively
- Golden color (#DAC477)
- Centered alignment
- 42px bold Garamond font
- Lines: "DAILY", "HOROSCOPE", "FOR", "[ZODIAC NAMES]", "[DATE]"

**Key Code Concepts**:

**Input Parameters**:
```javascript
renderIntroFrame(ctx, data)

// Where data contains:
{
  scale: 0.5,              // Ring size (0 = invisible, 1 = full size)
  rotation: 120,           // Degrees to rotate the entire ring
  opacity: 0.8,            // Overall transparency
  images: [img1, img2...], // Array of 12 zodiac icon images
  highlightedNames: ['Leo', 'Aries'],  // Which zodiacs to highlight
  textData: {              // Typewriter text content
    opacity: 1,
    line1: 'DAILY',
    line2: 'HOROSCOPE',
    line3: 'FOR',
    line4: 'LEO, ARIES',
    line5: '17th Feb 2026'
  }
}
```

**How the Ring Positioning Works**:
```javascript
const totalIcons = 12
const radius = 450  // Distance from center
const iconSize = 150

images.forEach((img, index) => {
  // Calculate angle for this icon (0°, 30°, 60°, 90°, etc.)
  const angleDeg = (360 / 12) * index  // 30° spacing
  const angleRad = (angleDeg + rotation) * (Math.PI / 180)
  
  // Convert polar coordinates (angle + radius) to x,y coordinates
  const x = radius * Math.cos(angleRad)
  const y = radius * Math.sin(angleRad)
  
  // Draw icon at calculated position
  ctx.drawImage(img, x - iconSize/2, y - iconSize/2, iconSize, iconSize)
})
```

**Animation Flow (when used in ReelCanvas/FramePreview)**:
1. Start: `scale: 0, rotation: -60, opacity: 0` (invisible, rotated, tiny)
2. Animate to: `scale: 1, rotation: 120, opacity: 1` (visible, rotated 180° total, full size)
3. Duration: 3.5 seconds with smooth easing
4. Then: Show text with typewriter effect (each character types in 0.05s)
5. Hold: Display for 3 seconds
6. Fade out: Everything fades to black

**Why it exists**:
- Creates professional, engaging opening sequence
- Clearly communicates what the video contains (which zodiacs + date)
- Establishes visual brand (golden colors, Garamond font)
- Builds anticipation before showing detailed horoscopes

**Design Notes**:
- Black background (#000000) for dramatic contrast
- Golden text (#DAC477) for luxury/mystical feel
- Smooth power2.out easing for natural deceleration
- Ring rotation adds dynamic motion and visual interest
- Selective highlighting guides viewer attention to relevant zodiacs

---

### `src/frames/DraftFrame.js`

**Purpose**: Draws the full horoscope reel frame.

**Responsibilities**:
- Clears the canvas and draws the background
- Draws decorative images (heart, trophy, money, crystal ball)
- Draws the zodiac icon + name
- Draws the vibe text (with wrapping)
- Draws all sections (love, career, money, soul message)
- Applies masking for reveal animations

**Inputs**:
- `ctx`: Canvas 2D context
- `data`: Current animation state object

**Outputs**:
- Drawn frame on the canvas

---

### `src/frames/ZodiacFrame.js`

**Purpose**: Alternative/simplified renderer for a single zodiac card (used in ReelCanvas main sequence).

**What it does in Simple English**:
This renders a static zodiac horoscope card - think of it like a social media post or infographic. It shows:
1. The zodiac name in big golden letters at the top
2. A vibe sentence (one-liner about the zodiac's energy)
3. Four colored boxes with horoscope sections (Love, Career, Money, Soul Message)
4. Decorative golden circles floating around for visual flair

Unlike DraftFrame which has complex animations, this is simpler and renders everything at once.

**Responsibilities**:
- Draws gradient background (dark blue-purple theme)
- Displays zodiac name prominently at top
- Renders vibe text with automatic wrapping
- Creates four section boxes with labels and content
- Draws decorative circles for visual interest
- Uses yellow/gold boxes for content areas

**Visual Layout**:
```
┌─────────────────────────┐
│     LEO                 │  ← Golden, 100px font
│                         │
│  Confident and          │  ← Vibe text, wrapped
│  charismatic energy     │
│                         │
│  Love:                  │  ← Golden label
│  ┌───────────────────┐ │
│  │ Romance blooms... │ │  ← Yellow box, black text
│  └───────────────────┘ │
│                         │
│  Career:                │
│  ┌───────────────────┐ │
│  │ Leadership...     │ │
│  └───────────────────┘ │
│                         │
│  [Money & Soul same]    │
│                         │
│      ⚬  ⚬             │  ← Decorative circles
└─────────────────────────┘
```

**Key Code Concepts**:
```javascript
renderZodiacFrame(ctx, zodiac)

// Where zodiac is one data item:
{
  name: "Leo",
  vibe: "Confident and charismatic energy",
  love: "Romance blooms today...",
  career: "Leadership opportunities arise...",
  money: "Financial gains through...",
  soulMessage: "Trust your inner fire..."
}

// Each section gets rendered with:
renderSection(ctx, 'Love:', zodiac.love, centerX, yPos)
// Which draws:
// 1. Gold label text
// 2. Yellow box (#ffe680)
// 3. Black text inside box
```

**Helper Functions**:
- `renderSection()` - Draws one horoscope section with label + box
- `wrapText()` - Breaks long text into multiple lines
- `drawCircle()` - Draws decorative circles with opacity

**Color Scheme**:
- Background: Dark gradient (#1a1a2e → #0f0f1e)
- Name & Labels: Golden (#ffd700)
- Vibe Text: White (#ffffff)
- Content Boxes: Light yellow (#ffe680)
- Box Text: Black (#000000)

**Why it exists**:
- Simpler alternative to DraftFrame for basic zodiac cards
- Used in ReelCanvas for the main 3 zodiac slides
- Good for static exports or thumbnails
- Faster rendering without complex animation state

---

### `src/frames/OutroFrame.js`

**Purpose**: Renders the final call-to-action (CTA) frame at the end of the video.

**What it does in Simple English**:
This is like the closing credits of a movie, but for your astrology reel. It shows:
1. A dark purple gradient background
2. Big white text asking: "Want a personalised reading?"
3. Bright golden website URL: "Visit starryvibes.ai"
4. Sparkly golden stars scattered around to catch attention

It's designed to convert viewers into website visitors by offering them personalized horoscopes.

**Responsibilities**:
- Draws gradient background (dark purple theme)
- Displays call-to-action message in white
- Shows website URL in prominent golden color
- Draws decorative stars around the text
- Creates visual hierarchy (question → answer → action)

**Visual Layout**:
```
┌─────────────────────────┐
│                         │
│      ⭐               │
│                         │
│  Want a personalised    │  ← White, 80px bold
│       reading?          │
│                         │
│  Visit starryvibes.ai   │  ← Golden, 90px bold
│          ⭐           ⭐│
│                         │
│    ⭐              ⭐  │
└─────────────────────────┘
```

**Key Code Concepts**:
```javascript
renderOutroFrame(ctx)

// Background gradient
const gradient = ctx.createLinearGradient(0, 0, 0, height)
gradient.addColorStop(0, '#1a1a2e')  // Top: lighter purple
gradient.addColorStop(1, '#0f0f1e')  // Bottom: darker purple

// Main CTA text
ctx.font = 'bold 80px Arial'
ctx.fillStyle = '#ffffff'  // White
ctx.fillText('Want a personalised', centerX, centerY - 80)
ctx.fillText('reading?', centerX, centerY + 20)

// Website URL
ctx.font = 'bold 90px Arial'
ctx.fillStyle = '#ffd700'  // Golden
ctx.fillText('Visit starryvibes.ai', centerX, centerY + 180)

// Decorative stars at various positions
drawStar(ctx, x, y, 5, outerRadius, innerRadius, '#ffd700')
```

**Helper Function - drawStar()**:
```javascript
// Draws a multi-pointed star
drawStar(ctx, cx, cy, spikes, outerRadius, innerRadius, color)
// cx, cy: center position
// spikes: number of points (5 for classic star)
// outerRadius: tip distance from center (20-40px)
// innerRadius: valley distance from center (10-20px)
```

**Star Positions**:
- 4 larger stars near the CTA text (35-40px radius)
- 4 smaller stars in corners (20-25px radius)
- All golden (#ffd700) to match brand color

**Color Scheme**:
- Background: Gradient purple (#1a1a2e → #0f0f1e)
- Question Text: White (#ffffff)
- URL Text: Golden (#ffd700)
- Stars: Golden (#ffd700)

**Typography**:
- Uses Arial (simple, readable)
- Question: Bold 80px
- URL: Bold 90px (slightly larger to emphasize)
- Centered alignment

**Why it exists**:
- Converts passive viewers into active visitors
- Provides clear next step (visit website)
- Reinforces brand (golden colors, starry theme)
- Professional closing for the video sequence
- Increases engagement and traffic to website

**Design Psychology**:
- Question format engages curiosity
- "Personalised" creates FOMO (fear of missing out)
- Golden URL stands out as the actionable element
- Stars add visual interest and guide eyes to CTA
- Contrast between white and gold creates hierarchy

## Supporting Files

### `public/data.json`

**Purpose**: Source of zodiac content.

**Shape**:
```json
{
  "zodiacs": [
    {
      "name": "Leo",
      "vibe": "Confident and charismatic energy",
      "love": "Romance blooms today...",
      "career": "Leadership opportunities arise...",
      "money": "Financial gains through...",
      "soulMessage": "Trust your inner fire..."
    }
  ]
}
```

### `src/images/*`

**Purpose**: Decorative icons and zodiac assets used by the renderer.

**Notes**:
- Filename `Aires.png` is a known typo for Aries
- `Virgo-1.png` is used as a Scorpio placeholder

### `src/index.css`

**Purpose**: Global styles, font definitions, and base UI styling.

### `src/main.jsx`

**Purpose**: React entry point and router bootstrap.

## Data → Animation → Render Flow

```
public/data.json
   ↓ fetch
DesignPreview.jsx
   ↓ build animStateRef + timeline
GSAP onUpdate
   ↓
DraftFrame.js (renderDraftFrame)
   ↓
Canvas output
```

### External Libraries

```json
{
  "gsap": "Animation timeline engine",
  "react": "Component framework",
  "react-router-dom": "Navigation"
}
```

---

## Animation Timeline Diagram

```
Time →

0s         1.5s       3s        4s        5s          15s         20s
│──────────│──────────│─────────│─────────│───────────│───────────│
│  Deco    │  Zodiac  │  Name   │  Vibe   │ Sections  │   Hold    │ Exit
│  Entry   │  Entry   │  Type   │  Type   │ Stagger   │           │
│  (1st    │          │         │         │           │           │
│   only)  │          │         │         │           │           │
└──────────┴──────────┴─────────┴─────────┴───────────┴───────────┴───→

Legend:
  Deco Entry: Fade up from bottom (decorative icons)
  Zodiac Entry: Slide + rotate from left
  Name Type: Character-by-character reveal
  Vibe Type: Character-by-character reveal
  Sections: 4 sections with label fade + content mask (overlapping)
  Hold: Static display
  Exit: Fade out → next zodiac OR final blackout
```

---

## Conclusion

This animation system demonstrates a sophisticated multi-phase approach to revealing horoscope content. By combining GSAP's powerful timeline features with Canvas rendering, it achieves smooth, synchronized animations while maintaining good performance.

The modular structure (controller + renderer) allows for easy modifications and extensions, while the state management approach ensures smooth transitions between zodiac signs.

**Key Strengths**:
- Smooth, professional animations
- Clean separation of concerns
- Efficient asset loading
- Persistent decorative elements
- Dynamic content adaptation

**Recommended Enhancements**:
- Full replay functionality with state reset
- User controls (play/pause/skip)
- Progress indicators
- Video export capability
- Responsive text layout
