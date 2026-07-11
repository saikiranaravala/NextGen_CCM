# Module 01 — Platform Overview & Architecture

**PRD coverage:** §1 (Vision & Differentiation), §2 (Personas), §5 (System Boundary & APIs)
**Prerequisites:** None. Start here.

---

## Learning Objectives

After this module you can:
- Explain NextGen-CCM's three-way decoupled architecture and why it differs from legacy monoliths
- Identify which persona a client stakeholder maps to and what they care about
- Trace a communication end-to-end from API trigger to delivery confirmation
- Position NextGen-CCM against OpenText Exstream, Quadient Inspire, and SmartCOMM using the parity matrix (PRD §1.3)

## Core Concepts

### 1. The Three Decoupled Planes

Legacy CCM platforms bundle everything into one engine. NextGen-CCM splits the pipeline into independently scalable microservices:

```
Data Extraction  →  Document Composition  →  Delivery Orchestration
(ingest & lookup)   (UDM → PDF/AFP/email…)   (channels, failover, tracking)
```

- **Design Studio** — where templates, layouts, rules, and scripts are authored (Modules 02, 08, 13)
- **Composition Engine** — Rust/Go rendering core compiling the Unified Document Model to any output (Modules 04, 05)
- **Orchestration Hub** — channel routing, failover, idempotency, track-and-trace (Modules 03, 06)

### 2. The Unified Document Model (UDM) — FR-1.2

The single most important concept on the platform. A template plus an input JSON payload compiles into one intermediate object (the UDM), which every output driver renders: fixed-layout print (AFP/PDF) and fluid digital (responsive email, WhatsApp). Consultants design **once against the UDM**, not per channel.

### 3. Engine Profiles

Three execution profiles share the same composition core (detail in Module 04):
- **Batch** — millions of records from driver files, 50k pages/min/cluster
- **On-Demand** — synchronous API rendering, P99 ≤ 300 ms
- **Interactive** — human-in-the-loop editing before dispatch

### 4. Personas (PRD §2) — who you'll meet at the client

| Persona | Cares about | Your talking points |
|---|---|---|
| Developer / IT Architect | APIs, gRPC latency, stateless scaling | REST+gRPC+Kafka boundary, idempotency engine, connector SDK |
| Template Designer / Business Analyst | Web designer, versioning, testing | HTML5 designer, git-like versioning, proofing studio |
| Compliance & Risk Officer | Audit, archives, locked content | Integrity ledger, PDF/A archiving, content locking, approval workflows |

### 5. System Boundary (PRD §5)

Client systems talk to the platform over **REST / gRPC / Kafka**. Outbound, the platform talks to print providers, digital aggregators (SMS/Email/WhatsApp), and enterprise storage. Everything else — composition, rules, scripting — is internal.

## Legacy Platform Mapping

| Concept | Exstream | Inspire | SmartCOMM | NextGen-CCM |
|---|---|---|---|---|
| Design environment | Designer (thick client) / HTML5 Designer | Inspire Designer / Evolve | Template designer | Web Design Studio (browser-only) |
| Composition engine | Exstream Engine | Inspire Scaler/Generate | Generate service | Composition Engine (Rust/Go) |
| Interactive editing | Empower Editor | Interact | Draft | Interactive profile + Content Author Studio |
| Deployment | On-prem / OpenShift cloud | On-prem / hybrid / cloud | Multi-tenant SaaS | SaaS, hybrid, on-prem, vendor-neutral K8s |

## Consultant Exercises

1. Read PRD §1.3 and pick the three rows marked "differentiator." Prepare a 2-minute pitch for each aimed at a client currently on Exstream.
2. Given the sample API call in PRD §5.2, sketch the full lifecycle of that invoice communication through the three planes, naming the FR responsible at each step.
3. A client's compliance officer asks: "How do I prove exactly what was sent to customer X two years ago?" Identify the three FRs that jointly answer this (hint: §3.5, §3.6).

## Knowledge Check

1. What are the three decoupled planes, and why does decoupling matter for scaling?
2. What is the UDM and which FR defines it?
3. What latency SLA does the on-demand engine commit to, and where is it stated?
4. Which transport protocols does the enterprise client boundary support?
5. Name two capabilities NextGen-CCM offers that none of the three incumbents document.
