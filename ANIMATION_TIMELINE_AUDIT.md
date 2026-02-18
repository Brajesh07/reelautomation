# Animation Timeline Audit
**Project:** CanvaReel Astrology Animation  
**Date:** February 18, 2026  
**Purpose:** Complete breakdown of video timing and animation phases

---

## Master Timeline Overview

The video consists of five main sections sequenced linearly:

1. **IntroFrame** - Zodiac wheel introduction
2. **ZodiacFrame #1** - First zodiac sign details
3. **ZodiacFrame #2** - Second zodiac sign details
4. **ZodiacFrame #3** - Third zodiac sign details
5. **OutroFrame** - Closing call-to-action

---

## 1. IntroFrame Breakdown

### Animation Phases

| Phase | Duration | Start Time | End Time | Description |
|-------|----------|------------|----------|-------------|
| **1. Zodiac Fade-In + Rotation + Scale** | 3.5s | 0.0s | 3.5s | Circle fades in, scales from 0 to 1, rotates from -60° to 120° |
| **2. Text Animation (Typewriter)** | ~2.65s | 3.5s | ~6.15s | Five lines typed sequentially with stagger |
| - Line 1: "DAILY" | ~0.25s | 3.5s | ~3.75s | 5 chars × 0.05s = 0.25s |
| - Line 2: "HOROSCOPE" | ~0.50s | ~3.85s | ~4.35s | 10 chars × 0.05s + 0.1s stagger |
| - Line 3: "FOR" | ~0.15s | ~4.45s | ~4.60s | 3 chars × 0.05s + 0.1s stagger |
| - Line 4: Zodiac Names | Variable | ~4.70s | Variable | Length depends on names + 0.1s stagger |
| - Line 5: Date | ~0.75s | Variable | ~6.15s | ~15 chars × 0.05s + 0.2s stagger |
| **3. Hold Duration** | 3.0s | ~6.15s | ~9.15s | Static display at full opacity |
| **4. Fade-Out** | 1.5s | ~9.15s | ~10.65s | Opacity transitions to 0 |

### Total IntroFrame Duration
**~10.65 seconds** (varies slightly based on zodiac name length)

### Technical Notes
- **Initial State:** Scale = 0, Rotation = -60°, Opacity = 0
- **Final State:** Opacity = 0 (faded out)
- **Rotation Animation:** -60° → 120° (180° total rotation)
- **Scale Animation:** 0 → 1 (synchronized with rotation)
- **Typewriter Speed:** 0.05s per character
- **Text Stagger Timing:** 0.1s between lines (0.2s for final line)

---

## 2. ZodiacFrame Breakdown (Per Zodiac)

Each zodiac follows an identical animation pattern with configurable hold duration.

### Animation Phases (Single Zodiac)

| Phase | Duration | Cumulative Time | Description |
|-------|----------|-----------------|-------------|
| **1. Decorative Entry** (First only) | 1.5s | 0.0s - 1.5s | Heart, trophy, money bag, crystal ball fade up |
| **2. Zodiac Icon Entry** | 1.5s | 0.0s - 1.5s* | Icon slides in from left (-300px → 0), rotates (-360° → 0°), fades in |
| **3. Name Typewriter** | Variable | ~1.5s | Zodiac name typed at 0.1s per character |
| **4. Pause Before Vibe** | 0.3s | After name | Short pause |
| **5. Vibe Typewriter** | Variable | After pause | "Vibe: [text]" typed at 0.05s per character |
| **6. Love Section** | ~2.3s | After vibe + 0.3s | Label fade-up (0.8s) + Content mask reveal (1.2s) with 0.4s overlap |
| **7. Career Section** | ~1.6s | After Love - 0.8s | Label fade-up (0.8s) + Content mask reveal (1.2s) with 0.8s stagger overlap |
| **8. Money Section** | ~1.6s | After Career - 0.8s | Label fade-up (0.8s) + Content mask reveal (1.2s) with 0.8s stagger overlap |
| **9. Soul Message Section** | ~1.6s | After Money - 0.8s | Label fade-up (0.8s) + Content mask reveal (1.2s) with 0.8s stagger overlap |
| **10. Hold Duration** | 5.0s** | After sections | Static display of complete content |
| **11. Exit Transition** | 1.0s - 2.0s | After hold | Non-final: 1s fade; Final: 2s complete fade-out |

