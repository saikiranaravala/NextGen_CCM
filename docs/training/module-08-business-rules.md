# Module 08 — Business Rules & Decisioning

**PRD coverage:** §3.8 (FR-8.1, FR-8.2)
**Prerequisites:** Modules 01, 02

---

## Learning Objectives

After this module you can:
- Build conditional content, eligibility, and calculation rules in the visual builder
- Run what-if simulations before promoting rule changes
- Decide correctly between rules (FR-8.1) and scripting (FR-13.1)

## Core Concepts

### FR-8.1 Visual Rules Builder
No-code/low-code builder for:
- **Conditional content** — show/hide blocks by data (e.g., state-specific disclosures)
- **Eligibility logic** — which customers get which communication/variant
- **Calculations** — derived values (totals, fees, projections)

Rules are **decoupled from the layout engine**: analysts change logic without touching template design, and templates re-use rules across the portfolio.

### FR-8.2 Rule Versioning & Simulation
Rules are independently versioned. Before promotion, dry-run a rule version against sample or historical payloads; the simulation reports **which documents would change output**. **Standard practice:** never promote a rule change without a simulation against the last production cycle's data — show the client the blast radius first.

## Rules vs. Scripting — the decision line

| Use FR-8.1 rules when… | Use FR-13.1 scripting when… |
|---|---|
| Logic is expressible as conditions/lookups/formulas | You need loops, complex transformations, dynamic table construction |
| Business analysts must own and change it | Developers own it |
| Auditors need to read it | Logic complexity exceeds visual readability |

Default to rules; escalate to scripts only when the visual builder genuinely can't express it. Scripted logic is harder for client analysts to self-serve.

## Worked Example

Insurance renewal notice:
- Rule R-101 (conditional content): if `state = CA`, include CA wildfire disclosure block
- Rule R-102 (eligibility): suppress renewal if `policy_status ≠ ACTIVE`
- Rule R-103 (calculation): `new_premium = base × (1 + rate_change)`, formatted per locale
- Simulation: run R-103 v2 against last month's 80k renewals → report shows 1,204 documents change → compliance signs off → promote

## Legacy Platform Mapping

| Concept | Exstream | Inspire | SmartCOMM |
|---|---|---|---|
| Rules | Embedded in design/logic objects | Embedded workflow logic | Business logic layer |
| Decoupled rules engine | implied only | implied only | implied only |
| What-if simulation | not offered | partial | partial |

Incumbents bury rules inside templates; decoupling + simulation is the NextGen-CCM story.

## Consultant Exercises

1. Build R-101–R-103 from the worked example and attach them to a renewal template.
2. Change R-103's formula, simulate against a 5k-record historical payload, and interpret the change report.
3. Take one intentionally over-complex rule and rebuild it as a script (Module 13); document why the visual form was inadequate.

## Knowledge Check

1. What does "decoupled from the layout engine" buy the client operationally?
2. What must you always do before promoting a rule change, and which FR provides it?
3. Give two signals that logic belongs in scripting rather than rules.
