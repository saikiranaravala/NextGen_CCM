# NextGen-CCM

An **AI-native, cloud-first Customer Communication Management (CCM) platform** — reference MVP implementation of [PRD.md](PRD.md), built to disrupt legacy CCM suites (OpenText Exstream, Quadient Inspire, SmartCOMM) by decoupling **data extraction → document composition → delivery orchestration** into independent services.

> **Status:** Node.js reference MVP proving the functional model and API contracts. The production target is a Rust/Go composition engine on vendor-neutral Kubernetes (see PRD §4.4). Feature-by-feature implementation status: [status.md](status.md).

## Repository Layout

```
backend/    REST API + composition/orchestration engine (Node.js + Express + PDFKit)
frontend/   Web UI — Dashboard, Designer, Content Author (static files, any web server)
docs/       Consultant training curriculum
PRD.md      Product requirements (source of truth for FR codes)
status.md   FR-by-FR implementation & verification status
```

**Configuration model:**
- **Secrets** → `backend/.env` (git-ignored; copy from `backend/.env.example`) — loaded natively by Node, no dotenv package
- **Settings** → `backend/config.xml` (port, CORS origin, AI model/gateway, storage paths, log level)
- **Frontend** → `frontend/config.js` (`window.CCM_API_BASE` — the backend URL)

---

## Quick Start (local development)

**Prerequisites:** Node.js ≥ 20

**Terminal 1 — backend (API on :3000):**
```powershell
cd backend
npm install
copy .env.example .env      # then edit .env and set OPENROUTER_API_KEY (optional — enables AI features)
npm start
```

**Terminal 2 — frontend (UI on :8080):**
```powershell
cd frontend
npm start                   # zero-dependency static server for dev
```

Open **http://localhost:8080**:

| UI | Page | What it does |
|---|---|---|
| **Dashboard** | `/` | Send on-demand communications, run batches, selective reprint, runtime log levels, track & trace |
| **Designer** | `/designer.html` | Edit templates, DRAFT-watermarked PDF preview, versioning & approval, ✨ AI conversational editing (FR-7.4) |
| **Content Author** | `/author.html` | Governed letter composition — approved paragraphs, 🎤 dictation, ✨ AI drafting (FR-7.1) |

**Verify end-to-end** (backend running, from `backend/`):
```powershell
npm run smoke     # 23 checks; delete backend/data, out, archive first for a clean run
```

---

## Backend Deployment

The backend is a stateless-per-request Express service; state lives in JSON files under `backend/data` (a stand-in for the production database, PRD §4.2).

### 1. Provision
- Node.js ≥ 20 on the host (Windows or Linux)
- Copy the `backend/` directory to the server (exclude `node_modules`, `data`, `out`, `archive`, `.env`)
- `npm ci --omit=dev` (or `npm install`) on the host

### 2. Configure
- **Secrets:** create `backend/.env` from `.env.example`; set `OPENROUTER_API_KEY`. Never commit `.env`; on cloud hosts prefer the platform's secret manager injecting real env vars (env vars always override `.env`).
- **Settings:** edit `backend/config.xml`:
  - `<server><port>` — listening port
  - `<server><corsOrigin>` — **set this to the frontend's exact origin** (e.g. `https://ccm-ui.example.com`); leave `*` only for dev
  - `<ai><model>` / `<ai><baseUrl>` — any OpenAI-compatible gateway/model
  - `<storage>` — move `data/out/archive` onto a persistent volume in containerized deployments

### 3. Run as a service
- **Linux (systemd):**
  ```ini
  [Service]
  WorkingDirectory=/opt/nextgen-ccm/backend
  ExecStart=/usr/bin/node src/server.js
  Restart=always
  ```
