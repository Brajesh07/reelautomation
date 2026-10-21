# PROJECT_ARCHITECTURE — Astrology Reel Automation (`CanvaReel` / `StarryVibes`)

**Last verified:** 2026-10-21 against `main` @ `8b459a4` ("vercel route issue")
**Verification method:** full source read + `yarn build` + live dev-server walkthrough + real renders in Chrome — 2 single reels and a 2-sign group reel — with durations, dimensions and frame content read back from the produced MP4s.

> This document describes what the code **actually does today**. Several older docs in this repo (`README.md`, `Project_doc.md`, `New_project_summary.md`, `file_explaination.md`) describe an earlier design and are **wrong in specific, listed ways** — see §6.5 Documentation drift. Trust this file.

---

## 0. Ground truth in ten lines

- It is a **100% client-side, static React SPA**. There is no backend, no server API, no database service, no auth, and no third-party network integration.
- Input: a **JSON file** describing 1–12 zodiac entries.
- Output: **one 1080×1920 H.264 MP4 per render task**, encoded **in the browser** with `@ffmpeg/ffmpeg` (WASM). A task is either a **single reel** (intro → 1 zodiac card → outro, ~31.75 s) or a **group reel** (intro → N cards → outro, ~31.75 s + 13.1 s per extra card; a 2-sign group is 45.0 s).
- Frames are drawn on an HTML5 **Canvas 2D** at 1080×1920 by **stateless render functions**, animated by a **single paused GSAP timeline** that is advanced deterministically with `tl.seek(frame / 30)`.
- Rendering is **sequential** (one task at a time, never in parallel) and runs on the **main thread** — the UI is effectively blocked while capturing.
- Rendered MP4 blobs are persisted to **IndexedDB** (`reelautomation-videos` → `videos`, keyPath `filename`), so the gallery survives refresh/tab changes.
- Typography is tuned in `/design`, persisted to **localStorage** under `fontConfig`, and read by the render engine at the start of every render.
- Brand palette: black `#000` video background, gold `#DAC477`, dark UI `#1a1a1a` / `#111`. Fonts: **Garamond** (bundled TTF) with Nunito Sans also bundled.
- Hosting target is **Vercel static** (`vercel.json`: SPA rewrite + COOP/COEP headers). No CI exists.
- A complete but **unused** second rendering engine exists at `src/engine/renderWorker.js` (Web Worker + WebCodecs fast path). It is not imported anywhere and does not ship in the bundle.

---

## 1. Project purpose & core features

### 1.1 Purpose

A content-production tool for astrology social-media accounts. Instead of editing a video by hand, an operator writes (or generates) a JSON file of daily horoscopes, uploads it, and receives a batch of vertical, Instagram-Reels-ready MP4s — one per zodiac sign, and/or a single multi-sign **group reel** — with consistent branding, animation, and the day's date burned in.

The long-term ambition visible in the code and history is a **zero-editor pipeline**: "edit JSON → press render → download ZIP."

### 1.2 Target audience

- A solo astrology creator / social media manager producing daily content at volume.
- Internal operators of the "StarryVibes" brand (the outro CTA is hardcoded to `Visit starryvibes.ai`, the header logo reads `StarryVibes`, the working title is `CanvaReel`).
- Not consumer-facing: no accounts, no multi-tenancy, no shareable links, no scheduling/publishing.

### 1.3 Core features (implemented)

| #   | Feature                                                                                                                                                                                                    | Where                                                                                                          |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| 1   | Upload horoscope JSON with validation (1–12 entries, 6 required string fields)                                                                                                                             | `src/pages/Home.jsx`, `src/utils/validateJson.js`                                                              |
| 2   | Download a ready-made sample JSON                                                                                                                                                                          | `Home.jsx` (`downloadSample`)                                                                                  |
| 3   | Batch/queue render of typed tasks (`single` \| `group`), one at a time, with live stage+percent progress and per-task failure reporting                                                                    | `src/engine/useRenderQueue.js`, `src/engine/renderSign.js`                                                     |
| 4   | In-browser MP4 encode (no server)                                                                                                                                                                          | `renderSign.js` (FFmpeg WASM + libx264)                                                                        |
| 5   | Deterministic frame capture (seek-based, not clock-based)                                                                                                                                                  | `renderSign.js`                                                                                                |
| 6   | IndexedDB persistence of finished videos + restore on refresh                                                                                                                                              | `src/utils/videoDB.js`, `useRenderQueue.js`, `src/pages/Videos.jsx`                                            |
| 7   | Gallery: preview, multi-select, ZIP download, delete                                                                                                                                                       | `Videos.jsx`, `src/utils/downloadZip.js`                                                                       |
| 8   | Browser notifications per sign + on completion, with in-app toast fallback                                                                                                                                 | `src/utils/notify.js`, `Home.jsx`                                                                              |
| 9   | Design Preview: per-frame typography sliders, persisted, live canvas repaint                                                                                                                               | `src/pages/DesignPreview.jsx`                                                                                  |
| 10  | Frame Preview: play intro / full zodiac sequence / outro standalone                                                                                                                                        | `src/pages/FramePreview.jsx`                                                                                   |
| 11  | **Group Reels**: configure **any number** of independent groups ("Add Another Group"), each a subset of the upload, rendered as ONE video (intro → card 1 … card N → outro) alongside the per-sign singles | `Home.jsx` (mode + group cards), `useRenderQueue.buildRenderTasks`, `ZodiacFrame.createZodiacSequenceTimeline` |

### 1.4 Non-goals / explicitly absent

