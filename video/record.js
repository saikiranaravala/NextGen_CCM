// Records tutorial.html to MP4 using headless Edge/Chrome (via puppeteer-core),
// then muxes music.wav in with ffmpeg-static. Output: nextgen-ccm-tutorial.mp4
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const puppeteer = require('puppeteer-core');
const { PuppeteerScreenRecorder } = require('puppeteer-screen-recorder');
const ffmpeg = require('ffmpeg-static');

const BROWSERS = [
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
];
const W = 1280, H = 720, FPS = 25, MAX_MS = 6 * 60 * 1000;

(async () => {
  const browserPath = BROWSERS.find(fs.existsSync);
  if (!browserPath) throw new Error('No Edge/Chrome found — edit BROWSERS in record.js');
  console.log(`Browser: ${browserPath}`);

  const browser = await puppeteer.launch({
    executablePath: browserPath,
    headless: true,
    args: [`--window-size=${W},${H}`, '--force-device-scale-factor=1', '--mute-audio', '--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage'],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: W, height: H });

  const url = 'file:///' + path.resolve(__dirname, 'tutorial.html').replace(/\\/g, '/') + '?autoplay=1';
  console.log(`Loading ${url}`);

  const recorder = new PuppeteerScreenRecorder(page, {
    fps: FPS,
    videoFrame: { width: W, height: H },
    videoCrf: 20,
    videoCodec: 'libx264',
    videoPreset: 'medium',
    ffmpeg_Path: ffmpeg,
    aspectRatio: '16:9',
  });

  await recorder.start(path.join(__dirname, 'silent.mp4'));
  await page.goto(url, { waitUntil: 'load' });
  console.log('Recording… (the film signals completion via window.__ccmDone)');

  const t0 = Date.now();
  await page.waitForFunction('window.__ccmDone === true', { timeout: MAX_MS, polling: 1000 });
  await new Promise((r) => setTimeout(r, 1500)); // hold the final frame
  const seconds = ((Date.now() - t0) / 1000).toFixed(1);
  await recorder.stop();
  await browser.close();
  console.log(`Video captured: ${seconds}s → silent.mp4`);

  // Mux the generated soundtrack; trim audio to video length with a closing fade
  const out = path.join(__dirname, 'nextgen-ccm-tutorial.mp4');
  const fadeStart = Math.max(0, seconds - 3);
  execFileSync(ffmpeg, [
    '-y',
    '-i', path.join(__dirname, 'silent.mp4'),
    '-i', path.join(__dirname, 'music.wav'),
    '-c:v', 'copy',
    '-c:a', 'aac', '-b:a', '160k',
    '-filter:a', `afade=t=out:st=${fadeStart}:d=3,volume=0.9`,
    '-shortest',
    out,
  ], { stdio: 'inherit' });

  fs.unlinkSync(path.join(__dirname, 'silent.mp4'));
  const mb = (fs.statSync(out).size / 1048576).toFixed(1);
  console.log(`\nDONE → ${out} (${mb} MB, ${seconds}s, ${W}x${H}@${FPS})`);
})().catch((e) => { console.error(e); process.exit(1); });
