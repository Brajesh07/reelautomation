# CanvaReel — README

> Remotion-based vertical astrology reel video generator.  
> Input: `public/data.json` → Output: MP4 (1080×1920, 9:16, 30fps)

---

## Quick Start

```bash
npm install
npm run preview        # Open Remotion Studio with live scrubbing
```

---

## Generate a Video

```bash
# Render to MP4
npx remotion render remotion.index.jsx AstrologyReel out/video.mp4

# Render specific frame range (useful for testing)
npx remotion render remotion.index.jsx AstrologyReel out/video.mp4 --frames=0-240
```

---

## Change the Content

Edit `public/data.json`:

```json
{
  "zodiacs": [
    {
      "name": "Scorpio",
      "vibe": "Short tagline for this sign.",
      "love": "Love reading text.",
      "career": "Career reading text.",
      "money": "Money reading text.",
      "soulMessage": "Soul message text."
    }
  ]
}
```

- Add or remove entries to change the number of zodiac scenes.
- Total video duration is computed automatically.
- `name` must be one of: `Aries Taurus Gemini Cancer Leo Virgo Libra Scorpio Sagittarius Capricorn Aquarius Pisces`
- Use `\n` in strings for line breaks inside yellow boxes.

---

## Project Structure

```
src/remotion/          ← Video composition (Main.jsx, segments, components)
src/frames/            ← Legacy canvas renderers (export scripts only)
src/images/            ← All PNG assets
public/data.json       ← All video content
remotion.index.jsx     ← Remotion entry point
```

---

## Documentation

| File                                                 | Contents                                                             |
| ---------------------------------------------------- | -------------------------------------------------------------------- |
| [remotion_doc.md](remotion_doc.md)                   | Project overview, data contract, design system, animation primitives |
| [remotion_architecture.md](remotion_architecture.md) | File structure, component tree, data flow, sync points               |
| [remotion_logic.md](remotion_logic.md)               | Phase system, interpolation patterns, every animation explained      |
| [remotion_timing.md](remotion_timing.md)             | Full frame-by-frame timeline, duration constants, scaling table      |
