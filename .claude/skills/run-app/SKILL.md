---
name: run-app
description: Start the NextGen-CCM app locally (backend API + frontend UI). Use when asked to run, start, launch, or demo the app, or before any end-to-end verification.
---

# Run NextGen-CCM

Two processes, separate terminals (or background tasks):

## Backend (API, port 3000)
```powershell
cd backend
npm install          # first time only
npm start            # node src/server.js
```
- Health check: `GET http://localhost:3000/api/v1/health` → `{"status":"ok"}`
- Settings come from `backend/config.xml`; secrets from `backend/.env` (copy `.env.example`).
- Without `OPENROUTER_API_KEY` in `.env`, `/api/v1/ai/*` returns 503 — everything else works.
- Startup log line states whether AI features are enabled.
- Only one instance can bind port 3000 — check for a stale process if EADDRINUSE or if behavior looks stale after code changes (kill and restart; old instances hold old code AND old in-memory state).

## Frontend (UI, port 8080)
```powershell
cd frontend
npm start            # node serve.js — zero-dependency static server
```
- Open http://localhost:8080 → Dashboard `/`, Designer `/designer.html`, Content Author `/author.html`
- Backend URL is set in `frontend/config.js` (`window.CCM_API_BASE`, default http://localhost:3000).

## Reset to seed data
Stop the backend, delete `backend/data`, `backend/out`, `backend/archive`, start again — `src/seed.js` reseeds applications, themes, templates, paragraphs, and hooks on boot.

## Gotchas
- In this sandbox, `node src/server.js` run via Bash auto-backgrounds; capture the task id to stop it later (TaskStop) before restarting.
- Force a failover demo by sending to an email containing "bounce".
