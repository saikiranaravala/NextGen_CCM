---
name: prd-feature
description: Add or change a NextGen-CCM feature the PRD-driven way. Use when asked to add a feature, implement an FR, or when a change touches product scope — keeps PRD.md, status.md, and training docs in sync.
---

# PRD-Driven Feature Workflow

Every product-scope change flows through four synchronized documents. Skipping any of them is the project's definition of "not done."

## 1. PRD.md first (the source of truth)
- New capability → new `FR-x.y` under the matching §3.x subsection (or a new §3.x at the end — FR numbering is coupled to subsection numbers; **never renumber or reuse existing codes**).
- Bump the semantic version in the header + add a **Changelog** bullet.
- Add a row to the **§1.3 Competitive Parity Matrix** (columns: Exstream / Inspire / SmartCOMM / NextGen-CCM; legend ✅/⚠️/❌; verify competitor claims against vendor docs before asserting them).
- Quantitative targets use LaTeX-style notation (e.g. `$P_{99} \le 300\text{ms}$`).

## 2. Implement in backend/src/
- Follow the pipeline placement: compose.js (UDM/rules/lookups) · renderers.js (outputs) · orchestrator.js (journeys/idempotency) · batch.js · tracking.js (events/ledger) · archive.js · hooks.js · ai.js · routes.js (API).
- Non-secret settings → `backend/config.xml`; secrets → `backend/.env` only.
- New pipeline stages must fire pre/post hooks (FR-13.2) and emit lifecycle/log events.
- Extend `backend/scripts/smoke-test.js` with at least one check for the new FR.

## 3. status.md
- Add/update the feature row (✅ with a one-line "how verified" note, or 🚫 deferred).
- Record any issues found & fixed during verification in the "Issues" section.

## 4. docs/training/
- Update the module covering the FR's section (module ↔ §3.x mapping is in docs/training/README.md): core concept keyed to the FR code, legacy-platform mapping row, one consultant exercise, one knowledge-check question.

## 5. Verify
Invoke the project `verify` skill (fresh-state smoke must pass 23+ checks including the new one).
