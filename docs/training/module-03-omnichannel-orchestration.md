# Module 03 — Omnichannel Orchestration & Delivery

**PRD coverage:** §3.2 (FR-2.1 through FR-2.3)
**Prerequisites:** Module 01

---

## Learning Objectives

After this module you can:
- Design a multi-day, state-driven communication journey with failover channels
- Configure every supported delivery channel and know its constraints
- Explain and configure idempotency so a client never double-sends

## Core Concepts

### FR-2.1 State-Driven Workflows
Journeys are defined on an interactive workflow map as states and transitions, e.g.:

```
Send WhatsApp → Wait 2h → Read? ──yes──> End
                              └──no───> Send SMS → Delivered? ──no──> Print & Mail
```

Journeys can span days, react to gateway events (delivered/read), and always terminate in a tracked outcome. **Design rule:** every branch must end in a terminal state — no dangling paths — or the compliance story breaks.

### FR-2.2 Delivery Channels
| Channel | Notes for consultants |
|---|---|
| **Print** | Production-ready streams; hand-off to print provider (see Module 05) |
| **Email** | Inline-styled MIME, automated attachments |
| **WhatsApp** | Meta Cloud API; requires pre-approved message templates and 24h session rules — plan template approval lead time with the client |
| **SMS** | Twilio/Infobip CPaaS or native SMPP for telco-direct clients |
| **Push** | iOS/Android, rich content (images, buttons, deep links) |
| **Interactive PDF** | Fillable forms for e-sign/self-service flows |
| **Structured exports** | Excel / PowerPoint / XML for back-office consumption |

### FR-2.3 Idempotency Engine
Every job execution is matched against the caller's `idempotency_key` (see PRD §5.2 API sample). A retry with the same key returns the original transaction instead of re-sending. **Implementation tip:** insist the client derives the key from a business fact (e.g., `invoice_id + cycle`), not a random UUID per attempt — otherwise retries create duplicates.

## How a Journey Executes (trace this with clients)

1. Trigger arrives (API call, Kafka event, batch record)
2. Idempotency check (FR-2.3)
3. Composition renders the UDM for the *first* channel
4. Dispatch → gateway handshake → webhook events flow back (FR-6.3)
5. Workflow state machine evaluates transitions (read? delivered? timeout?)
6. On failover, composition re-renders the *same UDM* for the fallback channel — content parity is automatic

## Legacy Platform Mapping

| Concept | Exstream | Inspire | SmartCOMM |
|---|---|---|---|
| Journey design | Communications Orchestration flows | Inspire Journey | Coordinate |
| Channel failover | Limited, custom | Journey rules | Custom logic |
| Idempotency | Custom implementation | Custom implementation | Custom implementation |

Failover-with-content-parity and first-class idempotency are differentiators — legacy platforms require custom code for both.

## Consultant Exercises

1. Build the journey shown above (WhatsApp → SMS → Print) in the workflow map. Verify each branch terminates and each state emits lifecycle events.
2. Fire the PRD §5.2 sample API call twice with the same `idempotency_key`; confirm one delivery and two identical API responses.
3. A bank requires: e-statement by email; if bounced, print within 48h; log everything. Design the journey and list which FRs satisfy each requirement.

## Knowledge Check

1. What guarantees content parity between a primary channel and its failover?
2. Why should idempotency keys be business-derived rather than random?
3. Which channels require pre-approved message templates from the gateway vendor?
4. Where do gateway webhooks enter the platform, and which FR processes them?
