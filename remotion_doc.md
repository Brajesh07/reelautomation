# CanvaReel — Remotion Project Documentation

## What This Project Is

CanvaReel is a **Remotion-based video generator** that produces a vertical (1080×1920, 9:16) astrology reel video. Given a JSON data file with zodiac sign readings, it automatically composes a full video with:

- An animated intro scene
- One personalised zodiac scene per sign in the data
- A call-to-action outro scene

The output is a production-ready MP4 reel, rendered entirely in code — no manual editing required.

---

## Stack

| Layer             | Technology                            |
| ----------------- | ------------------------------------- |
| Video composition | [Remotion](https://www.remotion.dev/) |
| UI components     | React (JSX)                           |
| Styling           | Inline CSS-in-JS                      |
| Animation         | Remotion `interpolate` + `Easing`     |
| Build / preview   | Vite                                  |
| Export            | Remotion CLI / custom scripts         |
| Data              | `public/data.json`                    |

---

## How to Run

```bash
# Install dependencies
npm install

# Open Remotion Studio (live preview with scrubbing)
npm run preview

# Render to MP4
npx remotion render src/remotion/index.jsx AstrologyReel out/video.mp4
```

---

## Data Contract

All content comes from `public/data.json`. The schema is:

```json
{
  "zodiacs": [
    {
      "name": "Scorpio",
      "vibe": "Short tagline string.",
      "love": "Multi-line string. Use \\n for line breaks.",
      "career": "...",
      "money": "...",
      "soulMessage": "..."
    }
  ]
}
```

- **`name`** must exactly match one of the 12 canonical zodiac names (Aries, Taurus, … Pisces). This is used to look up the matching icon in `assets.js`.
- The number of entries in `zodiacs` directly controls total video length — the composition duration is computed dynamically in `Root.jsx`.
- Add, remove, or reorder entries freely. The video will adjust automatically.

---

## Total Video Duration

With 3 zodiacs the video is **1380 frames = 46 seconds @ 30 fps**.

```
240 (intro) + 3 × 340 (zodiac) + 120 (outro) = 1380 frames
```

The formula lives in `Root.jsx`:

```js
const totalDuration =
  INTRO_DURATION +
  data.zodiacs.length * ZODIAC_SEQUENCE_DURATION +
  OUTRO_DURATION;
```

---

## Visual Design System

All colours, font sizes, and spacing are centralised in `src/remotion/theme.js`.

| Token                       | Value             | Used for                         |
| --------------------------- | ----------------- | -------------------------------- |
| `colors.background`         | `#000000`         | All scene backgrounds            |
| `colors.primary`            | `#FFFFFF`         | Body text                        |
| `colors.accent`             | `#DAC477`         | Titles, zodiac names, yellow box |
| `typography.fontFamily`     | `Garamond, serif` | All text                         |
| `typography.titleSize`      | `70px`            | Main headings (Intro / Outro)    |
| `typography.bodySize`       | `50px`            | Supporting text                  |
| `typography.outroTitleSize` | `50px`            | CTA text inside yellow box       |

---

## Animation Primitives

Every animation in this project uses exactly two Remotion primitives:

### `interpolate(frame, inputRange, outputRange, options)`

Maps the current frame number to a CSS value. For example:

```js
const opacity = interpolate(frame, [0, 30], [0, 1], {
  extrapolateRight: "clamp",
});
```

Frame 0 → opacity 0. Frame 30 → opacity 1. Frames above 30 stay clamped at 1.

### `Easing`

Passed as `easing` inside the options object to shape the curve:

```js
// Used for zodiac icon entry — fast then slow
easing: Easing.out(Easing.cubic);

// Used for all yellow box expansions — snappy overshoot
easing: Easing.bezier(0.33, 1, 0.68, 1);
```

---

## Typewriter Pattern

Reused identically across Intro, Zodiac, and Outro scenes:

```js
const progress = interpolate(frame, [start, end], [0, 1], {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
});
const visibleText = fullString.slice(
  0,
  Math.floor(progress * fullString.length),
);
```

Render `visibleText` in JSX. No third-party library needed.

---

## Yellow Box Reveal Pattern

Used in `ZodiacSection` and mirrored in `OutroSegment`:

```js
const boxScale = interpolate(frame, [start, end], [0, 1], {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
  easing: Easing.bezier(0.33, 1, 0.68, 1),
});
```

Two elements overlap:

1. A `div` with `backgroundColor: accent`, `transformOrigin: 'left'`, `transform: scaleX(boxScale)` — the expanding yellow fill.
2. A `<p>` with `clipPath: inset(0 ${100 - boxScale * 100}% 0 0)` — text revealed in sync with the box.

---

## Phase System

Each scene defines a `PHASES` object that maps named stages to `{ start, end }` frame numbers. All `interpolate` calls reference these constants — never raw numbers. This makes timing changes a single-line edit.

```js
const PHASES = {
  DECORATIVE: { start: 0,   end: 30  },
  ICON:       { start: 0,   end: 45  },
  NAME:       { start: 45,  end: 75  },
  ...
  EXIT:       { start: 310, end: 340 },
};
```

---

## Scene Sequence

```
Series
├── Series.Sequence [240 frames]  → IntroSegment
├── Series.Sequence [340 frames]  → ZodiacSegment (Scorpio)
├── Series.Sequence [340 frames]  → ZodiacSegment (Libra)
├── Series.Sequence [340 frames]  → ZodiacSegment (Sagittarius)
└── Series.Sequence [120 frames]  → OutroSegment
```

Each `Series.Sequence` resets `useCurrentFrame()` to 0 for its child component. Every segment's animation phases are written in local frame numbers starting from 0.

---

## Key Rule: No Idle Frames

Every `Series.Sequence durationInFrames` must equal the `EXIT.end` value of its segment. The sequence ends the instant the fade-out completes. There are no extra buffer frames.

| Segment       | `EXIT.end` | `durationInFrames` |
| ------------- | ---------- | ------------------ |
| IntroSegment  | frame 240  | 240                |
| ZodiacSegment | frame 340  | 340                |
| OutroSegment  | frame 120  | 120                |