*\* Concurrent with decorative entry on first zodiac*  
*\*\* Configurable via `holdDuration` parameter (default: 5s, ReelCanvas uses 19s)*

### Section Animation Details

Each section (Love, Career, Money, Soul Message) follows this pattern:

1. **Label Appearance:** 
   - Opacity: 0 → 1 over 0.8s
   - Y-offset: +20px → 0px (fade-up effect)
   
2. **Content Reveal:**
   - Starts 0.4s before label completes (overlap)
   - Horizontal mask: 0% → 100% over 1.2s
   - Text and gold background revealed together

3. **Stagger Timing:**
   - First section: +0.3s delay after vibe
   - Subsequent sections: -0.8s overlap (start before previous completes)

### Estimated Timing per Zodiac

**With 5s Hold (DesignPreview configuration):**
- Decorative Entry (first only): 1.5s
- Icon Entry: 1.5s (concurrent with decorative)
- Name (~6 chars @ 0.1s): ~0.6s
- Pause: 0.3s
- Vibe (~25 chars @ 0.05s): ~1.25s
- Sections (4 × ~1.2s with stagger): ~5.0s
- Hold: 5.0s
- Exit: 1.0s (non-final) or 2.0s (final)

**Total per Zodiac (approx):**
- First Zodiac: ~15.15s
- Middle Zodiac: ~13.65s
- Last Zodiac: ~14.65s

**With 19s Hold (ReelCanvas configuration):**
- First Zodiac: ~29.15s
- Middle Zodiac: ~27.65s
- Last Zodiac: ~28.65s

### Total for 3 Zodiacs

| Configuration | Total Duration |
|---------------|----------------|
| 5s Hold | ~43.45 seconds |
| 19s Hold | ~85.45 seconds |

---

## 3. OutroFrame Breakdown

### Animation Phases

| Phase | Duration | Start Time | End Time | Description |
|-------|----------|------------|----------|-------------|
| **1. Zodiac Circle Entry** | 3.5s | 0.0s | 3.5s | Circle fades in, scales from 0 to 1, rotates from -60° to 120° |
| **2. Text Typewriter** | ~1.45s | 3.5s | ~4.95s | "Want a personalised reading?" typed at 0.05s/char |
| **3. Yellow Box Reveal** | 1.5s | ~4.95s | ~6.45s | Horizontal mask reveals box with "Visit starryvibes.ai" |
| **4. Hold Duration** | 3.0s | ~6.45s | ~9.45s | Static display |
| **5. Fade-Out** | 1.5s | ~9.45s | ~10.95s | Complete opacity fade to 0 |

### Total OutroFrame Duration
**~10.95 seconds**

### Technical Notes
- **Circle Animation:** Identical to IntroFrame (3.5s rotation + scale + fade)
- **Initial State:** Scale = 0, Rotation = -60°, Opacity = 0
- **Text:** "Want a personalised reading?" = 29 characters × 0.05s = 1.45s
- **Box Width:** 800px (full width)
- **Box Reveal:** Left to right horizontal mask (0% → 100%)
- **Box Color:** #DAC477 (gold)
- **Box Text:** "Visit starryvibes.ai" (visible at full size, revealed by mask)

---

## 4. Total Video Duration Summary

### Configuration A: 5s Hold per Zodiac (DesignPreview)

| Section | Duration |
|---------|----------|
| IntroFrame | ~10.65s |
| ZodiacFrame #1 | ~15.15s |
| ZodiacFrame #2 | ~13.65s |
| ZodiacFrame #3 | ~14.65s |
| OutroFrame | ~10.95s |
| **TOTAL** | **~65.05 seconds** |

### Configuration B: 19s Hold per Zodiac (ReelCanvas)

| Section | Duration |
|---------|----------|
| IntroFrame | ~10.65s |
| ZodiacFrame #1 | ~29.15s |
| ZodiacFrame #2 | ~27.65s |
| ZodiacFrame #3 | ~28.65s |
| OutroFrame | ~10.95s |
| **TOTAL** | **~107.05 seconds** |

---

## 5. Timeline Visualization

