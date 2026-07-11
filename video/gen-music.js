// Generates music.wav — the same ambient track the web page synthesizes:
// Dm–Bb–F–C pad (detuned saws through a lowpass feel), sub bass, sparse D-minor-pentatonic plucks.
// Pure Node, no dependencies: writes 16-bit stereo PCM WAV at 44.1 kHz.
const fs = require('fs');

const SR = 44100;
const DURATION = 300; // seconds — longer than the film; ffmpeg -shortest trims it
const BAR = 8;        // seconds per chord
const N = SR * DURATION;

const CHORDS = [
  { pad: [146.83, 174.61, 220.0], bass: 73.42 },  // Dm
  { pad: [116.54, 174.61, 233.08], bass: 58.27 }, // Bb
  { pad: [174.61, 220.0, 261.63], bass: 87.31 },  // F
  { pad: [130.81, 164.81, 196.0], bass: 65.41 },  // C
];
const PENT = [293.66, 349.23, 392.0, 440.0, 523.25, 587.33];

const L = new Float32Array(N);
const R = new Float32Array(N);

// simple band-limited-ish saw via few harmonics, pre-softened (stands in for the lowpass)
function saw(phase) {
  return Math.sin(phase) + Math.sin(2 * phase) / 2.4 + Math.sin(3 * phase) / 4.5 + Math.sin(4 * phase) / 8;
}
function envAt(t, a, hold, r) {
  if (t < 0) return 0;
  if (t < a) return t / a;
  if (t < a + hold) return 1;
  const q = (t - a - hold) / r;
  return q < 1 ? 1 - q : 0;
}

function addTone({ start, freq, dur, a, hold, r, amp, gen, pan = 0, detune = 0 }) {
  const f = freq * Math.pow(2, detune / 1200);
  const from = Math.max(0, Math.floor(start * SR));
  const to = Math.min(N, Math.ceil((start + dur) * SR));
  const gl = amp * (pan <= 0 ? 1 : 1 - pan);
  const gr = amp * (pan >= 0 ? 1 : 1 + pan);
  const w = 2 * Math.PI * f / SR;
  let phase = 0;
  for (let i = from; i < to; i++) {
    const t = i / SR - start;
    const s = gen(phase) * envAt(t, a, hold, r);
    L[i] += s * gl;
    R[i] += s * gr;
    phase += w;
  }
}

let rngState = 42;
const rand = () => (rngState = (rngState * 1664525 + 1013904223) >>> 0) / 4294967296;

const bars = Math.ceil(DURATION / BAR);
for (let b = 0; b < bars; b++) {
  const t0 = b * BAR;
  const c = CHORDS[b % CHORDS.length];
  const master = b === bars - 1 ? 0.6 : 1; // slight ease on final bar
  for (const f of c.pad) {
    addTone({ start: t0, freq: f, dur: BAR + 0.5, a: 2.6, hold: BAR - 4.8, r: 2.4, amp: 0.05 * master, gen: saw, pan: -0.35, detune: -6 });
    addTone({ start: t0, freq: f, dur: BAR + 0.5, a: 2.6, hold: BAR - 4.8, r: 2.4, amp: 0.05 * master, gen: saw, pan: 0.35, detune: 6 });
  }
  addTone({ start: t0, freq: c.bass, dur: BAR, a: 1.2, hold: BAR - 3.4, r: 2.0, amp: 0.16 * master, gen: Math.sin });
  for (let k = 0; k < 3; k++) {
    if (rand() < 0.75) {
      addTone({
        start: t0 + 1 + rand() * (BAR - 3), freq: PENT[(rand() * PENT.length) | 0],
        dur: 2, a: 0.012, hold: 0.04, r: 1.7, amp: 0.08, gen: Math.sin, pan: rand() * 1.2 - 0.6,
      });
    }
  }
}

// gentle fade-in / fade-out on the whole track + soft clip
const FADE = 2 * SR;
for (let i = 0; i < N; i++) {
  let g = 1;
  if (i < FADE) g = i / FADE;
  if (i > N - FADE) g = (N - i) / FADE;
  L[i] = Math.tanh(L[i] * g);
  R[i] = Math.tanh(R[i] * g);
}

// write 16-bit stereo WAV
const bytes = N * 4;
const buf = Buffer.alloc(44 + bytes);
buf.write('RIFF', 0); buf.writeUInt32LE(36 + bytes, 4); buf.write('WAVE', 8);
buf.write('fmt ', 12); buf.writeUInt32LE(16, 16); buf.writeUInt16LE(1, 20); buf.writeUInt16LE(2, 22);
buf.writeUInt32LE(SR, 24); buf.writeUInt32LE(SR * 4, 28); buf.writeUInt16LE(4, 32); buf.writeUInt16LE(16, 34);
buf.write('data', 36); buf.writeUInt32LE(bytes, 40);
for (let i = 0; i < N; i++) {
  buf.writeInt16LE(Math.max(-32768, Math.min(32767, L[i] * 32767)) | 0, 44 + i * 4);
  buf.writeInt16LE(Math.max(-32768, Math.min(32767, R[i] * 32767)) | 0, 46 + i * 4);
}
fs.writeFileSync('music.wav', buf);
console.log(`music.wav written — ${DURATION}s stereo 44.1kHz (${(buf.length / 1048576).toFixed(1)} MB)`);
