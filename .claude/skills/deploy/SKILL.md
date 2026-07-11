---
name: deploy
description: Deploy NextGen-CCM backend and frontend separately. Use when asked about deployment, hosting, production setup, or environment configuration.
---

# Deploy NextGen-CCM

Backend and frontend ship independently. Full narrative in root README.md — this is the checklist.

## Backend (Node service)
1. Copy `backend/` **excluding** `node_modules`, `data`, `out`, `archive`, `.env`.
2. `npm ci --omit=dev` on the host (Node ≥ 20).
3. Secrets: create `backend/.env` from `.env.example` (`OPENROUTER_API_KEY`). On cloud hosts prefer platform secret manager → real env vars (env always overrides `.env`).
4. Settings in `backend/config.xml`:
   - `<server><port>` — listen port
   - `<server><corsOrigin>` — **exact frontend origin** in production (never leave `*`)
   - `<ai>` — gateway URL/model (any OpenAI-compatible endpoint)
   - `<storage>` — point at a persistent volume in containers
5. Run under a supervisor: systemd / NSSM (Windows) / pm2 / Docker (`node src/server.js`).
6. TLS terminates at a reverse proxy in front; health check `GET /api/v1/health`.
7. Single instance per port; horizontal scale requires replacing the JSON store with a shared DB (PRD §4.2).

## Frontend (static files — no build step, no Node in prod)
1. Edit `frontend/config.js`: `window.CCM_API_BASE = 'https://<backend-host>'`.
2. Publish `index.html`, `designer.html`, `author.html`, `app.css`, `config.js` to any static host (nginx / IIS / S3+CloudFront / Azure Static Web Apps).
3. Dictation (Web Speech API) needs Chrome/Edge on an HTTPS origin (or localhost).
4. Artifact downloads are served by the **backend** (`/out`, `/archive`) — links already route via `CCM_API_BASE`.

## Post-deploy verification
- `GET /api/v1/health` from outside → 200
- Preflight from the frontend origin returns the correct `Access-Control-Allow-Origin`
- One on-demand send from the deployed Dashboard; check trace + artifact download
- AI: one `POST /api/v1/ai/draft-letter` (or confirm intentional 503)
