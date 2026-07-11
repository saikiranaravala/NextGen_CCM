---
name: render-video
description: Re-render the NextGen-CCM tutorial MP4 or edit the demo films. Use when asked to update the launch/tutorial video, change narration, or produce a new MP4.
---

# Render the Demo Videos

Two films exist, published as Claude artifacts (edit → republish keeps the same URL):
- **Launch film** (🎬, 9 scenes, ~90s) — marketing pitch
- **Tutorial film** (🎓, 5 persona chapters + intro/outro, ~2min) — working-demo walkthrough with soundtrack

## Editing the films
- Source of truth lives in the conversation scratchpad when working via Claude (artifact republish needs the same file path), and `video/tutorial.html` is the local `file://` copy for recording (same content prefixed with `<!doctype html><meta charset="utf-8">`).
- Keep the two copies in sync: regenerate `video/tutorial.html` from the edited source, don't hand-edit both.
- The films are scene arrays + per-scene async step scripts (cursor moves, typing, toasts, captions). Typewriter over HTML must append tags atomically (see the `T()` helper) — typing raw `<span>` char-by-char renders literal tags.

## Rendering the MP4
```powershell
cd video
npm install        # once: puppeteer-core, puppeteer-screen-recorder, ffmpeg-static
npm run build      # gen-music.js (WAV soundtrack) + record.js (capture + mux)
```
- Output: `video/nextgen-ccm-tutorial.mp4` (1280×720@25, H.264 + AAC).
- Uses installed Chrome/Edge (no Chromium download). Browser launch fails inside the shell sandbox — run with sandbox disabled.
- `tutorial.html?autoplay=1` skips the poster; the film sets `window.__ccmDone = true` at the end, which record.js waits on.
- Resolution/fps: `W`, `H`, `FPS` constants in `record.js`.
- Soundtrack: `gen-music.js` synthesizes the Dm–Bb–F–C ambient track (mirrors the page's Web Audio version); ffmpeg muxes with `-shortest` + 3s fade.

## Verify the render
Extract frames and eyeball them (blank/garbled frames = choreography bug):
```powershell
./node_modules/ffmpeg-static/ffmpeg.exe -y -ss 20 -i nextgen-ccm-tutorial.mp4 -frames:v 1 check.png
```
Check at least one frame per chapter region (≈20s / 45s / 60s / 80s / 100s).
