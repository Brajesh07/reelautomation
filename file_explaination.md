# Code Explanation: Canvas Render Frames

This document explains the architecture and logic of the three core canvas rendering files used in the video generation pipeline. These files are responsible for drawing the visual frames of the video onto an HTML5 `<canvas>`. They operate on a "stateless render" paradigm—they do not handle the video encoding or maintain time internally. Instead, the main engine passes a `data` object representing the exact mathematical state of a specific frame, and these functions draw that single snapshot.

## 1. `src/frames/IntroFrame.js` (`renderIntroFrame`)
This file handles the visual rendering of the opening Intro sequence.
- **Purpose**: Draws the opening scene featuring a rotating ring of all 12 zodiac icons and a central introductory text block.
- **Key Mechanics**:
  - **Zodiac Ring**: Calculates the mathematical positions of 12 icons on a circle using basic trigonometry (`Math.cos`, `Math.sin`). It applies a global `rotation` property from the `data` object to animate the spin.
  - **Highlighting**: Uses the `highlightedNames` array to determine which icon should be fully opaque, while dimming the others (e.g., highlighting "Scorpio" when it's Scorpio's turn to render).
  - **Central Text**: Renders up to 5 lines of text in the center. The text content and opacity are controlled by the `data.textData` object, allowing the parent animation controller to create typewriter or fade-in effects by updating the string length frame by frame.

## 2. `src/frames/ZodiacFrame.js`
This is the most complex file, handling the main reading portion of the video for a specific zodiac sign. It contains two main parts:

### A. `renderZodiacFrame(ctx, data, fontSizes)` (The Renderer)
The raw drawing function that takes state and paints the canvas.
- **Decorative Background**: Renders 4 subtle icons (Heart, Trophy, Money Bag, Crystal Ball) clustered at the bottom.
- **Header**: Draws the specific zodiac's icon (with a configurable X-offset and rotation for entry animations) and its name.
- **Vibe Text**: Includes a dynamic text-wrapping algorithm (`ctx.measureText`) to ensure the "Vibe" sentence breaks into multiple lines gracefully if it exceeds the canvas width constraints.
- **Dynamic Sections**: Iterates through the 4 reading sections (Love, Career, Money, Soul). It uses a sophisticated horizontal masking technique (`ctx.clip()`) tied to a `maskProgress` variable to create an effect where a gold background and text reveal themselves from the center outwards.

### B. `createZodiacTimeline(ctx, zodiacData, resources, options)` (The Orchestrator)
- **Purpose**: Instead of manually calculating math for 690 frames, this function uses **GSAP (GreenSock Animation Platform)** to map out a precise 13-second animation timeline.
- **How it works**: 
  1. It initializes an internal `animState` object with starting values (e.g., `zodiacOpacity: 0`, `mask: 0`).
  2. It defines GSAP "tweens" (animations) that change these values over specific time windows (e.g., Icon Entry from 0s to 1.5s, Typewriter effects from 1.5s to 4.0s).
  3. Crucially, it sets an `onUpdate` callback on the timeline. Every time GSAP increments the state values, it calls `renderZodiacFrame` with the newly interpolated numbers, redrawing the canvas.

## 3. `src/frames/OutroFrame.js` (`renderOutroFrame`)
This file handles the visual rendering of the final Outro sequence.
- **Purpose**: Draws the closing Call-To-Action (CTA) scene.
- **Key Mechanics**:
  - **Faded Zodiac Ring**: Reuses the circular math from the Intro frame, but renders the icons highly transparent (`globalAlpha * 0.3`) as a textured background element. It calculates the rotation slightly differently to keep the icons orbiting without spinning individually.
  - **Center Text**: Renders the "Want a personalised reading?" text, manually splitting it onto two lines.
  - **Yellow Reveal Box**: Uses `ctx.clip()` and a `boxWidth` percentage state to create an animation where a yellow box expands horizontally from the center to reveal the URL "Visit starryvibes.ai" in black text over a gold background.

---

# UI & Legacy Components Explanation

The following files represent the original interactive preview tools, legacy frame renderers, and standard React UI layout components used during the design and testing phases of the application.

## 4. Layout & Navigation (`Header.jsx` & `LayoutWithHeader.jsx`)
- **`src/components/Header.jsx`**: A standard React navigation bar using `react-router-dom`'s `<NavLink>`. It features a responsive design with a hamburger menu for mobile devices, allowing navigation between the legacy preview tools (`Reel Canvas`, `Design`, `Frame Preview`).
- **`src/components/LayoutWithHeader.jsx`**: A layout wrapper component. It renders the `Header` at the top and provides an `<Outlet />` with top-padding (`pt-14`) to ensure the page content isn't hidden behind the fixed header.

## 5. `src/components/DraftFrame.js` (`renderDraftFrame`)
- **Purpose**: A "kitchen sink" rendering function used for early visual testing. It combines elements of both the Intro ring and the main Zodiac reading into a single, highly dense canvas draw function.
- **Usage**: It was primarily used by `DesignPreview.jsx` and `FramePreview.jsx` to test font sizes, placements, and text-wrapping logic before the animation sequence was strictly split into the `Intro -> Zodiac -> Outro` timeline flow.

## 6. `src/pages/DesignPreview.jsx`
- **Purpose**: An interactive visual testing tool for fine-tuning the look of the video frames.
- **Mechanics**:
  - Renders a `<canvas>` inside a 3-column layout.
  - **Left Panel**: Allows the user to select which specific frame to preview (`intro`, `zodiac`, `outro`) and manually trigger GSAP replays.
  - **Right Panel (`ToolPanel`)**: Renders dynamic sliders that allow real-time adjustments to specific font sizes (e.g., Title Text, Vibe Text, Section Labels).
  - **State Management**: Uses React state to immediately update a `fontConfig` object, saves it to `localStorage`, and forces a synchronous canvas redraw (`renderRef.current()`) so designers can see font changes instantly without restarting animations.

## 7. `src/pages/FramePreview.jsx`
- **Purpose**: A simplified version of the Design Preview used strictly for viewing the GSAP animation orchestration.
- **Mechanics**:
  - Lacks the complex font-size slider controls found in `DesignPreview`.
  - Focuses solely on executing the `createZodiacTimeline` and intro/outro timelines to ensure the mathematical timing and GSAP tweens (fades, typewriters, mask reveals) look correct at 30fps.