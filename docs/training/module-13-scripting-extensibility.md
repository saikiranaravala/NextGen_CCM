# Module 13 — Scripting & Extensibility Framework

**PRD coverage:** §3.13 (FR-13.1, FR-13.2)
**Prerequisites:** Modules 02, 04, 08

---

## Learning Objectives

After this module you can:
- Write sandboxed template/orchestration scripts and know the runtime limits
- Attach lifecycle hooks at any pipeline stage
- Enforce the rules-vs-scripts decision line from Module 08 in a client team

## Core Concepts

### FR-13.1 Template & Orchestration Scripting
Sandboxed **JavaScript/TypeScript** runtime for logic beyond the visual rules builder: advanced data transformations, conditional pagination, dynamic table construction, custom orchestration branching.

- Scripts are versioned assets tied to templates/workflows (FR-1.4) — same commit/approve/rollback discipline as everything else
- Per-script CPU/memory/time quotas: a runaway script fails *itself*, not the batch node
- Open language — contrast with Exstream's proprietary scripting language, a major consultant-training cost on legacy platforms and a lock-in the client escapes here

### FR-13.2 Lifecycle Scripting Hooks
Pre/post hooks at **every** pipeline stage:

```
ingestion → transformation → reference lookup → composition → rendering
     → post-processing → delivery dispatch → archiving
```

Each stage exposes a pre-hook and post-hook. Hooks run in the same sandbox as FR-13.1, are versioned per application (FR-14.1), and emit their own audit/log events (FR-6.1, FR-6.4).

**Typical hook uses:**
| Stage | Real-world example |
|---|---|
| pre-ingestion | Normalize a partner's malformed CSV before validation |
| post-lookup | Compute a derived risk tier from fetched reference data |
| pre-rendering | Inject a per-run promotional banner decided at runtime |
| post-post-processing | Emit a custom mailroom manifest alongside report files |
| post-delivery | Notify an internal system not worth a full connector |

## Governance Rules (set these on every engagement)

1. **Rules first** (FR-8.1); scripts only where the builder can't express it — record the justification in the script header
2. Hooks must be **idempotent** — pipeline stages can retry
3. No business *content* in scripts (content belongs in the library, FR-1.5); scripts manipulate structure and data
4. Every script/hook change goes through the same QA gate as templates (Module 10)

## Legacy Platform Mapping

| Concept | Exstream | Inspire | SmartCOMM |
|---|---|---|---|
| Template scripting | Proprietary language | Workflow scripting | limited |
| Open-language sandbox (JS/TS) | not offered | not offered | not offered |
| Hooks at every pipeline stage | not offered | not offered | not offered |

Pipeline-wide hooks are a differentiator — the standard demo is the "impossible customization" a client was quoted months of vendor professional services for on their legacy platform, done as one hook.

## Consultant Exercises

1. Write a script building a dynamic transaction table with conditional pagination (carry-over headers on page breaks) for a bank statement.
2. Attach a pre-ingestion hook normalizing a deliberately messy CSV (mixed encodings, variant date formats); verify rejects drop to zero.
3. Demonstrate quota enforcement: write an infinite-loop script and show it fails cleanly without affecting the batch.
4. Audit trail drill: change a hook, promote it through the QA gate, and locate its versioned diff and runtime log events.

## Knowledge Check

1. What three quota types bound script execution, and what happens on breach?
2. Why must hooks be idempotent?
3. At which stage would you (a) fix inbound data, (b) alter print marks, (c) notify an external system post-send?
4. What is the anti-pattern regarding business content in scripts?
