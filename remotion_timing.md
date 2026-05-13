# CanvaReel — Timing Reference

This document is the single reference for all frame numbers, durations, and absolute timestamps in the video. Update this whenever `PHASES` values change in any segment.

**FPS: 30** | **Canvas: 1080 × 1920** | **Aspect: 9:16 (vertical)**

---

## Full Video Timeline

With 3 zodiacs (Scorpio, Libra, Sagittarius):

| Segment                     | Absolute Frames | Absolute Time      | Local Duration  |
| --------------------------- | --------------- | ------------------ | --------------- |
| IntroSegment                | 0 – 239         | 0.00s – 7.97s      | 240 frames      |
| ZodiacSegment (Scorpio)     | 240 – 579       | 8.00s – 19.30s     | 340 frames      |
| ZodiacSegment (Libra)       | 580 – 919       | 19.33s – 30.63s    | 340 frames      |
| ZodiacSegment (Sagittarius) | 920 – 1259      | 30.67s – 41.97s    | 340 frames      |
| OutroSegment                | 1260 – 1379     | 42.00s – 45.97s    | 120 frames      |
| **Total**                   | **0 – 1379**    | **0.00s – 45.97s** | **1380 frames** |

Formula: `240 + (N × 340) + 120` where N = number of zodiacs in `data.json`.

---

## SingleZodiacReel Timeline

**Total Duration: 700 frames | 23.33 seconds**

| Segment             | Frames  | Time           |
| ------------------- | ------- | -------------- |
| IntroSingle         | 0 - 239 | 0.0s - 8.0s    |
| ZodiacSingleSegment | 240-579 | 8.0s - 19.33s  |
| OutroSingle         | 580-699 | 19.33s - 23.3s |

---

## IntroSegment Internal Phases

**Sequence duration: 240 frames | 8.0 seconds**

| Phase                | Start Frame | End Frame | Duration | Absolute Time     |
| -------------------- | ----------- | --------- | -------- | ----------------- |
| Ring fade-in + scale | 0           | 90        | 90       | 0.00s → 3.00s     |
| Ring rotation (360°) | 0           | 150       | 150      | 0.00s → 5.00s     |
| "DAILY" types        | 60          | 70        | 10       | 2.00s → 2.33s     |
| "HOROSCOPE" types    | 70          | 80        | 10       | 2.33s → 2.67s     |
| "FOR" types          | 80          | 90        | 10       | 2.67s → 3.00s     |
| Zodiac names typing  | 120         | 150       | 30       | 4.00s → 5.00s     |
| Date fade-in         | 140         | 150       | 10       | 4.67s → 5.00s     |
| Hold (all visible)   | 150         | 180       | 30       | 5.00s → 6.00s     |
| **Fade-out (EXIT)**  | **180**     | **240**   | **60**   | **6.00s → 8.00s** |

---

## ZodiacSegment Internal Phases

**Sequence duration: 340 frames | 11.33 seconds (per zodiac)**

| Phase                  | Start Frame | End Frame | Duration | Local Time          |
| ---------------------- | ----------- | --------- | -------- | ------------------- |
| Decorative icons entry | 0           | 30        | 30       | 0.00s → 1.00s       |
| Icon slide-in + spin   | 0           | 45        | 45       | 0.00s → 1.50s       |
| Name typing            | 45          | 75        | 30       | 1.50s → 2.50s       |
| Vibe typing            | 75          | 120       | 45       | 2.50s → 4.00s       |
| LOVE section reveal    | 120         | 157       | 37       | 4.00s → 5.23s       |
| CAREER section reveal  | 151         | 188       | 37       | 5.03s → 6.27s       |
| MONEY section reveal   | 182         | 219       | 37       | 6.07s → 7.30s       |
| SOUL section reveal    | 213         | 250       | 37       | 7.10s → 8.33s       |
| Hold (reading time)    | 250         | 310       | 60       | 8.33s → 10.33s      |
| **Fade-out (EXIT)**    | **310**     | **340**   | **30**   | **10.33s → 11.33s** |

**Section overlap:** CAREER starts at frame 151 while LOVE ends at 157 — 6 frames of overlap. This creates a flowing cascade rather than step-by-step reveals.

---

## OutroSegment Internal Phases

**Sequence duration: 120 frames | 4.0 seconds**

| Phase                | Start Frame | End Frame | Duration | Local Time        |
| -------------------- | ----------- | --------- | -------- | ----------------- |
| Ring fade-in + scale | 0           | 30        | 30       | 0.00s → 1.00s     |
| Ring rotation (360°) | 0           | 120       | 120      | 0.00s → 4.00s     |
| Line 1 typing        | 30          | 65        | 35       | 1.00s → 2.17s     |
| CTA box expansion    | 60          | 85        | 25       | 2.00s → 2.83s     |
| Hold                 | 85          | 90        | 5        | 2.83s → 3.00s     |
| **Fade-out (EXIT)**  | **90**      | **120**   | **30**   | **3.00s → 4.00s** |

---

## Duration Constants — Where They Live

```
Root.jsx
  INTRO_DURATION          = 240   ← must equal IntroSegment EXIT.end (frame 240)
  ZODIAC_SEQUENCE_DURATION = 340  ← must equal ZodiacSegment PHASES.EXIT.end (frame 340)
  OUTRO_DURATION          = 120   ← must equal OutroSegment PHASES.EXIT.end (frame 120)

Main.jsx
  introDuration           = 240
  ZODIAC_SEQUENCE_DURATION = 340
  outroDuration           = 120
```

---

## Adding More Zodiacs

Changing the number of entries in `public/data.json` changes total video length automatically.

| Zodiacs | Total Frames | Total Duration |
| ------- | ------------ | -------------- |
| 1       | 700          | 23.3s          |
| 2       | 1040         | 34.7s          |
| 3       | 1380         | 46.0s          |
| 4       | 1720         | 57.3s          |
| 6       | 2400         | 80.0s          |
| 12      | 4440         | 148.0s         |

---

## Frame-to-Time Conversion

```
seconds = frames / 30
frames  = seconds × 30
```

| Frames | Time   |
| ------ | ------ |
| 30     | 1.0s   |
| 60     | 2.0s   |
| 90     | 3.0s   |
| 120    | 4.0s   |
| 150    | 5.0s   |
| 240    | 8.0s   |
| 300    | 10.0s  |
| 340    | 11.33s |
| 600    | 20.0s  |
