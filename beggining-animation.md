# Zodiac Ring Animation — UI & React JS Specification

## Project Context
This animation represents all 12 zodiac signs forming a rotating circular ring.
The animation must feel luxury, smooth, premium, and be suitable for video export later.

---

## Animation Overview
- Background: Dark / black
- Total Zodiac Icons: 12
- Icons behave as a single group
- Rotation is applied to the group, not individual icons
- Individual zodiac icons must remain upright at all times

---

## Frame-by-Frame Animation Logic

### Frame-1 — Initial State
- Black / dark background
- All 12 zodiac icons present but scale: 0
- Opacity: 0
- Center point fixed as group anchor
- No rotation

---

### Frame-2 — Formation + Scale-In
- All zodiac icons appear simultaneously
- Arranged in a perfect circular ring
- Group scale: 0.6
- Group starts slow clockwise rotation
- Individual icons do NOT rotate

---

### Frame-3 — Hero Motion
- Zodiac ring reaches final position
- Group scales from 0.6 to 1
- Clockwise rotation slows and stops at scale 1
- Rotation only on group level
- Icons remain upright

---

## Geometry Logic
angle = (360 / 12) * index
x = centerX + radius * cos(angle)
y = centerY + radius * sin(angle)

---

## Recommended Timing
Frame-1 to Frame-2: 1.2s
Frame-2 to Frame-3: 1.5s
Total Duration: ~3s

---

## React Component Structure
ZodiacRing
 └── zodiac-container
     ├── zodiac-item (x12)

---

## Styling Notes
- Use transform-origin: center center
- Responsive radius based on viewport

---

## GSAP Animation Notes
- Use timeline
- No looping
- Deterministic motion only

---

## Developer Rules
- Do NOT rotate individual icons
- Stop rotation exactly at scale 1
- Export friendly (Puppeteer / FFmpeg)

---

## End of File
