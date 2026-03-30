# CanvaReel — Remotion Animation Logic

## Core Principle

Every animation value in this project is derived from a single source: `useCurrentFrame()`. There is no `useState`, no `useEffect`, no GSAP, no timers. The current frame number is the only input.

```
frame number → interpolate() → CSS value → React renders it
```

Remotion calls the React component on every frame. The component is a pure function of the frame number. This makes every animation scrubable, reproducible, and exportable.

---

## interpolate() — How It Works

```js
const value = interpolate(
  frame,
  [inputStart, inputEnd],
  [outputStart, outputEnd],
  options,
);
```

- Maps `frame` linearly from the input range to the output range.
- `extrapolateLeft: 'clamp'` — value stays at `outputStart` for frames below `inputStart`.
- `extrapolateRight: 'clamp'` — value stays at `outputEnd` for frames above `inputEnd`.
- `easing` — applies a curve function to the interpolation.

**Example — fade in over 30 frames:**

```js
const opacity = interpolate(frame, [0, 30], [0, 1], {
  extrapolateRight: "clamp",
});
// frame 0  → 0.0
// frame 15 → 0.5
// frame 30 → 1.0
// frame 60 → 1.0  (clamped)
```

---

## Easing Functions Used

### `Easing.out(Easing.cubic)`

Used for zodiac icon entry (slide-in + spin). Fast at the start, decelerates to a stop. Feels physical and snappy.

```js
// icon slides in from -300px to 0 with deceleration
const iconX = interpolate(frame, [0, 45], [-300, 0], {
  extrapolateRight: "clamp",
  easing: Easing.out(Easing.cubic),
});
```

### `Easing.bezier(0.33, 1, 0.68, 1)`

Used for all yellow box expansions. This is a CSS `cubic-bezier` equivalent — slight overshoot then settle. Creates a satisfying "pop" on the box reveal.

```js
const boxScaleX = interpolate(frame, [start, end], [0, 1], {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
  easing: Easing.bezier(0.33, 1, 0.68, 1),
});
```

### Linear (default, no easing specified)

Used for fade-outs and typewriter progress. Clean and predictable.

---

## Phase System

Every scene defines a `PHASES` constant object at the top of the component file. Each phase has `{ start, end }` frame numbers relative to that segment's local clock (which always starts at 0).

```js
const PHASES = {
  DECORATIVE: { start: 0, end: 30 },
  ICON: { start: 0, end: 45 },
  NAME: { start: 45, end: 75 },
  VIBE: { start: 75, end: 120 },
  SECTIONS: {
    LOVE: { start: 120, end: 157 },
    CAREER: { start: 151, end: 188 },
    MONEY: { start: 182, end: 219 },
    SOUL: { start: 213, end: 250 },
  },
  HOLD: { start: 250, end: 310 },
  EXIT: { start: 310, end: 340 },
};
```

**Rules:**

- Phases can overlap intentionally (e.g. DECORATIVE and ICON both start at 0).
- `EXIT.end` **is** the sequence duration. The `Series.Sequence durationInFrames` must equal this value.
- Never reference raw frame numbers in `interpolate` calls — always use `PHASES.X.start` / `PHASES.X.end`.

---

## IntroSegment — Phase Breakdown

**Total: 240 frames (8 seconds)**

| Phase               | Frames    | What happens                                                        |
| ------------------- | --------- | ------------------------------------------------------------------- |
| Ring entrance       | 0 → 90    | Ring fades in and scales from 0 to 1                                |
| Ring rotation       | 0 → 150   | Ring completes one full 360° rotation                               |
| Title typewriter    | 60 → 90   | "DAILY / HOROSCOPE / FOR" types in (staggered, 10 frames each line) |
| Zodiac names typing | 120 → 150 | All zodiac names in data type in as one string                      |
| Date fade-in        | 140 → 150 | Date string fades in                                                |
| Hold                | 150 → 180 | Everything visible, no animation                                    |
| Fade-out            | 180 → 240 | Global opacity 1→0, scale 1→0.95                                    |

