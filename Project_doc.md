---
**Last updated:** May 13, 2026

**Changelog:**
- May 13, 2026 — Refactored document to standard structure. Updated tech stack to reflect React Router 7 and Tailwind 4. Added "Current state" and "Key design decisions" based on codebase analysis. Noted discrepancy in Puppeteer export determinism.
- March 15, 2026 — Initial document created (v1.2.0 stabilization update).
---

# Project overview
Astrology Reel Automation (internally referred to as CanvaReel) is a high-performance React-based system designed to generate professional-grade, 1080x1920 vertical videos for social media. It transforms structured JSON horoscope data into dynamic visual stories using HTML5 Canvas for rendering and GSAP for precise, frame-perfect animation control.

# Tech stack
- **Language(s)**: JavaScript (ES6+), Node.js
- **Framework(s)**: React 18.2.0, React Router 7.13.0, Vite 5.0.8
- **Key libraries**: GSAP 3.12.5 (Animation orchestration), Tailwind CSS 3.4.19 / @tailwindcss/postcss 4.0.0 (UI styling), Puppeteer 21.9.0 (Headless capture)
- **Database / storage**: Browser LocalStorage (Configuration and custom data persistence)
- **External services / APIs**: FFmpeg (Video encoding and post-processing)

# Architecture
The system follows a decoupled rendering architecture where the UI state management is separated from the graphics drawing logic:
- **Controller Layer**: The modern render engine (`src/engine/renderSign.js`) acts as the primary orchestrator, loading assets, building GSAP timelines, and managing the recording lifecycle using FFmpeg WASM.
- **Animation Layer**: GSAP animates "proxy state" objects (not DOM elements) to track visual properties like opacity, scale, and text typewriter progress.
- **Rendering Layer**: Pure JavaScript functions in `src/frames/` (e.g., `ZodiacFrame.js`) receive the current proxy state and perform raw `2d` context operations on the canvas.
- **Data Flow**: JSON ingestion -> IndexedDB persistence -> React state -> GSAP Timeline -> Off-screen Canvas -> FFmpeg WASM Export.

# Current state
**Working:**
- Deterministic frame-by-frame recording in the browser using `tl.seek()`.
- Dynamic font-size adjustment tool in `DesignPreview.jsx` with real-time persistence.
- Complete 70-second reel sequence (Intro -> 3 Zodiac Cards -> Outro).
- Multi-method export system (MediaRecorder, Puppeteer PNG sequences, and FFmpeg screen capture).

**In progress:**
- Unifying the Puppeteer export script to use the same deterministic `seek()` logic as the client-side recorder (currently uses `setTimeout`).
- Optimization of text rendering and font measurement to reduce per-frame CPU overhead.

**Not started / planned:**
- Support for automated audio track assembly during FFmpeg encoding.
- Multi-template support for different visual styles or sign counts.

**Known issues:**
- **Naming Mismatch**: `package.json` identifies the project as `astrology-reel-automation`, while internal docs use `CanvaReel`.
- **Export Drift**: Headless Puppeteer export may skip frames on slower machines due to time-based (rather than frame-based) capture logic in `scripts/export.js`.

# Key design decisions
- **Deterministic Seek Loop**: To ensure "What You See Is What You Export," the recording engine pauses the clock and manually seeks the timeline to `index / FPS` for every frame.
- **Proxy-State Pattern**: Avoiding React state for the high-frequency animation loop (30+ FPS) prevents unnecessary re-renders and keeps the canvas performance consistent.
- **Lowercase Asset Mapping**: Strictly mapping JSON data names to lowercase filenames (e.g., "Aries" -> `aries.png`) to eliminate manual configuration overhead for new sign data.

# Developer quick-start
1. **Dependencies**: Ensure Node.js and FFmpeg are installed.
2. **Setup**: Run `npm install` to install dependencies.
3. **Local Dev**: Run `npm run dev` and navigate to `http://localhost:3000`.
4. **Data Injection**: Use the UI at the root path to upload custom JSON or use `localStorage.setItem('customZodiacData', ...)` for testing.
5. **Headless Export**: 
   - Start the dev server: `npm run dev`
   - In a new terminal, run: `npm run export` (captures PNGs to `output/` and generates `astrology-reel.mp4`).

# Open questions
- Should we implement a global `window.seekTimeline()` hook to enable frame-perfect synchronization in Puppeteer?
- Is there a preferred naming convention to unify the project name across the package manifest and documentation?
- Should we migrate the `scripts/` folder to TypeScript for better integration with the asset mapping logic?
