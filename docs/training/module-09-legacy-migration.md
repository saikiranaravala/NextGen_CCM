# Module 09 — Legacy Migration & Modernization

**PRD coverage:** §3.9 (FR-9.1, FR-9.2) + FR-7.2 (AI Migration Accelerator)
**Prerequisites:** Modules 01, 02, 04; Module 05 for print-heavy portfolios

---

## Learning Objectives

After this module you can:
- Run the three-phase migration methodology: rationalize → convert → parallel-run
- Operate the AI Migration Accelerator and review its conversion diffs
- De-risk cutover with output comparison and define acceptance criteria a client will sign

## The Migration Methodology

### Phase 1 — Rationalize (FR-9.1)
Scan the legacy portfolio (Exstream, Inspire, or SmartCOMM exports) for duplicate, near-duplicate, and orphaned templates/content blocks. Output: consolidation recommendation.

**Field reality:** a 20-year Exstream estate typically shrinks 40–60% before conversion. Never convert 1:1 — you'd be porting two decades of copy-paste. Price and plan Phase 1 as its own deliverable.

### Phase 2 — Convert (FR-7.2)
The AI Migration Accelerator ingests legacy exports (`.hpt`/DFC, Inspire resources, SmartCOMM bundles) and NLP-parses layout, business logic, and data bindings into UDM assets. Every conversion produces a **human-reviewable diff** — consultant reviews and approves each template; nothing lands unreviewed.

**KPI:** Legacy Migration Conversion Accuracy target ≥ 85% first-pass (PRD §6) — plan manual effort for the remainder (usually the templates with heavy embedded scripting).

### Phase 3 — Parallel-Run (FR-9.2)
Run identical input payloads through the legacy engine and NextGen-CCM. The comparison tool diffs outputs:
- **Byte-level** for structured formats
- **Pixel-level** for print/PDF, with configurable tolerance (font rasterization differs legitimately)

Cutover criterion (get it signed): *N consecutive production cycles with zero material diffs*. "Material" must be defined with the client — e.g., ignore sub-pixel kerning, flag any text or amount change.

## What Converts Cleanly vs. What Doesn't

| Converts well | Needs manual work |
|---|---|
| Layouts, page structure | Proprietary scripting (Exstream language, Inspire workflow scripts) → rewrite as FR-8.1 rules or FR-13.1 JS/TS |
| Static & conditional content | Deeply nested legacy logic — rationalize first, then rebuild |
| Data bindings | Custom output-driver hacks → replace with FR-4.4 configuration |
| Fonts (via FR-1.8) | Font licenses — re-verify, never assume they transfer |

## Migration Engagement Checklist

1. Inventory export from the legacy platform (all environments, not just prod)
2. Run rationalization (FR-9.1); workshop the kill-list with the client
3. Convert in application-sized batches (align to FR-14.1 workspaces)
4. Review every conversion diff; log manual-fix patterns to feed back into batching
5. Parallel-run each application; track diffs to zero
6. Cutover per application — never big-bang the whole estate

## Consultant Exercises

1. Given a sample legacy export of 50 templates, run rationalization and defend a consolidation to ~30.
2. Convert one statement template; walk the diff and classify each flagged item (auto-OK / needs edit / needs rebuild).
3. Parallel-run 1k records; tune pixel tolerance so font antialiasing passes but a deliberately altered amount fails.
4. Draft cutover acceptance criteria for a bank's statement application.

## Knowledge Check

1. Why must rationalization precede conversion?
2. What artifact makes FR-7.2 conversions auditable?
3. Why does pixel comparison need a tolerance, and what must still always fail?
4. What is the first-pass conversion accuracy target and where is it committed?
