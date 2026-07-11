# Module 10 — Omnichannel Proofing & QA

**PRD coverage:** §3.10 (FR-10.1, FR-10.2)
**Prerequisites:** Modules 02, 03

---

## Learning Objectives

After this module you can:
- Proof a template simultaneously across every target channel and device
- Set up a staging sandbox with synthetic or masked data
- Define a client's promotion-to-production QA gate

## Core Concepts

### FR-10.1 Device & Channel Preview Matrix
One template, simultaneous previews: print layout, major email clients, mobile (iOS/Android), smartwatch notification surfaces, WhatsApp/SMS message rendering. Kills the legacy pain of "looks right in print, broken in Outlook."

**Practice:** define per client which cells of the matrix are *release-blocking* (e.g., print + top-3 email clients) vs. *advisory* (smartwatch).

### FR-10.2 Staging Sandbox
Isolated environment for end-to-end validation — templates, rules, scripts, journeys — using **synthetic or masked-production data**, with zero risk of a live send. Delivery endpoints are stubbed; lifecycle events still flow so you can validate tracking too.

**Data rule:** in regulated accounts (HIPAA/GDPR), raw production data must never enter staging. Use the masking pipeline; document it for the client's DPO.

## The QA Gate (standard implementation pattern)

Promotion to production requires:
1. Preview matrix green on all release-blocking cells (FR-10.1)
2. Sandbox end-to-end run on representative synthetic payloads (FR-10.2)
3. Rule simulation clean (FR-8.2) if rules changed
4. AI proofing summary reviewed (FR-7.3)
5. Approval chain complete (FR-1.5)

Wire steps 1–4 as prerequisites of step 5, so approvers see evidence, not promises.

## Legacy Platform Mapping

| Concept | Exstream | Inspire | SmartCOMM |
|---|---|---|---|
| Device proofing matrix | not offered | Omnichannel proofing (incl. watch) | not offered |
| Output regression testing | PDF Comparison Tool | not offered | not offered |
| Staging with synthetic data | Custom setup | Custom setup | Sandbox environments |

## Consultant Exercises

1. Proof one statement template across the full matrix; document two channel-specific defects and fix them without breaking the other channels.
2. Build a synthetic dataset (edge cases: max-length names, RTL text, 100-line invoices) and run it through the sandbox journey end-to-end.
3. Configure the five-step QA gate for a training application and demonstrate a promotion that is blocked at step 2, then passes.

## Knowledge Check

1. What distinguishes release-blocking from advisory preview cells, and who decides?
2. Why are delivery endpoints stubbed in the sandbox, and what still flows?
3. Which four FRs feed evidence into the approval step of the QA gate?