**ZodiacRing behaviour in Intro:**

- `highlightedNames` = all names from data → matching icons render at opacity 1, others at 0.4
- Creates a visual spotlight effect on the featured signs

---

## ZodiacSegment — Phase Breakdown

**Total: 340 frames (~11.3 seconds) — one segment, repeated per zodiac**

| Phase            | Frames    | What happens                                                          |
| ---------------- | --------- | --------------------------------------------------------------------- |
| Decorative entry | 0 → 30    | Heart/trophy/money bag/crystal ball slide up from bottom, fade to 0.4 |
| Icon entry       | 0 → 45    | Zodiac icon slides in from -300px left + spins 360° (eased cubic)     |
| Name typing      | 45 → 75   | Zodiac name types character by character                              |
| Vibe typing      | 75 → 120  | "Vibe: [tagline]" types character by character                        |
| LOVE section     | 120 → 157 | Label fades in, yellow box expands, text reveals                      |
| CAREER section   | 151 → 188 | Same, staggered 31 frames after LOVE starts                           |
| MONEY section    | 182 → 219 | Same, staggered 31 frames after CAREER                                |
| SOUL section     | 213 → 250 | Same, staggered 31 frames after MONEY                                 |
| Hold             | 250 → 310 | All content visible, user reading time                                |
| Exit fade-out    | 310 → 340 | Global opacity 1→0 — everything fades together                        |

**Section stagger:** Each section starts while the previous one is still expanding (they overlap by ~6 frames). This creates a fluid cascading reveal rather than a step-by-step sequence.

**Decorative icons:** These are background atmosphere only — opacity is capped at 0.4, they slide up from `translateY(50px)` to 0. They live in their own `div` and never interfere with foreground content.

**Debug overlay:** A frame counter overlay (`Frame: X | Phase: Y`) is rendered in the top-left corner in development. Remove or hide it for final export.

---

## ZodiacSection — Internal Logic

Each of the 4 content rows (LOVE, CAREER, MONEY, SOUL) is rendered by `ZodiacSection`. It receives its `phase` object from the parent and computes everything internally.

```
frame = useCurrentFrame()  ← this is the SAME clock as ZodiacSegment
                             (ZodiacSection is a child, not a Sequence child)
phase = { start: 120, end: 157 }  ← for LOVE
```

Because `ZodiacSection` is a regular React component (not wrapped in its own `Series.Sequence`), it shares the same frame clock as `ZodiacSegment`. The `phase` prop tells it which window of that shared clock it should animate within.

```js
// Label animation — first 15 frames of the phase
labelOpacity = interpolate(frame, [phase.start, phase.start + 15], [0, 1], ...)

// Box expansion — from phase.start+5 to phase.end
boxScaleX = interpolate(frame, [phase.start + 5, phase.end], [0, 1], ...)
```

---

## OutroSegment — Phase Breakdown

**Total: 120 frames (4 seconds)**

| Phase             | Frames   | What happens                                      |
| ----------------- | -------- | ------------------------------------------------- |
| Ring entrance     | 0 → 30   | Ring fades from 0 to 0.4 opacity, scales 0→1      |
| Ring rotation     | 0 → 120  | Continuous 360° over full segment                 |
| Line 1 typing     | 30 → 65  | "Want a personalised reading?" types in           |
| CTA box expansion | 60 → 85  | Yellow box expands (same Bezier as ZodiacSection) |
| Hold              | 85 → 90  | Brief static hold                                 |
| Exit fade-out     | 90 → 120 | Global opacity 1→0, scale 1→0.95                  |

**Uniform ring opacity trick:** The ring is passed `opacity={ringOpacity}` where `ringOpacity` interpolates 0→0.4. All 12 icons share this wrapper opacity uniformly. `highlightedNames={[]}` is passed with `nonHighlightOpacity={1}`, which means ZodiacRing's highlight logic never fires — each icon gets `itemOpacity = 1`, and the uniform dimming is achieved entirely via the wrapper `opacity` prop.

