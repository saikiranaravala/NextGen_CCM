---
name: verify
description: Verify NextGen-CCM works end-to-end after a change. Use before claiming any backend/frontend change is done, or when asked to test/verify/check the app.
---

# Verify NextGen-CCM

## 1. Fresh-state smoke test (the main gate)
```powershell
cd backend
Remove-Item -Recurse -Force data, out, archive -ErrorAction SilentlyContinue
npm start          # separate terminal / background
npm run smoke      # second terminal — 23 checks, exits non-zero on failure
```
- **Must be fresh state**: with persisted `data/`, the idempotency check reports 200 instead of 202 (that's the feature working, but the test expects a first send).
- The server must be running the CURRENT code — stale background instances are the #1 false-failure cause here.

## 2. What the smoke test covers
On-demand compose→deliver, failover (bounce→SMS), idempotent replay, lifecycle events, ledger verify + tamper rejection, batch (10 records, lookups, report page ranges), pre-ingestion hook, selective reprint, N-up imposition, locked-block 403, draft/approval gates, archive index, runtime log levels, draft preview.

## 3. Not covered by smoke — check manually when touched
- **AI endpoints** (need `OPENROUTER_API_KEY`): `POST /api/v1/ai/draft-letter` with `{"intent":"..."}`; without a key expect a clean 503.
- **Frontend cross-origin**: `cd frontend && npm start`, open http://localhost:8080, send one on-demand message from the Dashboard; check the browser console for CORS errors (backend `config.xml` `<corsOrigin>` must allow the origin).
- **PDF output sanity**: check `backend/out/*.pdf` starts with `%PDF-` and page counts match records (see scripts/smoke-test.js §PDF validation pattern).

## 4. Artifacts to inspect on failure
- Batch outputs and reports: `backend/out/`
- Simulated gateway messages: `backend/out/gateway/`
- Archive + index: `backend/archive/index.json`
- Raise log verbosity at runtime without restart: `POST /api/v1/admin/log-level {"level":"debug"}`