No audio (no music bed, no voiceover), no transitions library, no template/theme switcher, no cloud render, no captions, no analytics, no A/B variants, no scheduling or direct social publishing. Group reels exist (§1.3 #11) with several groups per run, but there is no drag-reordering of groups or cards, no per-card timing control, and no overlap warning when one sign is placed in two groups.

---

## 2. Tech stack

### 2.1 Runtime & tooling

| Area                           | Choice                                                 | Version / note                                                                                                                                          |
| ------------------------------ | ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Language                       | JavaScript (ES2022), JSX                               | No TypeScript source; `jsconfig.json` enables `checkJs` so `tsc` type-checks the JS (§2.5)                                                              |
| Package manager                | **Yarn 1.22.22 only**                                  | `yarn.lock` is the single source of truth; `package-lock.json` was deleted and is gitignored. Always `yarn add` / `yarn install` — never `npm install`. |
| Node / Yarn (verified locally) | Node 24.14.1 / Yarn 1.22.22 / npm 11.11.0 (npm unused) | No `engines` field                                                                                                                                      |
| Build tool                     | Vite                                                   | `^5.0.8` (resolved 5.4.21) + `@vitejs/plugin-react` 4.2.1                                                                                               |
| Dev server                     | Vite on **port 3000**                                  | Sends `Cross-Origin-Opener-Policy: same-origin` + `Cross-Origin-Embedder-Policy: require-corp` (needed for FFmpeg's threaded/WASM path)                 |
| Formatting                     | **Prettier 3.9**                                       | `.prettierrc` + `.prettierignore`; `yarn format` / `yarn format:check`                                                                                  |
| Git hooks                      | **Husky 9 + lint-staged 17**                           | `.husky/pre-commit` runs `yarn lint-staged`, which runs Prettier on staged files                                                                        |
| Type checking                  | **TypeScript 7 (`tsc --noEmit`) over JS**              | `jsconfig.json` with `allowJs` + `checkJs`; `yarn type-check`                                                                                           |
| Tests / ESLint / CI            | **None**                                               | No test files, no ESLint, no CI pipeline                                                                                                                |

### 2.2 Application dependencies

| Package              | Version  | Role                                                                       |
| -------------------- | -------- | -------------------------------------------------------------------------- |
| `react`, `react-dom` | ^18.2.0  | UI                                                                         |
| `react-router-dom`   | ^7.13.0  | `BrowserRouter`, 4 routes, nested layout route                             |
| `zustand`            | ^4.5.2   | The single render-queue store                                              |
| `gsap`               | ^3.12.5  | All animation; timelines are `paused` and seeked manually                  |
| `@ffmpeg/ffmpeg`     | ^0.12.15 | WASM encoder orchestration, virtual FS                                     |
| `@ffmpeg/core`       | ^0.12.10 | The WASM core (imported via `?url`, ~32 MB wasm + ~112 kB js in the build) |
| `@ffmpeg/util`       | ^0.12.2  | Present in deps; **not imported by any source file**                       |
| `jszip`              | ^3.10.1  | Bulk ZIP download in the gallery                                           |

### 2.3 Styling

| Item                          | Reality                                                                                                                                                                                                             |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Tailwind CSS                  | `tailwindcss@^3.4.19` is the **active** engine: `postcss.config.js` uses the classic `tailwindcss: {}` plugin and `src/index.css` uses `@tailwind base/components/utilities`.                                       |
| `@tailwindcss/postcss@^4.0.0` | Installed but **unused** (v4 wiring would require `@import "tailwindcss"` and `@tailwindcss/postcss` in the PostCSS config). Do not "migrate" casually.                                                             |
| `autoprefixer`                | ^10.4.24, active                                                                                                                                                                                                    |
| Theme                         | `tailwind.config.js` extends `fontFamily.garamond` and `colors['custom-gold'] = '#DAC477'`, but almost all UI styling is **inline Tailwind arbitrary values** (`bg-[#1a1a1a]`, `text-[#DAC477]`), not theme tokens. |
| Global CSS                    | `src/index.css`: `@font-face` for Garamond Regular/Bold (from `src/fonts/*.TTF`), dark `body`, canvas drop shadow.                                                                                                  |
| Canvas-side typography        | Fonts are referenced by literal family name in `ctx.font` strings: `"Garamond", serif` / `"Garamond", sans-serif`.                                                                                                  |

### 2.4 Persistence & hosting

| Concern                           | Implementation                                                                                                                                                                               |
| --------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Rendered videos                   | **IndexedDB** `reelautomation-videos` v1, store `videos`, keyPath `filename`, records `{ filename, name, blob }`. Blob URLs are recreated on load because they are tab-scoped.               |
| Typography config                 | **localStorage** key `fontConfig` (JSON of 9 numeric sizes/line-heights).                                                                                                                    |
| Zodiac data                       | **Not persisted by the upload flow.** `public/data.json` is the only default source. Both preview pages read a `customZodiacData` localStorage key that **nothing writes** (dead read path). |
| Hosting                           | Vercel static. `vercel.json` rewrites `/(.*)` → `/index.html` (SPA routing) and applies COOP/COEP globally. No `vercel` CLI config, no CI, no serverless functions.                          |
| Cloudflare D1/R2, Vercel KV, etc. | Not used anywhere.                                                                                                                                                                           |

### 2.5 Tooling & quality gates (added 2026-10-21)

Yarn 1 is the only package manager: `yarn.lock` is committed, `package-lock.json` was deleted and is listed in `.gitignore` so `npm install` cannot silently reintroduce a second lockfile.

```bash
yarn install          # the only install command
yarn dev              # vite dev server on :3000
yarn build            # production build in dist/
yarn preview          # serve the production build
yarn format           # prettier --write .   (one-time normalisation of existing files)
yarn format:check     # prettier --check .   (exit 1 if anything is unformatted)
yarn type-check       # tsc -p jsconfig.json --noEmit
```

| File                 | Purpose                                                                                                            |
| -------------------- | ------------------------------------------------------------------------------------------------------------------ |
| `.prettierrc`        | `singleQuote`, `semi`, `printWidth: 100`, `trailingComma: "all"`, 2-space tabs, LF                                 |
| `.prettierignore`    | `node_modules`, `dist`, `output`, `chrome`, both lockfiles, `public/data.json`, `.freebuff`                        |
| `.lintstagedrc.json` | `*.{js,jsx,mjs,cjs,json,css,html,md,yml,yaml}` → `prettier --write`                                                |
| `.husky/pre-commit`  | `yarn lint-staged` (installed by `yarn prepare`; `core.hooksPath=.husky/_`)                                        |
| `jsconfig.json`      | `allowJs`, `checkJs`, `noEmit`, `jsx: react-jsx`, `moduleResolution: Bundler`, `include: ["src"]`, `strict: false` |
| `src/vite-env.d.ts`  | `/// <reference types="vite/client" />` plus a `*.TTF` declaration (Vite only declares lowercase extensions)       |

Notes for future work:

- **`maxNodeModuleJsDepth: 0` is required.** GSAP ships JavaScript sources that re-export every plugin; without this option `checkJs` reports ~96 errors inside `node_modules/gsap/*.js` (they are not covered by `skipLibCheck`).
- `include` deliberately stops at `src`. `vite.config.js`, `postcss.config.js`, `tailwind.config.js` and the stale `scripts/` are not type-checked (the scripts are CJS and would need Node types).
- The pre-commit hook formats but does **not** block on type errors — run `yarn type-check` manually or in CI.
- The repo predates Prettier, so `yarn format:check` reports **34** unformatted files (formatting-only diff) until `yarn format` is run once; the hook reformats each file as it is staged.
- `checkJs` is on, but most files still carry no JSDoc, so most values are inferred as `any`. Adding `@param`/`@returns` annotations where it matters (e.g. the renderers and the queue) is what turns this from a syntax check into a real one.

---

## 3. System architecture & data flow

### 3.1 Layers

```
┌──────────────────────────────────────────────────────────────────────┐
│ PRESENTATION (React, react-router-dom)                               │
│ Home.jsx        upload → validate → kick off queue                   │
│ Videos.jsx      IndexedDB gallery, select/ZIP/delete                 │
│ DesignPreview   per-frame GSAP preview + typography sliders          │
│ FramePreview    standalone intro / zodiac / outro playback           │
│ Header/LayoutWithHeader  fixed nav shell (Design, Frame Preview)      │
└───────────────┬──────────────────────────────────────────────────────┘
                │ zustand selectors / actions
┌───────────────▼──────────────────────────────────────────────────────┐
│ ORCHESTRATION (src/engine/useRenderQueue.js)                         │
│ signsData · renderedVideos · isRendering · isComplete · errors       │
│ tasks[{type:'single'|'group', data:[…], label}] · currentTaskIndex   │
│ progress {stage, percent}                                            │
│ buildRenderTasks() + startRendering(): sequential loop, persistence  │
└───────────────┬──────────────────────────────────────────────────────┘
                │ renderSign(signs[], onProgress)   ← always an array
┌───────────────▼──────────────────────────────────────────────────────┐
│ RENDER ENGINE (src/engine/renderSign.js)                             │
│ 1 load/caches images   2 build ONE paused GSAP timeline              │
│   (intro → 1..N zodiac cards → outro; frames derived from duration)   │
│ 3 for each frame: seek → draw → toBlob(JPEG) → FFmpeg FS             │
│ 4 ffmpeg.exec(libx264) 5 read MP4 → Blob → object URL 6 cleanup      │
└───────────────┬──────────────────────────────────────────────────────┘
                │ called via GSAP onUpdate with plain proxy-state objects
┌───────────────▼──────────────────────────────────────────────────────┐
│ PURE CANVAS RENDERERS (stateless draw functions, 1080×1920)          │
│ IntroFrame.renderIntroFrame(ctx, data, fontSizes)                    │
│ ZodiacFrame.renderZodiacFrame(...)                                   │
│ createZodiacTimeline(card) · createZodiacSequenceTimeline(cards[])   │
│ OutroFrame.renderOutroFrame(ctx, data, fontSizes)                    │
└───────────────┬──────────────────────────────────────────────────────┘
                │
┌───────────────▼──────────────────────────────────────────────────────┐
│ STORAGE / PLATFORM                                                   │
│ IndexedDB (MP4 blobs) · localStorage (fontConfig) · Notification API │
│ FFmpeg WASM virtual FS (frames → output.mp4)                         │
└──────────────────────────────────────────────────────────────────────┘
```

**Key separation:** React state is _never_ touched during the animation/render loop. GSAP mutates plain JS "proxy state" objects (`introAnimState`, `outroAnimState`, and `animState` inside `createZodiacTimeline`) and the `onUpdate` callback repaints the canvas. This is the core performance decision; preserve it.

### 3.2 The render pipeline (exact sequence)

1. `Home.jsx` builds `options` (`{ single, groups: [{ id, indices }] }`) and calls `startRendering(navigate, options)`. `buildRenderTasks(signsData, options)` turns it into an ordered task list — all `single` tasks first (one per uploaded sign), then **one task per configured group**, in the order the groups were added, each tagged with `groupNumber` and members resolved **by index** (so duplicated sign names stay addressable). `startRendering` requests `Notification` permission once, then loops the tasks **sequentially** (`for` + `await`), setting `currentTaskIndex` and forwarding `onProgress` into the store.
2. `renderSign(signs, onProgress)` — `signs` is always an array (length 1 for a single reel, N for a group reel):
   - `getFFmpeg()` → singleton `FFmpeg` instance, loads core via `import("@ffmpeg/core?url")` / `@ffmpeg/core/wasm?url` (cached for the session).
   - `loadAllImages()` → 12 zodiac PNGs + 4 decorative PNGs, cached in module scope (`cachedImages`) so a batch loads them once.
   - Reads `localStorage.fontConfig` (empty object → renderers use their own defaults).
   - Creates a **detached** `<canvas width=1080 height=1920>` (never attached to the DOM).
   - Builds **one** `gsap.timeline({ paused: true })`: intro tweens → `tl.add(createZodiacSequenceTimeline(ctx, signs, ...))` → outro tweens. The sequence is a nested timeline holding one 13.1 s card per sign (`isFirst` on card 1 animates the decorative row in, `isLast` on the final card fades everything out), so duration grows linearly with the number of cards.
   - `totalFrames = Math.ceil(tl.totalDuration() * 30)`.
   - **Capture loop:** `tl.seek(i / 30, false)` (suppressEvents=false so `onUpdate` fires and redraws), then `canvas.toBlob("image/jpeg", 0.85)`; the FS write of frame _N_ is overlapped with the JPEG encode of frame _N+1_ (`pendingWrite` pipelining). Frames are named `frame00000.jpg`… (`%05d`).
   - `ffmpeg.exec(["-framerate","30","-i","frame%05d.jpg","-c:v","libx264","-preset","ultrafast","-crf","23","-pix_fmt","yuv420p","-movflags","+faststart","output.mp4"])`.
   - Reads `output.mp4` → `Blob`, deletes every frame + output from the FS in parallel, `tl.kill()`.
   - Returns `{ name, filename, blob, url }`. Single reel: `name = "Leo"`, `filename = "Leo_<YYYY-MM-DD>.mp4"`. Group reel: `name = "Group Reel 3 (Virgo, Libra, Scorpio, Sagittarius)"`, `filename = "GroupReel_3_4Signs_<YYYY-MM-DD>.mp4"` — the `3_` is the group number, which is what keeps two same-sized groups distinct (`GroupReel_1_3Signs_…` vs `GroupReel_4_3Signs_…`) instead of silently overwriting each other in IndexedDB.
3. Store persists `{filename, name, blob}` to IndexedDB, appends to `renderedVideos`, fires a silent per-task notification.
4. A failing task is caught, logged, and pushed to `errors` (`{ label, message }`); the queue continues with the next task and `Home.jsx` lists the failures in a red panel afterwards.
5. After the loop: `isRendering=false`, `isComplete=true`, completion notification (click → `navigate('/videos')`).
6. `Home.jsx` also shows an in-app toast when notifications are unsupported/denied.

**Why `seek()` and not real-time recording:** the timeline is paused and every frame is addressed by exact time, so output is deterministic and independent of machine speed. This is the what-you-see-is-what-you-export guarantee and the main thing not to regress.

### 3.3 Timing model (measured, not documented elsewhere)

The three segments are concatenated **per task**, so every video is `intro + card(s) + outro`:

| Segment               | Duration formula                                                                               | Notes                                                                                                                                                                                                                                                                               |
| --------------------- | ---------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Intro                 | `6.0 + 0.05 × (30 + len(introLine4))` — **7.65 s** for `LEO`, **8.25 s** for `VIRGO, LIBRA +2` | 3.5 s ring entrance, 5 typewriter tweens (`DAILY` / `HOROSCOPE` / `FOR` / `<sign list>` / `21st Oct 2026`) whose lengths drive the duration, `+=0.5` pause, 1.5 s fade. `introLine4` is the joined sign list, abbreviated to `NAME, NAME +N` above 3 signs (the 600 px draw width). |
| Zodiac card           | **13.00 s** for a non-final card, **13.10 s** for the final one                                | Icon entry 0–1.5 s, name 1.5–2.5 s, vibe 2.5–4.0 s, four sections from 4.0 s in 1.05 s steps, exit 11.0–13.0 s (the final card's last `tl.set(..., { duration: 0.1 })` ends at 13.1). Verified at runtime.                                                                          |
| Outro                 | **10.90 s**                                                                                    | 3.5 s ring entrance, 28-char CTA typewriter (1.40 s), 1.5 s gold box reveal, 3 s hold, 1.5 s fade.                                                                                                                                                                                  |
| **Single reel total** | `intro + 13.1 + 10.9` = **31.65–32.05 s**                                                      | `Math.ceil(total × 30)` = **950–962 frames** (name length decides).                                                                                                                                                                                                                 |
| **Group reel total**  | `intro + 13.0 × (N−1) + 13.1 + 10.9`                                                           | Grows exactly 13.0 s per extra card; only the intro varies with the sign list.                                                                                                                                                                                                      |

Measured in the 16-task stress run (one batch, 12 singles + 4 groups):

| Task                                         | Cards | Sequence (`tl.totalDuration()` of the card block) | Full duration | Frames   | Size     |
| -------------------------------------------- | ----- | ------------------------------------------------- | ------------- | -------- | -------- |
| Group 1 — Aries, Taurus, Gemini              | 3     | 39.10 s                                           | **58.567 s**  | 1757     | 12.97 MB |
| Group 2 — Cancer, Leo                        | 2     | 26.10 s                                           | **45.067 s**  | 1352     | 11.07 MB |
| Group 3 — Virgo, Libra, Scorpio, Sagittarius | 4     | 52.10 s                                           | **71.267 s**  | **2138** | 14.48 MB |
| Group 4 — Capricorn, Aquarius, Pisces        | 3     | 39.10 s                                           | **58.867 s**  | 1766     | 13.09 MB |

Group 3 spelled out: intro `8.25 s` + cards `13.0 + 13.0 + 13.0 + 13.1` = `52.10 s` + outro `10.90 s` = **71.25 s**, `Math.ceil(71.25 × 30) = 2138` frames, which is exactly what the encoded MP4 reports (`2138 / 30 = 71.267 s`).

**Empirically verified (2026-10-21):** single reels produced 1080×1920 at `31.766667 s` / `31.80 s` (Aries, Pisces), and a 2-sign group reel (`GroupReel_2Signs_2026-10-21.mp4`) produced 1080×1920 at exactly `45.000000 s`, 11.0 MB, with Leo at t≈15 s and Virgo at t≈28 s confirmed by frame extraction. Wall-clock is ~30 s per single reel on an Apple Silicon Mac in Chrome (~48 s for the 45 s group).

**Memory ceiling (important for groups):** every JPEG frame lives in the FFmpeg WASM filesystem until the encode finishes — roughly 200 KB × 30 fps × duration. A single reel ≈ 190–250 MB, a 4-sign group ≈ 900 MB, 6+ signs can exhaust the browser heap. `Home.jsx` warns above 4 selected signs for this reason.

> ⚠️ Older docs claim a single 70 s, 5-frame video (Intro → 3 zodiac cards → Outro). That architecture was replaced: **one sign = one video** (or one _task_ = one video, where a task may be a group), and a batch of N signs = N singles (+1 optional group).

### 3.4 Data flow of typography

`DesignPreview` sliders → React state `fontSizes` → `useEffect` writes `localStorage.fontConfig` **and** calls `renderRef.current()` for an immediate repaint → `renderSign` reads `fontConfig` at render start → passed as the third arg into every frame renderer, where each key is coalesced with `?? default`.

Keys: `titleText`, `titleTextLH`, `zodiacName`, `vibe`, `vibeLH`, `sectionLabel`, `sectionLabelLH`, `boxContent`, `boxContentLH`. Defaults live in **two places** (must stay in sync): `DEFAULT_FONT_SIZES` / `FONT_CONTROLS` in `DesignPreview.jsx`, and the `??` fallbacks inside the three renderers.

### 3.5 Concurrency & threading reality

- Everything runs on the **main thread**: GSAP seeks, canvas draws, JPEG compression, and FFmpeg `exec` (which itself uses its own internal worker, but the frame loop blocks the UI thread between awaits).
- The UI _cannot_ repaint smoothly during capture; progress text updates only as the loop yields on `await`.
- `src/engine/renderWorker.js` is a **finished but unwired** alternative engine: an `OffscreenCanvas` + `createImageBitmap` + `FontFace` worker with two tracks — **WebCodecs `VideoEncoder` (H.264, hardware-preferred) muxed by FFmpeg with `-c:v copy`**, falling back to the JPEG/`libx264` path. It requires no DOM, removes `gsap.ticker.updateRoot`, and posts `PROGRESS | SIGN_DONE | ALL_DONE | ERROR`. Wiring it is the single highest-value performance change available (see §6.6).

---

## 4. Current workflow & user journey

### 4.1 Primary flow — produce and download reels

1. **Open `/`** (Home). Card shows `CanvaReel`, a "⬇️ Download Sample JSON" link, and a dashed upload zone.
2. **Upload JSON** (click zone → file picker, `accept=".json"`). `FileReader.readAsText` → `JSON.parse` → `validateJson`.
   - Accepts either a bare array or `{ "zodiacs": [...] }`.
   - Rejects non-arrays, 0 entries, >12 entries, and any entry missing a non-empty string in `name`, `vibe`, `love`, `career`, `money`, `soulMessage`. Errors render in a red panel; state is cleared.
3. **Confirm** — UI shows "`N` signs loaded: …" and a gold render button. When **`N > 3`** a _Render options_ panel appears above the button:
   - `[x] Single Reels — one video per sign` (checked by default)
   - `[ ] Multiple Reels (Group Reels)` — checking it seeds **Group 1** containing every uploaded sign and reveals a stack of group cards. Each card has its own header (`Group 1`, `Group 2`, …), `All` / `None` / `Remove`, a live `k of N signs · ≈ 57.9s video` estimate, and a 2-column checkbox grid of the upload. **`+ Add Another Group`** appends as many independent groups as needed; nothing is shared between them, so one sign may appear in several groups (duplicates render in each).
   - Both can be checked: one single reel per sign **plus** every configured group. Neither cannot (`N ≤ 3` → single reels only, legacy behaviour; no group UI at all).
   - The button is disabled with an explaining label when no mode is selected (`Choose a render mode`), when group mode is on with zero groups (`Add a group to render`), or when any group has fewer than 2 signs (`Group 2 needs at least 2 signs`) — every group must be valid before the batch starts. Otherwise it reads `Render All N Videos`, `Render 2 Group Reels`, or `Render 12 Reels + 4 Group Reels`. A `Will render: 12 single reels + 4 group reels (12 signs) → 16 videos` line spells out the exact batch size.
4. **Render** — permission prompt for notifications (browser-dependent), then the rendering state replaces the upload state: "Rendering {task label} ({i} of {tasks})", stage label (`Capturing frames` / `Encoding MP4`) + percent bar, a `Leo → Virgo` card list for group tasks, and the warning "Please do not close or navigate away from this tab." Each finished task is persisted immediately, so partial batches survive a refresh; failures are collected and shown in a red panel.
5. **Completion** — checkmark, "N videos rendered!", the filename list, and **"🎬 View All Videos"**. A completion notification (if granted) and/or an in-app bouncing toast offers the same link.
6. **`/videos`** — loading state while IndexedDB is read; empty state ("No videos yet. Go render some first!" + "← Go Render"); otherwise a responsive 3-column 9:16 gallery of `<video controls muted>` cards with checkboxes.
7. **Act on selection** — bottom fixed bar appears when ≥1 selected: "⬇ Download ZIP" (JSZip → `CanvaReel_Videos.zip`) or "🗑 Delete Selected" (`window.confirm`, then store + IndexedDB delete, object URLs revoked). "Select All / Deselect All" in the header.

### 4.2 Secondary flow — tune typography (`/design`)

1. Header (or "← Back to Upload") → **Design**.
2. Choose one of **🌌 Intro Frame / ♊ Zodiac Sequence / ✨ Outro Frame**; the canvas (1080×1920 rendered into a 405×720 box) plays that animation immediately. "🔄 Replay" restarts.
3. Right panel shows sliders **only for the selected frame** (intro: title size/line-height; zodiac: name, vibe, section labels, box content + line heights; outro: question text, box content + line heights). Values persist instantly to `localStorage.fontConfig` and repaint the canvas without restarting the timeline.
4. In the zodiac view, the left panel lists all signs and auto-advances the preview through them (`setCurrentIndex`), ending with the final exit.

### 4.3 Secondary flow — inspect frames (`/frame-preview`)

Dropdown: **Intro Frame**, **Zodiac Sequence (All)** (concatenates `createZodiacTimeline` for every sign in the dataset — effectively a full-group reel preview), **Outro Frame**. Reads `fontConfig` (read-only here). A gold "Change Font Size" button links to `/design`. This is a QA surface, not part of the production path.

### 4.4 Navigation map

| Route            | Element         | Chrome                                                                      |
| ---------------- | --------------- | --------------------------------------------------------------------------- |
| `/`              | `Home`          | **Standalone**, no header (own centered card; hosts the render-mode picker) |
| `/videos`        | `Videos`        | **Standalone**, no header                                                   |
| `/design`        | `DesignPreview` | Nested in `LayoutWithHeader` (fixed 56 px header)                           |
| `/frame-preview` | `FramePreview`  | Nested in `LayoutWithHeader`                                                |

Header links are only **Design** and **Frame Preview** (plus a StarryVibes logo → `/`). There is no nav entry for `/videos`; it is reachable only from the completion screen/toast, which is intentional but easy to mistake for a bug.

### 4.5 JSON data contract

```json
{
  "zodiacs": [
    {
      "name": "Leo",
      "vibe": "Radiant confidence leads to unexpected breakthroughs.",
      "love": "Passionate encounters spark\nnew emotional depth.",
      "career": "Leadership success comes from\ntrusting your creative vision.",
      "money": "Invest wisely in projects that\nalign with your core values.",
      "soulMessage": "Shine bright and let the\nworld see your true self."
    }
  ]
}
```

- `name` is matched **case-sensitively** against the canonical 12 (`Aries…Pisces`) for the icon and intro highlight; unknown names silently fall back to the **Leo** icon, and the zodiac's own name is still rendered (uppercased) as text.
- `vibe` is prefixed with `"Vibe: "` by the renderer.
- `\n` in content fields is **not** honored as a manual break — wrapping is word-based via `ctx.measureText`, and an embedded newline is drawn as whitespace by `fillText` rather than starting a new line. Author short lines or widen `boxWidth` instead.
- Section titles are fixed in code: `LOVE`, `CAREER`, `MONEY`, `SOUL MESSAGE`.
- `public/data.json` ships a single `Aries` entry and is used only by `/design` and `/frame-preview`.

---

## 5. Directory structure

```
reelautomation/                      # repo root (Vite project, no src-level nesting)
├── index.html                       # single entry, mounts /src/main.jsx
├── package.json                     # scripts: dev, build, preview, export*, format, format:check, type-check, prepare
├── yarn.lock                        # the ONLY lockfile — Yarn 1.22.22 is the package manager
├── .prettierrc / .prettierignore    # formatting config (§2.5)
├── .lintstagedrc.json               # Prettier over staged files
├── .husky/pre-commit                # git hook → `yarn lint-staged`
├── jsconfig.json                    # allowJs + checkJs for `tsc --noEmit`
├── vite.config.js                   # React plugin; port 3000; COOP/COEP; excludes @ffmpeg from optimizeDeps
├── tailwind.config.js               # content globs; garamond font; custom-gold #DAC477
├── postcss.config.js                # tailwindcss + autoprefixer (v3 wiring)
├── vercel.json                      # SPA rewrite + COOP/COEP headers
├── public/
│   └── data.json                    # 1-sign Aries sample, served at /data.json
├── src/
│   ├── main.jsx                     # createRoot + StrictMode + BrowserRouter
│   ├── App.jsx                      # Routes (see §4.4)
│   ├── index.css                    # Tailwind directives, @font-face Garamond, global body/canvas styles
│   ├── vite-env.d.ts                # Vite client types + *.TTF module declaration
│   ├── engine/                      # ── production rendering pipeline ──
│   │   ├── useRenderQueue.js        # zustand store: typed tasks (single/group), progress, IDB, errors  (190 L)
│   │   ├── renderSign.js            # 1..N signs → GSAP timeline → JPEG frames → FFmpeg MP4  (448 L)
│   │   └── renderWorker.js          # UNUSED worker+WebCodecs engine, not imported/bundled  (642 L)
│   ├── components/                  # ── canvas renderers + shell ──
│   │   ├── IntroFrame.js            # renderIntroFrame: 12-icon ring + 5 typewriter lines  (135 L)
│   │   ├── ZodiacFrame.js           # renderZodiacFrame + createZodiacTimeline + createZodiacSequenceTimeline  (514 L)
│   │   ├── OutroFrame.js            # renderOutroFrame: faded ring, CTA, gold reveal box  (159 L)
│   │   ├── DraftFrame.js            # legacy variant used ONLY by DesignPreview  (409 L)
│   │   ├── SingleZodiacFrame.js     # byte-identical duplicate of ZodiacFrame.js, unused  (467 L)
│   │   ├── Header.jsx               # fixed nav, gold active pill, mobile hamburger
│   │   └── LayoutWithHeader.jsx     # header + <Outlet/> with pt-14
│   ├── pages/
│   │   ├── Home.jsx                 # upload → validate → render modes (single + N groups) → queue → completion  (528 L)
│   │   ├── Videos.jsx               # IDB gallery, group labels, selection, ZIP, delete  (199 L)
│   │   ├── DesignPreview.jsx        # typography lab: 3 frames, sliders, persistence  (857 L)
│   │   └── FramePreview.jsx         # standalone frame playback QA surface  (442 L)
│   ├── utils/
│   │   ├── validateJson.js          # schema rules for uploaded JSON
│   │   ├── videoDB.js               # IndexedDB open/put/getAll/delete + URL recreation
│   │   ├── downloadZip.js           # JSZip bundle → CanvaReel_Videos.zip
│   │   ├── notify.js                # permission, per-sign and completion notifications
│   │   └── dateFormatter.js         # "21st Oct 2026" ordinal formatting
│   ├── images/                      # 12 zodiac PNGs + heart/trophy/money-bag/crystal-ball (transparent)
│   └── fonts/                       # Garamond-Regular.TTF, Garamond-Bold.TTF, NunitoSans variable
├── scripts/                         # ⚠️ STALE, post-refactor; see §6.4
│   ├── export.js                    # Puppeteer screenshot loop (expects 70 s canvas on "/")
│   ├── export-manual.js             # generates HTML that inlines src/frames/*.js → ENOENT
│   ├── export-ffmpeg.js             # macOS avfoundation screen recording, 70 s
│   └── convert-to-mp4.sh            # WebM → MP4 helper (ffmpeg CLI)
├── New_project_summary.md           # stale summary (May 2026)
├── Project_doc.md                   # stale architecture doc (May 2026)
├── README.md                        # stale quick-start (references src/frames/, /reel-canvas)
├── file_explaination.md             # stale per-file notes
└── PROJECT_ARCHITECTURE.md          # ← this file (verified Oct 2026)
```

**Where to change what**

| Goal                                                            | Touch                                                                                                     |
| --------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| Colors / branding of the video                                  | `#DAC477` and `#000` literals in `IntroFrame.js`, `ZodiacFrame.js`, `OutroFrame.js`                       |
| Video length or animation beats                                 | Segment tweens in `renderSign.js` (intro/outro) and `createZodiacTimeline` in `ZodiacFrame.js`            |
| How many cards a group reel holds / when the mode picker shows  | `GROUP_OPTIONS_THRESHOLD` + `GROUP_MIN_SIGNS` in `Home.jsx`, `buildRenderTasks` in `useRenderQueue.js`    |
| Caption copy (`DAILY`, `FOR`, outro CTA `Visit starryvibes.ai`) | `renderSign.js` (`content` object, `outroFullText`) and `OutroFrame.js`                                   |
| New zodiac / icon                                               | `src/images/*` + the `ZODIAC_NAMES` / import blocks in `renderSign.js` (and `renderWorker.js` if revived) |
| Encoder quality/speed                                           | `ffmpeg.exec` args in `renderSign.js`                                                                     |
| Upload rules                                                    | `src/utils/validateJson.js`                                                                               |
| UI look                                                         | Inline Tailwind classes in each page                                                                      |

---

## 6. Current state & integrations

### 6.1 Third-party services and integrations

| Category                                | Status                                                                                   |
| --------------------------------------- | ---------------------------------------------------------------------------------------- |
| Backend / API                           | **None.** No fetch/POST to any app server; the only `fetch` calls are for `/data.json`.  |
| Database                                | **None server-side.** IndexedDB (browser) is the system of record for rendered videos.   |
| Auth / accounts                         | **None.**                                                                                |
| Payments                                | **None.**                                                                                |
| CMS                                     | **None.** Content arrives as an uploaded file.                                           |
| AI / LLM                                | **None.** No API keys, no `.env`, no env var reads in code.                              |
| Analytics / monitoring / error tracking | **None.** Failures surface via `console.error` / `alert` only.                           |
| Email / SMS / push                      | **None.** Only the local Web Notifications API.                                          |
| Video infrastructure                    | **Local only** — FFmpeg WASM in the browser; no Mux/Cloudflare Stream/S3 upload.         |
| Hosting                                 | Vercel **static** config present (`vercel.json`); deployment not verified in this audit. |

Bottom line for a new contributor: **you can run and ship this with zero credentials.** Any new service (storage for sharing, auth for teams, an LLM for auto-generating horoscopes) is a new architectural decision, not an existing integration.

### 6.2 Build & runtime status (verified 2026-10-21)

| Check                                                                      | Result                                                                                                                                                                                                                                                                                                                                                |
| -------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `yarn build`                                                               | ✅ Passes, 101 modules, ~0.9 s. Main JS 410 kB (138 kB gzip); FFmpeg core wasm **32.2 MB**; images/fonts hashed into `/assets`.                                                                                                                                                                                                                       |
| `/`, `/design`, `/frame-preview`, `/videos`                                | ✅ All render without console errors.                                                                                                                                                                                                                                                                                                                 |
| JSON upload (2 signs, synthesized File)                                    | ✅ Validation passes, button becomes "Render All 2 Videos".                                                                                                                                                                                                                                                                                           |
| Full render of 2 signs                                                     | ✅ Completed in ~65 s total; outputs `Aries_2026-10-21.mp4` (31.77 s) and `Pisces_2026-10-21.mp4` (31.80 s), 1080×1920 — single-reel path unchanged by the group feature.                                                                                                                                                                             |
| Render-mode picker (`>3` signs)                                            | ✅ Appears for 4 signs, hidden for 2; `Multiple Reels` pre-selects all signs; button disables for “no mode” and for `<2` selected signs; summary reads `4 single reels + 1 group reel (4 signs)`.                                                                                                                                                     |
| Group reel render (2 selected signs)                                       | ✅ Completed in ~48 s; `GroupReel_2Signs_2026-10-21.mp4`, 11.01 MB, `45.000000 s`, 1080×1920, `name = "Group Reel (Leo, Virgo)"`; frames extracted at t=15 s (Leo) and t=28 s (Virgo) confirm both cards plus intro (t=6) and outro (t=40). Timeline log: `2 card(s) -> 1350 frames (45.00s)`.                                                        |
| Frame-brightness sweep (0–45 s, 0.5 s steps)                               | ✅ No unexpected black gaps; dark stretches only during the intended intro entrance (0–4 s), the two hard cuts into a card (~0.2 s each) and the outro entrance (34–39 s).                                                                                                                                                                            |
| **16-task stress batch** (12 singles + 4 groups of 3/2/4/3, both modes on) | ✅ `16 videos rendered!`, **0 failures**, 168.5 MB stored, 16 distinct IndexedDB keys; task labels ran `Aries` … `Pisces`, then `Group Reel 1 (3 signs)` … `Group Reel 4 (3 signs)` in the configured order. Wall clock ≈ **13 min** end-to-end (≈ 460 s for the 12 singles, ≈ 320 s for the four group reels); ≈ 1.2–1.4× realtime including encode. |
| Group reel durations from the stress batch                                 | ✅ 58.567 s / 45.067 s / **71.267 s** / 58.867 s, 1080×1920, matching the predicted frame counts 1757 / 1352 / **2138** / 1766 exactly (`frames / 30`).                                                                                                                                                                                               |
| Group 3 content check (4 cards)                                            | ✅ Frames extracted at t=4 (intro, four signs highlighted), 15 (Virgo), 28 (Libra), 41 (Scorpio), 54 (Sagittarius), 66 (outro) — all four cards present in order.                                                                                                                                                                                     |
| Memory during the 16-task batch                                            | ✅ `performance.memory` sampled every 2 s for the whole run: JS heap stayed between **12 MB and 28 MB** with no upward trend (peak during `Group Reel 4`), i.e. frames/blob URLs are released per task. The WASM-side frame buffers are the only large allocation and are deleted per task.                                                           |
| IndexedDB persistence                                                      | ✅ Records present with `{filename, name, blob}`; gallery restores and plays them.                                                                                                                                                                                                                                                                    |
| Font rendering in canvas                                                   | ⚠️ Works in practice, but `renderSign` never awaits `document.fonts.ready`; first frames can theoretically use a fallback face if the TTFs are still loading.                                                                                                                                                                                         |
| `yarn export:manual`                                                       | ❌ Fails: `ENOENT .../src/frames/IntroFrame.js` (the `src/frames/` directory no longer exists).                                                                                                                                                                                                                                                       |
| `yarn export` (Puppeteer)                                                  | ❌ Logically broken: it waits for a `<canvas>` on `/`, but Home no longer renders one; also hardcodes 2100 frames / 70 s.                                                                                                                                                                                                                             |
| `yarn export:ffmpeg`                                                       | ⚠️ Works only on macOS with ffmpeg + screen-recording permission; records 70 s of a screen, unrelated to the app's output.                                                                                                                                                                                                                            |
| `yarn type-check`                                                          | ✅ `tsc -p jsconfig.json --noEmit` exits 0 over `src` (after fixing 12 real findings — see §2.5).                                                                                                                                                                                                                                                     |
| `yarn lint-staged` via `.husky/pre-commit`                                 | ✅ Hook ran on a staged probe file and rewrote it to Prettier style, re-staging the formatted result.                                                                                                                                                                                                                                                 |

### 6.3 What is frozen vs fluid

- **Stable / contractual:** the JSON contract, the seek-based deterministic loop, the `{ type, data[], label, groupNumber? }` task shape, `buildRenderTasks` ordering (singles first, then groups in the order they were added), the `GroupReel_<groupNo>_<N>Signs_<date>.mp4` filename convention, IndexedDB keys, `fontConfig` keys, route paths, brand colors and the 1080×1920 / 30 fps output.
- **Fluid / experimental:** threading model (`renderWorker.js`), segment durations, Preview pages, all UI styling.

### 6.4 Code and repo hygiene issues (real, current)

1. **Dead worker engine.** `renderWorker.js` (~640 lines, WebCodecs + JPEG fallback) is imported by nothing and absent from the bundle. It is the intended fast path; it is not reachable.
2. **Duplicate renderer.** `SingleZodiacFrame.js` is byte-identical to `ZodiacFrame.js` and unused. `DraftFrame.js` is a divergent older twin used only by `DesignPreview` — changes to `ZodiacFrame` do **not** automatically appear in `/design`. `FramePreview.jsx` imports `renderDraftFrame` but never calls it.
3. **Dead data read path.** `/design` and `/frame-preview` read `localStorage.customZodiacData`, which nothing writes. They always fall back to `/data.json` (single Aries entry). Uploading on Home does **not** affect the preview pages.
4. ~~**Dual lockfiles.**~~ **Resolved (2026-10-21):** `package-lock.json` deleted and gitignored; Yarn 1 + `yarn.lock` is the only install path (see §2.5).
5. **Stale `scripts/`.** Three of four scripts reference the removed `src/frames/` layout or a removed canvas route; only `convert-to-mp4.sh` is self-contained.
6. **No `"type": "module"`** in `package.json`, so Vite emits a `MODULE_TYPELESS_PACKAGE_JSON` warning for `postcss.config.js` / `vite.config.js`.
7. **Name drift.** `package.json` → `astrology-reel-automation`; Home heading & ZIP → `CanvaReel`; header logo & outro CTA (the video itself) → `StarryVibes`.
8. **`@ffmpeg/util`** is a dependency but never imported; `@tailwindcss/postcss` v4 is installed against a v3 setup.
9. **No tests, no ESLint, no CI.** Prettier and `tsc --noEmit` (checkJs) exist and the pre-commit hook formats staged files, but nothing asserts behaviour and nothing runs on push, so verification of the render pipeline is still manual/visual.
10. **Failures are visible but not recoverable.** A failed task is caught in `startRendering`, logged, and pushed to `errors` (shown in a red panel on Home); the queue continues and there is still **no retry** — you re-upload and re-render the whole batch.
11. **Group reels scale memory linearly (per task, not per batch).** All frames of a task sit in the FFmpeg WASM filesystem until the encode ends — Group 3 of the stress batch alone held **2138 frames** (~400 MB transient). Tasks are sequential and each one deletes its frames, so a 16-task batch is fine (measured heap 12–28 MB, no growth), but a single 10–12 card group is the real OOM risk; streaming/indexed segmenting (or the worker's WebCodecs mux path) is the fix.

### 6.5 Documentation drift (what not to believe)

| Existing claim                                                                                                | Reality                                                                                                                                                                    |
| ------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| "5 frame structure: Intro → 3 Zodiac → Outro, 70 s" (`README.md`, `Project_doc.md`, `New_project_summary.md`) | **One task per video**: single reel = `intro + 13.1 s card + outro` ≈ 31.75 s; group reel = `intro + N cards + outro`; a batch of N signs = N singles (+1 optional group). |
| "`src/frames/` contains IntroFrame/ZodiacFrame/OutroFrame" (`README.md`, `file_explaination.md`)              | Renderers live in `src/components/`; `src/frames/` does not exist.                                                                                                         |
| "Upload data is validated and stored in localStorage" (`README.md`)                                           | Upload lives only in zustand memory; nothing is persisted.                                                                                                                 |
| "Route `/reel-canvas`" (`New_project_summary.md`)                                                             | Removed; routes are `/`, `/videos`, `/design`, `/frame-preview`.                                                                                                           |
| "React Router 7 + Tailwind 4" (`Project_doc.md`)                                                              | Router 7 is right; Tailwind is **v3** wiring with a v4 package sitting unused.                                                                                             |
| "`scripts/export.js` captures frames deterministically" / "Puppeteer export drift"                            | The script still uses `setTimeout` pacing, targets a canvas that no longer exists, and is effectively abandoned.                                                           |
| "Design Preview lets you pick which zodiac to preview"                                                        | It auto-advances through signs in the sequence; there is no per-sign picker (the list is an indicator).                                                                    |

### 6.6 Highest-leverage next steps (for whoever picks this up)

1. **Wire `renderWorker.js`.** Move rendering off the main thread and get the WebCodecs hardware track. Biggest UX and speed win; the code is already written.
2. **Add retry** for failed tasks (failures are already collected in `errors`; a "retry failed" action would avoid re-rendering a whole batch).
3. **Persist the uploaded dataset** (IndexedDB/localStorage) so `/design` and `/frame-preview` preview the batch that was actually uploaded, not `data.json`.
4. **Delete or archive** `SingleZodiacFrame.js`, the stale `scripts/`, the duplicate lockfile, and `DraftFrame.js` (point `DesignPreview` at `renderZodiacFrame` so the lab matches the renderer).
5. **Stream frames instead of buffering them** (or encode per-card and concat) so group reels with 8–12 cards stop being memory-bound.
6. **Add audio** (music bed + optional VO) — currently a hard gap for Reels, and the encoder args would need an audio input/mux step.
7. **Share/publish path:** object URLs die with the tab and the ZIP is manual; a storage integration (e.g. R2/S3 presigned upload or a Drive drop) is the missing last mile for a team workflow.

### 6.7 Developer quick-start

```bash
yarn install         # also installs the Husky pre-commit hook via `prepare`
yarn dev             # http://localhost:3000 (COOP/COEP headers required for FFmpeg)
yarn build           # static output in dist/
yarn preview         # serve the production build
yarn type-check      # tsc --noEmit over src (jsconfig.json, checkJs)
yarn format          # prettier --write .
```

- Needs a Chromium-class browser for the smoothest FFmpeg run; Safari/Firefox work but the current engine is the same WASM path either way.
- Expect the first render to stall while the 32 MB WASM core downloads.
- Rendered videos live in the browser's IndexedDB, **per browser profile** — deleting site data deletes the gallery.
- Committing runs `yarn lint-staged` → Prettier on the staged files only. It will rewrite the files you stage, which is expected; type errors are **not** blocked by the hook.
- Never run `npm install` in this repo: it would recreate `package-lock.json` (gitignored) and can resolve different versions than `yarn.lock`.
- Group reels buffer every frame in WASM memory (4 signs ≈ 900 MB), so long groups can fail on low-memory machines even though the UI warns only above 4 selected signs.
- The `.freebuff/project-id` file (untracked) identifies this workspace to Freebuff; ignore it in review.

---

## 7. One-paragraph summary for a new AI assistant

`reelautomation` (aka CanvaReel / StarryVibes) is a static Vite + React 18 SPA that turns an uploaded JSON array of 1–12 horoscopes into 1080×1920 H.264 MP4s entirely in the browser. Zustand's `useRenderQueue` turns the upload plus the chosen render mode into ordered tasks — `{ type: 'single', data: [sign] }` per sign and/or one `{ type: 'group', data: [sign, sign, …], groupNumber }` per configured group (any number of groups) — and renders them sequentially; `renderSign(signs[], onProgress)` builds a single paused GSAP timeline (intro ring → one 13.1 s zodiac card per sign → outro CTA), advances it frame-by-frame at 30 fps, rasterizes each frame to JPEG on a detached canvas, and pipes the sequence into FFmpeg WASM (`libx264`, `ultrafast`, `crf 23`). A single reel is ~31.75 s; a group reel is ~31.75 s + 13.1 s per extra card (2 signs = 45 s). Resulting blobs go to IndexedDB and are shown in a gallery with ZIP download/delete. Typography is tuned in `/design` and stored in `localStorage.fontConfig`. There is **no backend, database, auth, payment, AI, analytics, or CI** — the only "integrations" are the browser's IndexedDB/localStorage/Notifications and FFmpeg WASM, plus a Vercel static hosting config. The complete WebCodecs worker engine in `renderWorker.js` is written but unwired, the `scripts/` folder and all four Markdown docs except this one are stale, and rendering currently blocks the UI thread.
