# CanvaReel - Architecture & Development Guide

**Last Updated**: March 15, 2026  
**Project Version**: 1.2.0 (Stabilization & Deterministic Export Update)  
**Status**: Production-Ready

---

## 1. Project Overview

CanvaReel is a high-performance React-based automation system designed to generate professional-grade astrology reels for social media. By leveraging the power of **HTML5 Canvas** for rendering and **GSAP** for precise animation control, it produces smooth, high-resolution vertical videos (1080×1920).

### System Goals

- **Automation**: Transform structured JSON data into visual stories.
- **High Fidelity**: 9:16 vertical format at 30 FPS.
- **Reliability**: Deterministic frame-by-frame synchronization for flawless video exports.

---

## 2. Tech Stack

The system uses a modern, high-performance stack optimized for graphics orchestration:

- **Core Framework**: [React 18.2.0](https://react.dev) (UI controller layer, state management).
- **Animation Engine**: [GSAP 3.12.5](https://gsap.com) (Timeline orchestration and proxy-state animation).
- **Graphics API**: [HTML5 Canvas 2D](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API) (High-resolution rendering at 1080×1920).
- **Build System**: [Vite 5.0.8](https://vitejs.dev) (Fast HMR and optimized builds).
- **Styling**: [Tailwind CSS 3.4.19](https://tailwindcss.com) (Overlay UI and layout).
- **Automation**: [Puppeteer 21.9.0](https://pptr.dev) (Headless frame capture for deterministic export).
- **Post-Processing**: [FFmpeg](https://ffmpeg.org) (Video encoding and audio assembly).

---

## 3. Folder Structure

- **`src/components/`**: React UI components. `ReelCanvas.jsx` is the primary controller orchestrating the animation and recording.
- **`src/frames/`**: Pure JavaScript canvas renderers. These files (e.g., `ZodiacFrame.js`) contain the drawing logic for each reel phase.
- **`src/pages/`**: Application views. Includes data ingestion (`UploadData.jsx`), design tools (`DesignPreview.jsx`), and debugging (`FramePreview.jsx`).
- **`src/images/`**: Visual assets, including zodiac icons (lowercase naming) and decorative elements.
- **`scripts/`**: Node.js utilities for headless frame capture and video conversion.
- **`public/`**: Static assets and the default `data.json` source.
- **`output/`**: Destination for exported frame sequences and final video files.

---

## 4. Rendering Architecture

The rendering pipeline is decoupled to ensure performance and export accuracy:

1.  **JSON Data**: Input source providing content for 3 zodiac signs.
2.  **React Controller (`ReelCanvas.jsx`)**: Loads data and assets, manages the component lifecycle.
3.  **GSAP Timeline**: Creates a master 70-second timeline animating a "proxy state" (opacity, scale, text progress).
4.  **Canvas Renderer**: A `GSAP.ticker` loop calls frame renderers based on the current timeline position.
5.  **Canvas Frames**: Individual 1080x1920 frames painted to the buffer.
6.  **MediaRecorder / Puppeteer**: Captures the canvas stream (real-time) or frame-by-frame (headless).

---

## 5. Routing Structure

- **`/` (`UploadData.jsx`)**: The entry point for custom JSON injection and validation.
- **`/reel-canvas` (`ReelCanvas.jsx`)**: The main player and primary high-resolution recording interface.
- **`/design` (`DesignPreview.jsx`)**: Advanced multi-zodiac editor for visual adjustments.
- **`/frame-preview` (`FramePreview.jsx`)**: Developer tool for isolated testing of individual frame segments.

---

## 6. Data Flow

1.  **Ingestion**: Users upload JSON via `UploadData.jsx`.
2.  **Validation**: Strict check for required fields (`name`, `vibe`, `love`, `career`, `money`, `soulMessage`).
3.  **Storage**: Validated data is stored in `localStorage` as `customZodiacData`.
4.  **Consumption**: `ReelCanvas.jsx` reads from `localStorage` or defaults to `public/data.json` if not available.

**Sample JSON Structure**:

```json
{
  "zodiacs": [
    {
      "name": "Aries",
      "vibe": "Energetic and bold morning.",
      "love": "Be open to new connections.",
      "career": "Focus on high-impact tasks.",
      "money": "A good day for small investments.",
      "soulMessage": "Trust your inner fire."
    }
  ]
}
```

---

## 7. Animation System

The animation sequence is governed by a master **70-second sequence** (`REEL_DURATION_MS = 70000`).

- **Orchestration**: Managed in `ReelCanvas.jsx` using `gsap.timeline()`.
- **Typewriter Effects**: Implemented by animating a progress counter in GSAP and slicing the text string in the renderer.
- **Zodiac Sections**: Staggered reveal of content categories (Love, Career, Money, Soul) using `holdDuration` for pacing.

**Reel Sequence**:

1.  **Intro (0s - 10s)**: Rotating zodiac ring and title reveal.
2.  **Zodiac Cards (10s - 60s)**: Three 16.6s segments for each sign.
3.  **Outro (60s - 70s)**: CTA and rotating orbital background.

---

## 8. Canvas Renderers

- **`IntroFrame.js`**: Draws background rings, title text, and date with typewriter effects.
- **`ZodiacFrame.js`**: Handles card layout, image masking, text wrapping, and section reveals for zodiac data.
- **`OutroFrame.js`**: Renders final CTA text and orbital background patterns.
- **`DraftFrame.js`**: A lightweight renderer used for quick previews in UI overlays.

---

## 9. Video Export System

The system currently supports two distinct export mechanisms:

1.  **Client-Side (MediaRecorder)**: Uses the browser's `MediaRecorder` API (WebM/VP9) for real-time capture at 8Mbps. It includes guards to prevent `DOMException` on double-stops.
2.  **Headless (Puppeteer)**: Run via `scripts/export.js`. This is a **deterministic engine** that utilizes `window.seekTimeline(time)` to capture 30 FPS frame-perfect PNGs, regardless of machine performance.
3.  **FFmpeg**: Post-processing tool used to combine PNG sequences into high-quality MP4 files.

---

## 10. Configuration Files

- **`package.json`**: Defines dependencies and automation scripts (`export-headless`).
- **`vite.config.js`**: Configures the dev server and ensures assets are handled correctly by the bundler.
- **`tailwind.config.js`**: Defines the theme for the React UI layers.
- **`postcss.config.js`**: Manages CSS processing for modern syntax support.

---

## 11. Asset System

- **Zodiac Icons**: Located in `src/images/`, following a strict **lowercase** naming convention (e.g., `aries.png`, `scorpio.png`).
- **Decorative Assets**: Categorized icons for `love.png`, `career.png`, `money.png`, and `soul.png`.
- **Systematic Mapping**: JSON `name` fields are lowercased by the renderer to fetch the corresponding image asset.

---

## 12. Potential Weak Points

- **Font Rendering**: `ctx.measureText` is called frequently during the animation loop; high-frequency re-calculation could be optimized with memoization.
- **Asset Consistency**: The system relies on exact string matches between JSON data and filenames; any mismatch in the JSON `name` property will break image loading.
- **Export Latency**: Puppeteer exports generate large PNG sequences; disk I/O performance on the host machine can be a bottleneck for long reels.
- **State Complexity**: Deeply nested `animState` objects in GSAP require careful synchronization across all frame renderers.

---

## 13. [NEW] Frame-Based Rendering Architecture

To eliminate frame skips and ensure deterministic visual playback, the system is transitioning from a **time-driven update loop** to a **frame-driven render loop**.

### The Problem: Time-Based Rendering (Current)

Currently, the rendering loop relies on the `GSAP.ticker` (based on `requestAnimationFrame`). Since this is time-based, if the system lags:

1.  The ticker advances the timeline by a time delta (e.g., 16ms or 32ms).
2.  If the renderer takes longer than one frame to finish, the next "tick" skips the intermediate animation state to stay synced with real-time.
3.  **Result**: Visible "stutter" in previews and inconsistent frame data during real-time recording.

### The Solution: Frame-Driven Render Loop (Proposed)

The improved architecture decouples the animation progression from the system clock. It treats the timeline as a sequence of discrete, static states.

#### Core Logic:

1.  **Stable Frame Clock**: Define a fixed constant (e.g., `FPS = 30`).
2.  **Deterministic Frame Index**: Instead of measuring elapsed time, the system maintains a `currentFrame` counter.
3.  **Timeline Seeking**: For every frame, the system performs a precise seek:  
    `time = currentFrame / FPS`  
    `GSAP.timeline.pause().seek(time)`
4.  **Synchronous Draw**: The canvas render functions are called _only after_ the timeline has successfully reached the exact state for that frame index.

#### Guaranteed Execution Pipeline:

`[Frame Index]` → `[Calculate Time (Index/FPS)]` → `[GSAP Seek]` → `[Canvas Render]` → `[Increment Index]`

### Key Benefits:

- **Zero Frame Skips**: Every single animation state is rendered sequentially. If a frame takes 100ms to draw, the next frame still starts exactly at `(index + 1) / FPS` on the timeline.
- **Perfect Export Sync**: The real-time preview and the Puppeteer headless export now use the same deterministic logic, ensuring "What You See Is What You Export."
- **Consistent Typewriter Effects**: Character reveals and animations remain perfectly smooth regardless of CPU load.

---

## 14. System Summary

CanvaReel is an **enterprise-ready video generation engine**. It translates static JSON into dynamic 70-second social media reels by treating a Canvas as a video frame buffer orchestrated by GSAP.

The most critical component is the **sync-lock** between GSAP and the export mechanisms (`window.seekTimeline`), which transforms the non-deterministic nature of browser rendering into a frame-perfect rendering pipeline suitable for automated production.

---
