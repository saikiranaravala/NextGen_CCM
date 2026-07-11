# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository State

This repository contains `PRD.md` (the Product Requirement Document for **NextGen-CCM**), `docs/training/` (the consultant training curriculum, one module per PRD functional area, keyed to FR codes), and a **Node.js reference MVP** implementing the PRD's core pipeline (`backend/`, `frontend/`, `video/`). `status.md` tracks which FRs are implemented vs. deferred — consult it before claiming a feature exists. When the PRD changes, check whether the corresponding training module in `docs/training/` and `status.md` need the same update.

**Project skills** live in `.claude/skills/`: `run-app` (start both services), `verify` (fresh-state smoke + manual checks), `prd-feature` (the four-document feature workflow), `deploy` (per-service deployment checklist), `render-video` (demo MP4 pipeline). Prefer invoking these over re-deriving the steps.

## Commands

The app is split into `backend/` (Express API) and `frontend/` (static UI) — each deploys separately (see README.md).

- Backend: `cd backend && npm install && npm start` — API on http://localhost:3000
- Frontend: `cd frontend && npm start` — static dev server on http://localhost:8080 (production: any web server; no build step)
- `cd backend && npm run smoke` — end-to-end smoke test against a **running** backend (23 checks; expects fresh state — reset `backend/data|out|archive` first, otherwise the idempotency check reports 200 instead of 202)

## Configuration

- **Secrets** live in `backend/.env` (git-ignored; template at `backend/.env.example`; loaded via Node's native `process.loadEnvFile` — no dotenv). `OPENROUTER_API_KEY` enables the AI features (FR-7.1/7.4); without it `/api/v1/ai/*` returns 503 and everything else works.
- **Settings** live in `backend/config.xml` (port, `corsOrigin`, AI gateway/model, storage paths, initial log level) — parsed by `backend/src/config.js`. Env vars override config.xml; config.xml overrides built-in defaults. Never put secrets in config.xml.
- **Frontend → backend wiring**: `frontend/config.js` sets `window.CCM_API_BASE`; the backend's `<corsOrigin>` must match the frontend origin in production.
- State lives in `data/` (JSON collections), outputs in `out/`, archives in `archive/`. Delete all three to reset to seed data (`src/seed.js` reseeds on boot). Only one instance can bind port 3000.

## Code Architecture (MVP)

Pipeline mirrors the PRD's three planes (all under `backend/src/`): `compose.js` (UDM: template + payload + lookups + rules), `renderers.js` (PDF with page-setup/N-up/watermarks, simulated email/SMS/WhatsApp gateways — an address containing "bounce" forces gateway failure to demo failover), `orchestrator.js` (journeys, failover, idempotency), `batch.js` (driver files, report files, selective reprint), `tracking.js` (lifecycle events + SHA-256 ledger), `archive.js`, `hooks.js` (vm-sandboxed lifecycle hooks), `ai.js` (OpenRouter-backed FR-7.1/7.4), `routes.js` (REST API under `/api/v1`), `config.js` (.env + config.xml loader). Persistence is JSON-file collections via `store.js` — a stand-in for the production database. The frontend (`frontend/*.html`) is framework-free static HTML/JS calling the API cross-origin via `window.CCM_API_BASE`.

## What NextGen-CCM Is

An AI-native, cloud-first, enterprise-grade Customer Communication Management (CCM) platform intended to disrupt the three legacy incumbents: **OpenText Exstream, Quadient Inspire, and Smart Communications SmartCOMM**. The architecture decouples three concerns into a microservices ecosystem:

1. **Data extraction** — ingesting JSON/CSV/XML payloads from enterprise systems
2. **Document composition** — a high-speed rendering engine (Rust/Go) compiling a Unified Document Model (UDM) into print (AFP/MO:DCA, PDF, PostScript, PCL, ZPL) and digital (responsive email, WhatsApp, SMS, push) outputs
3. **Delivery orchestration** — state-driven omnichannel journeys with failover channels, idempotency guarantees, and full track-and-trace auditing

Target markets are regulated enterprises (banking, insurance, healthcare), which drives the hard requirements: AFP output fidelity, PDF/A archiving, SOC 2 / HIPAA / GDPR compliance, 50k pages/min batch throughput, and P99 ≤ 300ms on-demand rendering.

## PRD.md Conventions

When editing `PRD.md`, preserve these established conventions:

- **Versioning:** Semantic version in the header plus a **Changelog** bullet list. Bump the version and add a changelog entry for any substantive change.
- **Requirement codes:** Functional requirements use `FR-<section>.<item>` (e.g., FR-7.2 is item 2 of §3.7). Section numbering and FR numbering are coupled — adding a new §3.x subsection means its FRs are `FR-x.y`. Never renumber or reuse existing codes; cross-references to FR codes appear throughout the document (especially in the §1.3 parity matrix and §6 KPIs).
- **Competitive parity matrix (§1.3):** Any new capability added to §3 should get a row here mapping it against the three incumbents (✅ / ⚠️ / ❌ legend). Competitor claims in this matrix were sourced from vendor documentation (opentext.com, quadient.com, smartcommunications.com) — verify against current vendor docs before changing them.
- **Math/metric notation:** Performance targets use LaTeX-style inline math (e.g., `$P_{99} \le 300\text{ms}$`). Follow this style for new quantitative targets.
- **Structure:** §1 Vision/Differentiation/Parity Matrix → §2 Personas → §3 Functional Requirements → §4 NFRs → §5 System Boundary & API Contracts → §6 KPIs.

## Future Implementation Guardrails (from the PRD)

If/when code lands in this repo, these PRD-level architectural decisions are binding unless the PRD is revised first:

- Stateless worker services; multi-tenancy enforced via row-level security
- Vendor-neutral Kubernetes (no OpenShift-specific dependencies); KEDA-based elastic scaling; blue-green releases
- Rendering engine in Rust/Go; APIs exposed as REST + gRPC; event integration via Kafka
- Every delivery must be idempotent (transaction-token matching) and emit lifecycle events (Triggered → Composed → Dispatched → Gateway Handshake → Delivered → Read)
- AI features (§3.7) must be grounded in approved content libraries — no ungrounded generation into customer communications
