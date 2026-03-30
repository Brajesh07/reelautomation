# CanvaReel — Remotion Architecture

## Folder Structure

```
CanvaReel/
├── public/
│   └── data.json               ← All video content (zodiac readings)
│
├── src/
│   ├── remotion/               ← Everything Remotion touches
│   │   ├── Root.jsx            ← Composition registration + total duration calc
│   │   ├── Main.jsx            ← Series orchestrator — stitches all sequences
│   │   ├── IntroSegment.jsx    ← Intro scene (240 frames)
│   │   ├── ZodiacSegment.jsx   ← Per-zodiac scene (340 frames each)
│   │   ├── OutroSegment.jsx    ← Outro/CTA scene (120 frames)
│   │   ├── ZodiacRing.jsx      ← Reusable 12-icon orbital ring component
│   │   ├── ZodiacSection.jsx   ← Reusable yellow-box section row component
│   │   ├── assets.js           ← ZODIAC_IMAGES map (name → imported PNG)
│   │   └── theme.js            ← Design tokens (colours, fonts, spacing)
│   │
│   ├── frames/                 ← Canvas-based frame renderers (legacy / export path)
│   │   ├── IntroFrame.js
│   │   ├── ZodiacFrame.js
│   │   ├── OutroFrame.js
│   │   └── DraftFrame.js
│   │
│   ├── images/                 ← All PNG assets (zodiac icons + decorative)
│   ├── fonts/                  ← Custom font files
│   ├── components/             ← Shared React UI components (non-Remotion)
│   ├── pages/                  ← Vite app pages (preview / upload tools)
│   ├── utils/                  ← Utility helpers (date formatting etc.)
│   ├── context/                ← React context providers
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
│
├── remotion.index.jsx          ← Remotion entry point (registers Root)
├── vite.config.js
├── package.json
└── public/data.json
```

---

## Component Tree

```
RemotionRoot  (Root.jsx)
└── Composition "AstrologyReel"
    └── Main  (Main.jsx)
        └── Series
            ├── Series.Sequence [240]
            │   └── IntroSegment
            │       └── ZodiacRing          ← shared ring component
            │
            ├── Series.Sequence [340] × N   (one per zodiac in data.json)
            │   └── ZodiacSegment
            │       └── ZodiacSection × 4   ← LOVE / CAREER / MONEY / SOUL
            │
            └── Series.Sequence [120]
                └── OutroSegment
                    └── ZodiacRing          ← same shared ring component
```

---

## Data Flow

```
public/data.json
      │
      ▼
Root.jsx  (imports JSON at build time via ES import)
      │   computes totalDuration
      ▼
Composition defaultProps → { zodiacs: [...] }
      │
      ▼
Main.jsx  receives zodiacs[]
      │   maps → one ZodiacSegment per entry
      ▼
ZodiacSegment  receives { name, vibe, zodiacData }
      │
      ├── ZODIAC_IMAGES[name]   → icon PNG  (assets.js)
      └── zodiacData.love / .career / .money / .soulMessage → ZodiacSection props
```

No runtime fetch. No state management. No context. Everything is pure props and frame-derived values.

---

## Root.jsx — Composition Registration

```jsx
const INTRO_DURATION = 240; // frames
const ZODIAC_SEQUENCE_DURATION = 340; // frames — must match ZodiacSegment PHASES.EXIT.end
const OUTRO_DURATION = 120; // frames — must match OutroSegment PHASES.EXIT.end

const totalDuration =
  INTRO_DURATION +
  data.zodiacs.length * ZODIAC_SEQUENCE_DURATION +
  OUTRO_DURATION;
```

`Composition` is the Remotion equivalent of "create a video with these dimensions and this component as content". There is exactly one composition: `AstrologyReel`.

---

## Main.jsx — Series Orchestrator

`Series` from Remotion is a layout primitive. Each `Series.Sequence` child:

- Receives its own isolated frame clock (starts at 0)
- Is rendered only while the global frame is within its window
- Is skipped entirely outside that window (zero cost)

`durationInFrames` on each sequence **must** match the internal animation end of its segment. Any extra frames = blank black canvas being rendered unnecessarily.

---