---

## Typewriter Pattern — Exact Implementation

```js
const fullString = "Text to reveal";
const progress = interpolate(frame, [startFrame, endFrame], [0, 1], {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
});
const visibleText = fullString.slice(
  0,
  Math.floor(progress * fullString.length),
);
```

- `Math.floor` ensures only whole characters are ever shown (no fractional slices).
- Staggering multiple lines: each line uses a shifted `[startFrame, endFrame]` window.
- The string renders at 0 characters before `startFrame` and full string after `endFrame`.

---

## Yellow Box Reveal Pattern — Exact Implementation

Two sibling elements share the same parent `div` with `overflow: hidden`:

```jsx
{
  /* 1. Expanding background fill */
}
<div
  style={{
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: theme.colors.accent,
    transformOrigin: "left",
    transform: `scaleX(${boxScaleX})`, // grows left to right
  }}
/>;

{
  /* 2. Text clipped to match box width */
}
<p
  style={{
    position: "relative",
    color: "#000",
    clipPath: `inset(0 ${100 - boxScaleX * 100}% 0 0)`, // clips right edge
  }}
>
  {content}
</p>;
```

- `scaleX` is applied via CSS transform on the background div.
- `clipPath: inset(0 X% 0 0)` clips the text from the right edge. As `boxScaleX` goes 0→1, `X` goes 100%→0%, revealing the text perfectly in sync with the background.
- `transformOrigin: 'left'` ensures the box always grows from the left edge.

---

## ZodiacRing — Rotation Calculation

The ring does **not** use CSS `transform: rotate` on the ring container. Instead, each icon's `left` and `top` position is recalculated every frame using trigonometry:

```js
const angleDeg = (360 / 12) * index; // base position: 30° per icon
const angleRad = (angleDeg + rotation) * (Math.PI / 180); // add rotation offset

const x = 450 * Math.cos(angleRad); // radius = 450px
const y = 450 * Math.sin(angleRad);
```

By adding the `rotation` prop to `angleDeg` before converting to radians, every icon orbits around the center while its own `<img>` tag stays upright (no `transform: rotate` applied to individual icons).

---

## Global Exit Pattern

Every segment ends with the exact same fade-out pattern applied to a single wrapper `div`:

```jsx
// Computed values
const globalExitOpacity = interpolate(frame, [EXIT.start, EXIT.end], [1, 0], {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
});
const globalExitScale = interpolate(frame, [EXIT.start, EXIT.end], [1, 0.95], {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
});

// Applied to the root wrapper
<div
  style={{ opacity: globalExitOpacity, transform: `scale(${globalExitScale})` }}
>
  {/* entire scene content */}
</div>;
```

Rules enforced by this pattern:

- Single animation — one opacity + one scale, no per-element stagger on exit.
- No reverse animation — values only go 1→0, never back up.
- Fades to black — at `opacity: 0` the black `AbsoluteFill` background shows through.
- `EXIT.end` === `durationInFrames` — sequence ends exactly when opacity reaches 0.

---

## Adding a New Zodiac Entry

1. Add a new object to `public/data.json` with all required fields.
2. The `name` must exactly match a key in `ZODIAC_IMAGES` in `assets.js`.
3. `Root.jsx` automatically recalculates total duration — no code changes needed.
4. `Main.jsx` automatically creates a new `Series.Sequence` for the entry — no code changes needed.

---

## Changing Animation Duration of a Segment

If you need to make a zodiac segment longer or shorter:

1. Edit `PHASES` in `ZodiacSegment.jsx` — adjust all phase boundaries as needed.
2. `PHASES.EXIT.end` becomes the new segment duration.
3. Update `ZODIAC_SEQUENCE_DURATION` in `Main.jsx` to match.
4. Update `ZODIAC_SEQUENCE_DURATION` in `Root.jsx` to match.
5. The total video duration recalculates automatically.
