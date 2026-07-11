# Module 11 — Connectors & Enterprise Integration

**PRD coverage:** §3.11 (FR-11.1, FR-11.2), §5.2 (API contracts)
**Prerequisites:** Modules 01, 03

---

## Learning Objectives

After this module you can:
- Select and configure marketplace connectors for a client's stack
- Scope and build a custom connector on the SDK
- Explain the on-demand API contract, including idempotency semantics

## Core Concepts

### FR-11.1 Pre-Built Integration Marketplace
Certified connectors: Salesforce, SAP, Guidewire (ClaimCenter/PolicyCenter/BillingCenter), Duck Creek, Pega, DocuSign, MuleSoft, OneSpan, core banking platforms. **Scoping rule:** inventory the client's systems first; every marketplace hit is integration effort you don't estimate.

### FR-11.2 Custom Connector Framework & Partner/ISV SDK
For everything not in the marketplace — in-house policy admin, internal CRMs, homegrown cores — enterprises extend the platform's **public API and event contracts** to build their own connectors. Key guarantees:
- Custom connectors get the same delivery, tracking (FR-6.1), and idempotency (FR-2.3) treatment as native channels — no second-class integrations
- Optionally certifiable into the marketplace (FR-11.1) for reuse

### The API Contract (PRD §5.2)

`POST /api/v1/communications/on-demand` essentials:
- `template_id` — versioned template reference
- `idempotency_key` — caller-supplied, business-derived (Module 03)
- `recipient.preferences` — preferred + fallback channel, feeding orchestration
- `payload` — the data composed into the UDM
- Response `202` with `transaction_id` and `audit_trail_url` — hand clients the audit URL pattern early; it answers most support questions

Transports: REST and gRPC for request/response; Kafka for event-driven triggering at volume.

## Custom Connector Design Checklist

1. Direction: inbound trigger, outbound delivery channel, or data/reference source (FR-3.4)?
2. Contract: which platform events does it consume/emit?
3. Idempotency: how does the connector propagate transaction tokens?
4. Failure model: retry policy, dead-letter behavior, timeout budget
5. Tracking: which lifecycle states does it report back (FR-6.1)?
6. Multi-tenancy: tenant scoping of credentials and configuration

## Legacy Platform Mapping

| Concept | Exstream | Inspire | SmartCOMM |
|---|---|---|---|
| Marketplace connectors | SAP, Salesforce, Guidewire, Duck Creek | Salesforce plug-in ecosystem | Salesforce, Pega, DocuSign, MuleSoft, OneSpan |
| Custom connector SDK | Limited | Limited | API suite |
| First-class custom channel guarantees | not offered | not offered | partial |

## Consultant Exercises

1. Configure the Salesforce marketplace connector to trigger a welcome journey from an Opportunity-Closed event.
2. Design (on paper, using the checklist) a custom outbound connector to a fictional in-house "SecureInbox" system, then implement it against the SDK in the training tenant.
3. Demonstrate idempotent behavior through your custom connector: replay the trigger and show a single delivery with two identical responses.

## Knowledge Check

1. What three guarantees do custom connectors inherit from the platform?
2. When do you choose Kafka over REST/gRPC for triggering?
3. What belongs in `recipient.preferences`, and which module's engine consumes it?
