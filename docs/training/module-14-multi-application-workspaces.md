# Module 14 — Multi-Application Workspace Management

**PRD coverage:** §3.14 (FR-14.1, FR-14.2)
**Prerequisites:** Modules 01, 02

---

## Learning Objectives

After this module you can:
- Partition a tenant into logical applications matching a client's business structure
- Configure per-application environment chains and release cadences
- Plan migrations and permissions along application boundaries

## Core Concepts

### FR-14.1 Application Partitioning
Multiple logical applications per tenant — e.g., *Statements*, *Letters*, *Policy Documents*, *Claims Correspondence* — each with isolated:
- Template portfolio and content
- Reference data sources (FR-3.4) and report-file configurations (FR-3.5)
- Scripting assets and hooks (FR-13.1–13.2)
- Role-based access control

Distinct business units share one platform without stepping on each other. This mirrors Exstream's "applications" concept, so Exstream clients recognize it immediately.

**Partitioning heuristics:**
- Partition by *communication domain + owning team*, not by org chart alone
- Shared brand assets (themes FR-1.6, fonts FR-1.8, regulatory library FR-1.5) stay tenant-level; applications subscribe
- One application = one migration wave (Module 09) = one cutover unit

### FR-14.2 Per-Application Environment Promotion
Each application has its own dev → test/staging → production chain with independent approval gates (FR-1.5) and release cadence. The Statements team's release freeze doesn't block the Claims team's Friday deploy.

## Reference Setup (typical insurer)

```
Tenant: AcmeInsurance
├── shared: brand theme, fonts, regulatory content library
├── App: PolicyDocs      (Underwriting team)   dev → test → prod
├── App: Claims          (Claims ops)          dev → test → prod
├── App: Statements      (Finance)             dev → test → prod
└── App: AdHocLetters    (Content Author users, FR-1.9)  dev → prod
```

Note `AdHocLetters` — a common pattern is a lightweight application housing Content Author shells with a shortened environment chain.

## Legacy Platform Mapping

| Concept | Exstream | Inspire | SmartCOMM |
|---|---|---|---|
| Application partitioning | Applications | partial (workspaces) | partial |
| Independent per-app promotion | partial | partial | partial |

## Consultant Exercises

1. Build the reference setup above in a training tenant, including tenant-level shared assets and one subscribing template per application.
2. Prove isolation: give a Claims analyst role no visibility into Statements; verify reference data and report configs don't leak across apps.
3. Release the Statements app to production while Claims has an unapproved change in test; confirm no interference.
4. For a real client org chart (instructor-provided), propose an application partitioning and defend it against the heuristics.

## Knowledge Check

1. What stays tenant-level vs. application-level, and why?
2. How do applications relate to migration waves?
3. What problem does per-application promotion (FR-14.2) solve that a single shared environment chain cannot?