## ZodiacRing.jsx — Shared Ring Component

```
Props:
  rotation         number   Current rotation angle in degrees (driven by interpolate in parent)
  scale            number   CSS scale applied to AbsoluteFill wrapper
  opacity          number   CSS opacity applied to AbsoluteFill wrapper
  highlightedNames string[] Names that should render at full opacity
  nonHighlightOpacity number  Opacity for non-highlighted icons (default 0.4)
```

Positioning math (mirrors `IntroFrame.js` canvas logic exactly):

```
angleDeg = (360 / 12) * index          → 30° apart
angleRad = (angleDeg + rotation) × π/180
x = 450 × cos(angleRad)                → radius = 450px
y = 450 × sin(angleRad)
```

Icons are positioned with `position: absolute`, `left: centerX + x`, `top: centerY + y`. The ring itself never rotates via CSS `transform: rotate` — individual icon positions are recalculated every frame from the updated `rotation` prop. This keeps every icon **upright** (no individual spin).

**Highlight logic:**

- If `highlightedNames` is empty → all icons render at `itemOpacity = 1`
- If `highlightedNames` has entries → non-matching icons get `itemOpacity = nonHighlightOpacity`
- `OutroSegment` passes `highlightedNames={[]}` and controls uniform opacity via the wrapper's `opacity` prop (interpolated to 0.4), bypassing this logic entirely.

---

## ZodiacSection.jsx — Yellow Box Row

Reusable component used 4× per `ZodiacSegment` (LOVE, CAREER, MONEY, SOUL MESSAGE).

```
Props:
  title    string   Section label (rendered in accent gold above the box)
  content  string   Body text (rendered inside the yellow box)
  phase    { start: number, end: number }   Frame window for this section's animation
```

Animation:

1. **Label** fades in + slides up 10px over first 15 frames of its phase
2. **Box** expands `scaleX` 0→1 from `phase.start + 5` to `phase.end` using `Easing.bezier(0.33, 1, 0.68, 1)`
3. **Text** is revealed in sync using `clipPath: inset(0 X% 0 0)` where X decreases as the box expands

---

## assets.js — Image Map

Maps canonical zodiac name strings to imported PNG modules:

```js
export const ZODIAC_IMAGES = {
  Aries: aries,   // imported PNG
  ...
};
```

Usage: `ZODIAC_IMAGES[name]` where `name` comes from `data.json`. If a name doesn't match, `imgSrc` is `undefined` and `ZodiacRing` renders a fallback grey circle with the first letter.

---

## theme.js — Design Tokens

Single source of truth for all visual values. Import wherever needed:

```js
import { theme } from "./theme";

theme.colors.background; // '#000000'
theme.colors.accent; // '#DAC477'  ← gold
theme.typography.fontFamily; // 'Garamond, serif'
theme.typography.titleSize; // '70px'
```

Never hardcode colours or font sizes in components. Always reference theme tokens.

---

## Frame vs Canvas Renderers

The `src/frames/` directory contains `renderXxxFrame` canvas functions (`IntroFrame.js`, `ZodiacFrame.js`, etc.). These are the **legacy Canvas 2D render path** used by the manual export scripts in `scripts/`. The Remotion composition pipeline in `src/remotion/` is the **primary path** and does not call these functions. The two pipelines are independent.

---

## Sync Points — Critical Constants

These three values must always be consistent across files:

| Constant                   | File       | Value | Must match                                     |
| -------------------------- | ---------- | ----- | ---------------------------------------------- |
| `ZODIAC_SEQUENCE_DURATION` | `Main.jsx` | `340` | `PHASES.EXIT.end` in `ZodiacSegment.jsx`       |
| `ZODIAC_SEQUENCE_DURATION` | `Root.jsx` | `340` | Same as above                                  |
| `outroDuration`            | `Main.jsx` | `120` | `PHASES.EXIT.end` in `OutroSegment.jsx`        |
| `introDuration`            | `Main.jsx` | `240` | Fade-out end in `IntroSegment.jsx` (frame 240) |

If you change the animation timing of any segment, update both the segment's `PHASES.EXIT.end` **and** the matching duration constant in `Main.jsx` and `Root.jsx`.
