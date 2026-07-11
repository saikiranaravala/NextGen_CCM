# NextGen-CCM Implementation Status

**Implementation:** Node.js reference MVP (Express + PDFKit). The PRD targets Rust/Go for the production composition engine; this MVP proves the functional model and API contracts first.
**Last verified:** 2026-07-09 — full smoke test: **23/23 checks passed** (`npm run smoke` output below).
**Legend:** ✅ done & verified · 🚫 out of MVP scope (deferred)

| Feature | FR | Status |
|---|---|---|
| Web Designer (template editor UI) | FR-1.1 | ✅ `public/designer.html` — edit/save/preview/approve |
| Unified Document Model compose | FR-1.2 | ✅ `src/compose.js` — one UDM rendered to PDF/email/SMS |
| Content locking | FR-1.3 | ✅ server-side 403 on locked-block change (smoke-verified) |
| Template versioning + approval | FR-1.4/1.5 | ✅ auto version bump, history, draft→approved gate (409 on unapproved send) |
| Master themes | FR-1.6 | ✅ theme collection applied across channels |
| Watermarks | FR-1.7 | ✅ per-template/job toggle; DRAFT watermark on previews |
| Custom fonts | FR-1.8 | ✅ font registry + PDF embedding (drop TTF in samples/, register in data/fonts.json) |
| Content Author Studio + dictation | FR-1.9 | ✅ `public/author.html` — governed shell, paragraph library, Web Speech dictation, governed dispatch |
| Journeys with channel failover | FR-2.1 | ✅ preferred→fallback→PRINT plan; bounce→SMS smoke-verified |
| Channels: print/email/SMS/WhatsApp (simulated gateways) | FR-2.2 | ✅ artifacts in `out/gateway/` |
| Idempotency engine | FR-2.3 | ✅ replay returns original transaction (smoke-verified) |
| Batch engine (driver file CSV/JSON) | FR-3.1 | ✅ 10-record CSV → merged 10-page PDF |
| On-demand endpoint | FR-3.2 | ✅ `POST /api/v1/communications/on-demand` (PRD §5.2 contract) |
| Interactive customization | FR-3.3 | ✅ covered via Content Author editable zones in MVP |
| Secondary reference lookups | FR-3.4 | ✅ driver-field-keyed lookups (products.json), verified via promo block |
| Production report files | FR-3.5 | ✅ per-record JSON report with configurable fields + page ranges |
| Selective reprint | FR-3.6 | ✅ reprint by record index from report file (smoke-verified) |
| AFP / PCL / ZPL drivers | FR-4.1/4.2 | 🚫 PDF only in MVP |
| OMR / sorting | FR-4.3 | 🚫 deferred |
| Page setup + N-up imposition | FR-4.4 | ✅ size/orientation/watermark + 10-up business cards w/ cut marks (12 cards → 2 pages) |
| Synchronous archive + index | FR-5.1/5.2 | ✅ archive copy + SHA-256 + index fields in same flow (TLE n/a without AFP) |
| Track & trace lifecycle | FR-6.1 | ✅ Triggered→Composed→Dispatched→Gateway Handshake→Delivered (+Failed on bounce) |
| SHA-256 integrity ledger | FR-6.2 | ✅ canonical hash; verifies original, rejects tampered payload (bug found & fixed during verification) |
| Event ingestion pipeline | FR-6.3 | ✅ simulated gateway events drive journey transitions |
| Runtime log levels | FR-6.4 | ✅ trace/debug/info/warn/error, global + per-scope, no restart |
| AI: generative content authoring (grounded letter drafting) | FR-7.1 | ✅ via OpenRouter — `POST /api/v1/ai/draft-letter` + "✨ AI Draft" in Content Author; grounded strictly in the approved paragraph library |
| AI: conversational template editing | FR-7.4 | ✅ via OpenRouter — `POST /api/v1/ai/template-edit` + "✨ AI Edit" in Designer; structured block edits, locked blocks re-enforced server-side, saved as draft version requiring re-approval |
| AI: migration accelerator / AI proofing | FR-7.2/7.3 | 🚫 deferred |
| Visual rules (conditional blocks) | FR-8.1 | ✅ JSON rule conditions (eq/ne/gt/lt/in/exists), CA-notice rule verified |
| Rule simulation | FR-8.2 | 🚫 deferred |
| Migration toolkit | FR-9.x | 🚫 deferred |
| Proofing matrix / sandbox | FR-10.x | 🚫 deferred (DRAFT-watermarked preview only) |
| Connector marketplace/SDK | FR-11.x | 🚫 deferred (REST API is the boundary) |
| Dashboards | FR-12.1 | ✅ `public/index.html` — transactions, lifecycle, ledger, log-level control |
| Scripting hooks at pipeline stages | FR-13.1/13.2 | ✅ vm-sandboxed JS, 500ms quota, pre/post at ingestion/lookup/composition/rendering/post-processing/delivery/archiving; name-normalizer hook verified |
| Multi-application partitioning | FR-14.1 | ✅ applications collection + template/paragraph/hook scoping |

## Verification (all automated in `npm run smoke`)
- ✅ Server starts, health check passes
- ✅ On-demand end-to-end: compose → render → dispatch → trace → archive → ledger verify
- ✅ Failover journey (bounced email → SMS)
- ✅ Idempotent replay returns same transaction (200 vs 202)
- ✅ Batch with lookups, report file with page ranges, merged 10-page PDF
- ✅ Selective reprint of records [2, 5]
- ✅ N-up imposition (12 business cards, 10-up, 2 pages, valid PDF structure)
- ✅ Pre-ingestion hook normalizes names ("jane doe" → "Jane Doe")
- ✅ Locked block change → 403; unapproved template send → 409
- ✅ Runtime log level switch (global + per-job scope)
- ✅ PDF structural validation (header/EOF/page counts); email contains rule-driven CA notice + lookup promo

## Issues found & fixed during evaluation
1. **Ledger hash ignored payload contents** — `JSON.stringify` replacer array filtered nested keys, so tampered payloads still verified. Fixed with recursive key-sorted canonicalization (`src/tracking.js`). Caught by smoke check "ledger rejects tampered payload."
2. **Stale server on port 3000** during re-test caused false failures — resolved by stopping the old process; noted for ops: only one instance can bind port 3000.

## How to Run
The app is split into `backend/` and `frontend/` (v0.2.0 restructure) — full deployment instructions in `README.md`:
1. Backend: `cd backend && npm install`, copy `.env.example` → `.env` (set `OPENROUTER_API_KEY` for AI features), `npm start` → API on :3000. Settings (port, CORS, AI model, storage, log level) in `backend/config.xml`.
2. Frontend: `cd frontend && npm start` → UI on http://localhost:8080 (static files; production = any web server; backend URL in `frontend/config.js`).
3. Verify: `cd backend && npm run smoke` (fresh state → 23/23; verified after the split, including CORS preflight and cross-origin UI serving).

AI endpoints return 503 with a clear message when `OPENROUTER_API_KEY` is unset; everything else works without it.
