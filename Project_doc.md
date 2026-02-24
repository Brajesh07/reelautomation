# CanvaReel - Architecture & Development Guide

**Last Updated**: February 24, 2026  
**Project Version**: 1.1.0 (Audit & Documentation Update)  
**Status**: Production-Ready

---

## 1. Project Overview

CanvaReel is a high-performance React-based automation system designed to generate professional-grade astrology reels for social media. By leveraging the power of **HTML5 Canvas** for rendering and **GSAP** for precise animation control, it produces smooth, high-resolution vertical videos (1080×1920) that are ready for distribution.

### System Goals
- **Automation**: Turn structured JSON data into visual stories.
- **High Fidelity**: 9:16 vertical format at 30/60 FPS.
- **Reliability**: Precise synchronization between animation phases and recording frames.

---

## 2. Architecture & Tech Stack

The project follows a "Controller-Renderer" architecture, separating React's UI logic from the high-frequency Canvas rendering calls.

### The Stack
- **Frontend Framework**: [React 18.2.0](https://react.dev) (Functional components, Hooks)
- **Animation Engine**: [GSAP 3.12.5](https://gsap.com) (Timeline-based orchestration)
- **Graphics API**: [HTML5 Canvas 2D](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API) (1080×1920 resolution)
- **Build System**: [Vite 5.0.8](https://vitejs.dev)
- **Styling**: [Tailwind CSS 3.4.19](https://tailwindcss.com) + PostCSS
- **Navigation**: [React Router 7.13.0](https://reactrouter.com)
- **Exporting**: [MediaRecorder API](https://developer.mozilla.org/en-US/docs/Web/API/MediaRecorder) (Client) & [Puppeteer](https://pptr.dev) (Server/Headless)

### Folder Structure
- `src/frames/`: Pure JavaScript functions for canvas drawing (Renderers).
- `src/components/`: React wrappers for Canvas and shared UI elements.
- `src/pages/`: Route-level controllers managing data and animation timelines.
- `scripts/`: Python/Node utilities for headless frame capture and video conversion.
- `output/`: Storage for generated videos and frame sequences.

---

## 3. Core Components & Routing

### Route Map (`src/App.jsx`)
| Path | Component | Description |
| :--- | :--- | :--- |
| `/` | `UploadData` | The entry point for custom JSON injection and validation. |
| `/reel-canvas` | `ReelCanvas` | The main player and primary recording interface. |
| `/design` | `DesignPreview` | Advanced multi-zodiac editor with complex phase debugging. |
| `/frame-preview` | `FramePreview` | Developer tool for isolated testing of Intro/Zodiac/Outro frames. |

### Key Components
- **`ReelCanvas.jsx`**: Orchestrates the master 67-second timeline. It handles data fetching, image preloading, and high-quality WebM recording (8 Mbps).
- **`LayoutWithHeader.jsx`**: Provides a consistent navigational shell for the editor experience.

---

## 4. Animation System & Lifecycle

The animation sequence is meticulously timed to fit social media constraints.

### Master Sequence (67.5 Seconds)
1.  **Intro (3.5s + Typewriter)**: Spinning zodiac ring (450px radius) with scaling (0 → 1) and rotation ( -60° → 120°).
2.  **Zodiac 1 (20s)**: Full horoscope card reveal with 6 animation phases.
3.  **Zodiac 2 (20s)**: Transition and reveal of the second sign.
4.  **Zodiac 3 (20s)**: Transition and reveal of the third sign.
5.  **Outro (4s)**: Call-to-action with orbiting background ring and golden URL.

### Animation Phases (`src/frames/ZodiacFrame.js`)
| Phase | Duration | Details |
| :--- | :--- | :--- |
| **Decorative Entry** | 1.5s | Bottom icons (Heart, Trophy, etc.) fade and rise. |
| **Zodiac Icon Entry** | 1.5s | Icon slides from -300px with 360° rotation. |
| **Name Typewriter** | ~0.5s | Character-by-character text reveal. |
| **Vibe Typewriter** | ~1.5s | Rapid typing effect for the "Vibe" description. |
| **Section Reveal** | 2.0s | Staggered fade and horizontal mask reveal for Love/Career/Money. |
| **Hold & Transition** | 5.0s | Extended visibility before fading for the next card. |

---

## 5. Data Flow & Management

### The Lifecycle of Data
1.  **Injection**: User uploads JSON via `UploadData.jsx`.
2.  **Validation**: Strict check for exactly 3 zodiacs and required keys (`name`, `vibe`, `love`, `career`, `money`, `soulMessage`).
3.  **Persistence**: Validated objects are saved to `localStorage` under `customZodiacData`.
4.  **Hydration**: Components check `localStorage` first; if empty, they fetch `/public/data.json`.
5.  **Consumption**: GSAP timelines map data fields to `animStateRef` properties.

### Data Schema Example
```json
{
  "zodiacs": [
    {
      "name": "Leo",
      "vibe": "Confident and charismatic energy",
      "love": "Romance blooms today...",
      "career": "Leadership opportunities arise...",
      "money": "Financial gains expected...",
      "soulMessage": "Trust your inner fire..."
    }
  ]
}
```

---

## 6. Canvas Rendering Engine

### Renderer Responsibility Matrix
The drawing logic is siloed into pure functions to ensure performance and testability.

| Renderer | File | Focus |
| :--- | :--- | :--- |
| **`renderIntroFrame`** | `IntroFrame.js` | Circular arrangements, group scaling, ring rotation. |
| **`renderZodiacFrame`** | `ZodiacFrame.js` | High-fidelity card layout, text wrapping, masking. |
| **`renderOutroFrame`** | `OutroFrame.js` | CTA text, vector star drawing, background orbits. |
| **`renderDraftFrame`** | `DraftFrame.js` | (Legacy/Archive) Original complex phase prototype. |

### Technical Highlights
- **Text Wrapping**: Custom `wrapText` implementation handles multi-line horoscopes within 900px bounds.
- **Masking**: Uses `ctx.clip()` and `ctx.rect()` to create horizontal reveal animations for text blocks.
- **Performance**: High-frequency rendering triggered via GSAP `onUpdate` to maintain sync with the animation state.

---

## 7. Export & Post-Processing

The system provides multiple ways to move from Canvas to MP4.

### Client-Side Export (WebM)
- Built into `ReelCanvas.jsx`.
- Uses `MediaRecorder` with `vp9` codec.
- Bitrate tuned to **8,000,000 bps** for high-quality playback.

### Headless Export (PNG Image Sequence)
- **`scripts/export.js`**: Launches Puppeteer to capture 2,100 frames at 30 FPS.
- **`scripts/export-manual.js`**: Generates a static HTML shell (`output/export.html`) for browser-based frame-by-frame capture.

### Conversion Scripts
- **`scripts/convert-to-mp4.sh`**: FFmpeg script to convert WebM exports to Instagram-ready MP4s.
- **`scripts/export-ffmpeg.js`**: Orchestrates screen capture using FFmpeg `avfoundation` on macOS.

---

## 8. Development & Troubleshooting

### Local Setup
```bash
npm install
npm run dev
```

### Known Asset Typos
- **`Aires.png`**: The Aries asset is currently named `Aires.png`. Ensure imports in `DesignPreview.jsx` and `ReelCanvas.jsx` match this filename.
- **`Virgo-1.png`**: Currently used as the fallback placeholder for Scorpio.

### Architecture Best Practices
1.  **Isolation**: Never put drawing logic in React components; keep them in `src/frames/`.
2.  **Timing**: Always use the GSAP timeline instance to drive `animState`, ensuring recording frame-accuracy.
3.  **Assets**: Preload all images using the `imagesLoaded` state before starting the GSAP timeline.

---

*This document serves as the official source of truth for the CanvaReel project architecture.*
