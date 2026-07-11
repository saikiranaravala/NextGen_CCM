# Module 06 — Archiving, Tracking & Compliance

**PRD coverage:** §3.5 (FR-5.1–5.2), §3.6 (FR-6.1–6.4)
**Prerequisites:** Modules 01, 03, 04

---

## Learning Objectives

After this module you can:
- Configure the synchronous archiving pipeline and AFP index tagging
- Explain the full track-and-trace lifecycle and the cryptographic integrity ledger to an auditor
- Set log levels operationally without redeploying

## Core Concepts

### FR-5.1 Synchronous Archiving Pipeline
While a print job runs, the engine *simultaneously* builds an indexed web-view rendition (PDF/A-1b or PDF/A-3) and stores it in the enterprise repository alongside the production file. Archiving is not a separate later job — no window where a document was sent but not archived.

### FR-5.2 AFP Tagging (TLE)
Index metadata (account no., document type, date) is injected natively into the AFP stream as TLE structured fields, feeding repository ingestion. **Migration note:** clients archiving legacy AFP already have TLE-driven indexes — replicate their tag dictionary exactly or their retrieval breaks.

### FR-6.1 Universal Track & Trace
Every message gets lifecycle records:

```
Triggered → Composed → Dispatched → Gateway Handshake → Delivered → Read
```

Selective reprints (FR-3.6) and Content Author dispatches (FR-1.9) flow through the same trail — one audit surface for everything.

### FR-6.2 Cryptographic Integrity Ledger
For each communication, the platform logs an immutable SHA-256 over (template version + input data parameters). This proves *exactly what was communicated* without storing a second copy of the rendered object. **Auditor pitch:** re-render from the archived template version + data, re-hash, compare — tamper-evident, storage-cheap.

### FR-6.3 Event Ingestion Pipeline
Parses hundreds of thousands of gateway webhooks/sec (delivery receipts, bounces, read events) into structured metrics. This is what feeds journey transitions (Module 03) and dashboards (Module 12).

### FR-6.4 Configurable Log Levels
Trace / Debug / Info / Warning / Error — switchable at **runtime**, per service, per job, and per tenant. Support pattern: raise one failing batch to Debug while everything else stays at Info; no restart, no redeploy.

## Compliance Story (rehearse this)

A regulator asks: *"Prove what you sent customer 99831 on 2027-07-07."*
1. Track & trace (FR-6.1) shows the full lifecycle with timestamps
2. The archive (FR-5.1) returns the PDF/A rendition, found via index (FR-5.2)
3. The integrity ledger (FR-6.2) proves the rendition matches template vX + data hash — unaltered

## Legacy Platform Mapping

| Concept | Exstream | Inspire | SmartCOMM |
|---|---|---|---|
| Archive | Via OpenText archive stack | Inspire Digital Vault | (implied) |
| AFP TLE tagging | Supported | Supported | Partial |
| Track & trace | Partial, per channel | Journey tracking | Coordinate tracking |
| Integrity hashing | Not offered | Not offered | Not offered |

The integrity ledger (FR-6.2) is a differentiator — lead with it in regulated accounts.

## Consultant Exercises

1. Run a batch and verify each record's PDF/A appears in the repository with matching TLE-derived index fields.
2. Follow one on-demand message through all six lifecycle states in the trace UI; force an email bounce and watch the failover journey extend the trail.
3. Demonstrate ledger verification: re-render an archived communication and match the SHA-256.
4. Set a single job to Trace level mid-run; confirm other tenants' logging is unaffected.

## Knowledge Check

1. Why is *synchronous* archiving a compliance feature rather than a convenience?
2. What two inputs form the integrity hash, and what attack does it defeat?
3. Which FR feeds journey state transitions with gateway events?
4. At what three scopes can log levels be changed at runtime?
