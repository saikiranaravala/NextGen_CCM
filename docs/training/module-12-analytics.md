# Module 12 — Analytics & Operational Intelligence

**PRD coverage:** §3.12 (FR-12.1, FR-12.2)
**Prerequisites:** Modules 03, 06

---

## Learning Objectives

After this module you can:
- Configure operational dashboards for IT and business stakeholders
- Embed BI panels into journey maps
- Tie dashboard metrics back to the platform KPIs in PRD §6

## Core Concepts

### FR-12.1 Real-Time Operational Dashboards
Live throughput, delivery-status, and SLA-compliance views built on the track-and-trace stream (FR-6.1) and event ingestion pipeline (FR-6.3). Two audiences, two dashboards:
- **IT/Ops:** node throughput, queue depth, error rates, scaling events, log-level state (FR-6.4)
- **Business:** delivery/read rates per journey, channel failover frequency, cycle completion vs. print-window deadline

### FR-12.2 Embeddable Business Intelligence
Iframe/SDK-embeddable BI panels (Power BI/Looker-style) attachable directly to the journey/workflow map (FR-2.1) — a journey owner sees conversion and delivery analytics *on the journey diagram*, matching and extending Quadient's Power BI journey-map embed.

## Metrics That Matter (map to PRD §6 KPIs)

| Dashboard metric | PRD KPI target |
|---|---|
| Composition time per page | < 10 ms |
| Pod scale-up time | < 20 s |
| Internal message loss | 0.00% |
| Cross-tenant interference | 0 incidents |
| AI content acceptance | ≥ 70% |
| Migration first-pass accuracy | ≥ 85% |

**Engagement tip:** wire these six onto a "platform health" dashboard in week one of any implementation — they are the contractual/PRD numbers the client will hold you to.

## Legacy Platform Mapping

| Concept | Exstream | Inspire | SmartCOMM |
|---|---|---|---|
| Ops dashboards | Job monitoring dashboards | Journey analytics | Reporting |
| BI embed on journeys | not offered | Power BI embed | not offered |

## Consultant Exercises

1. Build the IT/Ops dashboard for a training tenant; induce a failing batch and verify error-rate and queue-depth panels react.
2. Attach a BI panel to the Module 03 exercise journey showing read-rate per channel and failover frequency.
3. Recreate the six-KPI "platform health" dashboard and present it as you would in a client steering meeting.

## Knowledge Check

1. Which two FRs supply the data that dashboards visualize?
2. Where can BI panels be embedded, and why is journey-map placement valuable?
3. Name four PRD §6 KPI targets from memory.
