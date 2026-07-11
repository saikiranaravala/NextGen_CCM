# NextGen-CCM Tutorial Video

**`nextgen-ccm-tutorial.mp4`** — 1280×720 @ 25fps, ~1:54, H.264 + AAC ambient soundtrack.
Five persona chapters: Template Designer, Business Author, Production Ops, Developer, Compliance Officer.

## Files

| File | Purpose |
|---|---|
| `nextgen-ccm-tutorial.mp4` | The final video |
| `tutorial.html` | The film source (open in a browser to watch interactively — poster has a chapter menu) |
| `gen-music.js` | Synthesizes `music.wav` (Dm–Bb–F–C ambient pad + plucks; pure Node, no deps) |
| `record.js` | Headless Chrome/Edge capture (`?autoplay=1`) + ffmpeg audio mux |

## Re-render (after editing tutorial.html)

```powershell
npm install        # once — puppeteer-core, puppeteer-screen-recorder, ffmpeg-static
npm run build      # = gen-music.js + record.js → nextgen-ccm-tutorial.mp4
```

Requires Chrome or Edge installed (no Chromium download). Resolution/fps: edit `W`, `H`, `FPS` in `record.js`.

Note: the shareable web version of this film lives as a Claude artifact and is edited from
the conversation that published it; `tutorial.html` here is the same content wrapped for `file://` playback.