```
Configuration B Timeline (19s hold):

0s        IntroFrame        10.65s    ZodiacFrame #1     39.8s     ZodiacFrame #2     67.45s    ZodiacFrame #3     96.1s    OutroFrame        107.05s
|----------[==========]----------|---------[=============]---------|--------[=============]--------|--------[=============]--------|--------[==========]---------|
           Intro                         Zodiac 1                         Zodiac 2                         Zodiac 3                        Outro

Intro: Wheel spin → Text type → Hold → Fade
Zodiac: Deco fade → Icon slide → Name → Vibe → Love → Career → Money → Soul → Hold → Exit
Outro: Wheel spin → Text type → Box reveal → Hold → Fade
```

---

## 6. Key Animation Patterns

### Rotation Pattern
- **IntroFrame & OutroFrame:** -60° → 120° over 3.5s (180° total)
- **ZodiacFrame Icons:** -360° → 0° over 1.5s (single rotation)

### Fade Patterns
- **Entry Fades:** 1.5s - 3.5s (power2.out easing)
- **Exit Fades:** 1.0s - 2.0s (power2.inOut easing)
- **Section Labels:** 0.8s (power2.out easing)

### Typewriter Speed
- **Intro Text:** 0.05s per character
- **Zodiac Names:** 0.1s per character
- **Vibe Text:** 0.05s per character
- **Outro Text:** 0.05s per character

### Stagger Timing
- **Intro Text Lines:** 0.1s between lines (0.2s for final)
- **Zodiac Sections:** -0.8s overlap (start before previous completes)
- **First Section:** +0.3s delay after vibe completion

### Mask Animations
- **Section Content:** Horizontal mask 0% → 100% over 1.2s
- **Outro Box:** Horizontal mask 0% → 100% over 1.5s

---

## 7. Performance Notes

### Canvas Settings
- **Resolution:** 1080 × 1920 (9:16 vertical format)
- **Frame Rate:** 30 fps
- **Recording Quality:** 8 Mbps (VP9 codec)
- **Auto-stop Timer:** 200 seconds (fail-safe)

### Animation Engine
- **Library:** GSAP (GreenSock Animation Platform)
- **Timeline Type:** Sequential with labeled positions
- **Easing Functions:**
  - `power2.out` - Entry animations
  - `power2.in` - Exit animations
  - `power2.inOut` - Fade transitions
  - `power1.inOut` - Mask reveals
  - `none` - Typewriter effects (linear)

---

## 8. Variability Factors

The following elements cause timing variations:

1. **Zodiac Name Length:** Affects intro and per-zodiac duration
   - Example: "LEO" (3 chars) = 0.3s vs "SAGITTARIUS" (11 chars) = 1.1s

2. **Date String Length:** Affects intro duration
   - Typically 15-20 characters

3. **Vibe Text Length:** Affects per-zodiac duration
   - Variable length descriptions

4. **Section Content Length:** Affects vertical spacing (not duration)
   - Text wrapping adjusts box heights dynamically

5. **Hold Duration Configuration:** Controlled via `holdDuration` parameter
   - Current code: 19s in ReelCanvas.jsx line 248
   - DesignPreview default: 5s

---

## 9. Timing Accuracy

All durations are based on GSAP timeline analysis from source code:

- **Source Files Analyzed:**
  - [ReelCanvas.jsx](src/components/ReelCanvas.jsx) - Master timeline
  - [IntroFrame.js](src/frames/IntroFrame.js) - Intro rendering
  - [ZodiacFrame.js](src/frames/ZodiacFrame.js) - Zodiac timeline creation
  - [OutroFrame.js](src/frames/OutroFrame.js) - Outro rendering

- **Calculation Method:** Direct addition of GSAP duration values
- **Margin of Error:** ±0.1s due to character count variations
- **Concurrent Animations:** Accounted for (e.g., decorative + icon entry)

---

## 10. Recommended Optimizations

**Current Status:** Code analysis only, no modifications made.

Potential areas for timing adjustments (for future consideration):

1. **Hold Duration Consistency:** Currently 19s in ReelCanvas vs 5s in createZodiacTimeline
2. **Section Overlap:** Current -0.8s stagger creates smooth flow
3. **Exit Transitions:** Could extend to 1.5s for smoother final fade
4. **Typewriter Speed:** Current speeds feel natural and readable

---

**End of Animation Timeline Audit**