- **Windows:** register with [NSSM](https://nssm.cc) or a scheduled task: `node src/server.js` in `backend/`
- **Process manager alternative:** `pm2 start src/server.js --name ccm-backend`
- **Docker (sketch):** `FROM node:22-alpine`, copy `backend/`, `npm ci --omit=dev`, `CMD ["node","src/server.js"]`; mount volumes for `data/`, `out/`, `archive/`; pass `OPENROUTER_API_KEY` as a container env var instead of `.env`

### 4. Operate
- Health check: `GET /api/v1/health`
- Runtime log level: `POST /api/v1/admin/log-level` (no restart, FR-6.4)
- Put a TLS-terminating reverse proxy (nginx/IIS/ALB) in front; the app serves plain HTTP
- Only one instance can bind the port; horizontal scaling requires replacing the JSON store with a shared database (as the PRD prescribes)

## Frontend Deployment

The frontend is **pure static files** — no build step, no Node required in production.

### 1. Configure
Edit `frontend/config.js` and point it at the deployed backend:
```javascript
window.CCM_API_BASE = 'https://ccm-api.example.com';
```
(Ensure the backend's `config.xml` `<corsOrigin>` matches the frontend's origin.)

### 2. Publish
Copy `index.html`, `designer.html`, `author.html`, `app.css`, `config.js` to any static host:

- **nginx:**
  ```nginx
  server {
    listen 443 ssl;
    server_name ccm-ui.example.com;
    root /var/www/nextgen-ccm-frontend;
    index index.html;
  }
  ```
- **IIS:** create a site pointing at the folder (static files need no handler mappings)
- **Cloud object storage/CDN:** S3 + CloudFront, Azure Static Web Apps, Netlify, GitHub Pages — upload the five files
- **Dev only:** `node serve.js` (the bundled zero-dependency server, port 8080)

### 3. Notes
- 🎤 Dictation uses the browser Web Speech API — requires Chrome/Edge and an HTTPS origin (or localhost)
- Artifact downloads (PDFs, reports) are served by the **backend** (`/out`, `/archive`) — the UI links them via `CCM_API_BASE` automatically

---

## API Overview (`/api/v1`)

| Endpoint | Purpose |
|---|---|
| `POST /communications/on-demand` | Trigger a communication (PRD §5.2 contract: `template_id`, `idempotency_key`, `recipient.preferences`, `payload`) |
| `POST /batch` · `GET /batch/:jobId` · `POST /batch/:jobId/reprint` | Batch runs, report files, selective reprint |
| `GET/POST /templates` · `POST /templates/:id/approve` · `POST /templates/:id/preview` | Template CRUD, versioning, approval, draft preview |
| `POST /ai/draft-letter` · `POST /ai/template-edit` | AI features (FR-7.1/7.4) via the configured gateway; 503 with a clear message if no API key |
| `GET /audit/:txId` · `POST /audit/:txId/verify` | Track & trace lifecycle + SHA-256 ledger verification |
| `GET /archive?customerId=…` | Search the synchronous archive index |
| `GET/POST /hooks` | Sandboxed lifecycle hooks (pre/post at every pipeline stage) |
| `GET/POST /admin/log-level` | Runtime log levels, global or per scope |
| `GET /applications` · `/themes` · `/fonts` · `/paragraphs` | Workspace partitioning, theming, fonts, approved paragraph library |

## Feature Tour (5 minutes)

1. **On-demand with failover** — Dashboard: recipient email `bounce@example.com`, preferred EMAIL, fallback SMS → Send. Trace shows `Dispatched → Failed (EMAIL) → Delivered (SMS)`.
2. **Idempotency** — set an idempotency key and send twice: second call returns the same transaction, no duplicate.
3. **Batch + report + reprint** — run `tpl_invoice` against `invoices.csv` → merged 10-page PDF + per-record report with page ranges; reprint records `2,5` without re-running.
4. **N-up imposition** — run `tpl_bizcard` against `bizcards.csv`: 12 cards, 10-up on A4 with cut marks.
5. **Content locking** — Designer: edit the `legal` block of `tpl_invoice` → server rejects with 403; legit saves create a new draft version requiring re-approval.
6. **Integrity ledger** — `POST /api/v1/audit/{txId}/verify` with original payload → `valid: true`; tampered payload fails.
7. **AI drafting (FR-7.1)** — Content Author: type an intent → ✨ AI Draft; generated body grounded only in the approved paragraph library.
8. **AI template editing (FR-7.4)** — Designer: "make the greeting bold and move the promo above the body" → ✨ AI Edit; locked blocks are skipped server-side, result saved as draft.

## Simulation Notes

- **Digital gateways are simulated:** email/SMS/WhatsApp messages land in `backend/out/gateway/` instead of being sent; an address containing `bounce` forces gateway failure to demo failover.
- **Print output is PDF.** AFP/PCL/ZPL drivers, migration toolkit, and connector marketplace are deferred — see 🚫 rows in [status.md](status.md).

## Documentation

- **[PRD.md](PRD.md)** — full product requirements, competitive parity matrix, KPIs
- **[status.md](status.md)** — what is implemented, verified, and deferred
- **[docs/training/](docs/training/README.md)** — 15-module consultant training curriculum
