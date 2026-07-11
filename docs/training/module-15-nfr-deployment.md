# Module 15 — Non-Functional Requirements: Performance, Security, HA & Deployment

**PRD coverage:** §4 (4.1–4.4)
**Prerequisites:** Module 01. Essential for Solution Architects.

---

## Learning Objectives

After this module you can:
- Quote and defend the platform's performance, availability, and recovery commitments
- Match a deployment model to a client's regulatory and infrastructure constraints
- Answer security-questionnaire items (isolation, encryption, certifications, localization)

## Core Concepts

### §4.1 Performance & Scalability
| Commitment | Value |
|---|---|
| Batch throughput | ≥ 50,000 pages/min per processing cluster |
| On-demand latency | P99 ≤ 300 ms |
| Elastic load | > 10,000 req/s on stateless workers |
| Pod scale-up (KPI) | < 20 s trigger-to-ready (KEDA) |

**Sizing conversations start from the client's numbers,** then map to clusters: (records × pages) ÷ print window → pages/min → cluster count.

### §4.2 Security & Compliance
- **Isolation:** multi-tenant logical isolation via database row-level security (RLS)
- **Certifications:** SOC 2 Type II, HIPAA, GDPR targets
- **Encryption:** AES-256 at rest, TLS 1.3 in transit
- **I18n/L10n:** native RTL rendering (Arabic, Hebrew) in designer *and* composition engine; multi-language, multi-jurisdiction content governance

**Questionnaire tip:** RLS answers "how is my data separated from other tenants?" — pair it with the Tenant Pipeline Separation KPI (0 incidents, PRD §6).

### §4.3 High Availability & Fault Tolerance
- Uptime target: **99.99%** annually
- DR: **RPO ≤ 1 min, RTO ≤ 15 min** cross-region

### §4.4 Deployment Flexibility
| Model | When to recommend |
|---|---|
| **Multi-tenant SaaS** (primary) | Default; fastest onboarding, continuous delivery |
| **Hybrid** | Data-residency constraints on storage, cloud composition acceptable |
| **On-prem / air-gapped** | Regulated clients who cannot adopt SaaS (defense, certain banking regulators) |
| **Vendor-neutral Kubernetes** | Always — EKS/AKS/GKE/self-managed; no OpenShift lock-in (contrast with OpenText) |
| **Blue-green releases + active-active DR** | Standard in SaaS; design explicitly in self-managed deployments |

## Objection-Handling Quick Reference

| Client says | You answer with |
|---|---|
| "We're HIPAA — can't do multi-tenant" | RLS isolation + HIPAA target + hybrid/on-prem fallback (§4.2, §4.4) |
| "Our regulator demands in-country data" | Hybrid model: in-country storage, documented data flows |
| "What happens in a region outage?" | Active-active, RPO ≤ 1 min / RTO ≤ 15 min (§4.3) |
| "We're an Azure shop / an AWS shop" | Vendor-neutral K8s — same platform on AKS or EKS (§4.4) |
| "Upgrades broke our legacy CCM every year" | Blue-green zero-downtime releases (§4.4) |

## Consultant Exercises

1. Size a cluster: client prints 4M statements (avg 3 pages) in a 6-hour nightly window. Show your arithmetic and stated headroom.
2. Complete a sample security questionnaire (instructor-provided, 20 items) using only PRD §4 and §6 — flag any item the PRD cannot answer as a gap to escalate.
3. Recommend and justify a deployment model for: (a) a US health payer, (b) a Gulf-region bank with data-residency law, (c) a fintech startup.

## Knowledge Check

1. State the four §4.1 performance commitments from memory.
2. What mechanism enforces tenant data isolation?
3. What are the RPO/RTO commitments?
4. Why is "vanilla Kubernetes" a selling point against OpenText specifically?
