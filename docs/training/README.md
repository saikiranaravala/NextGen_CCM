# NextGen-CCM Consultant Training Curriculum

**Product:** NextGen-CCM — AI-native, cloud-first Customer Communication Management platform
**Curriculum basis:** PRD v1.3.0 (`PRD.md`)
**Audience:** Implementation consultants, solution architects, and migration specialists

---

## How to Use This Curriculum

Each module maps to one functional area of the PRD. Modules follow the same structure:

1. **Learning Objectives** — what you can do after completing the module
2. **Core Concepts** — feature-by-feature explanation, keyed to FR codes from the PRD
3. **Legacy Platform Mapping** — the equivalent concept in OpenText Exstream, Quadient Inspire, and SmartCOMM, so you can translate client requirements from their current platform
4. **Consultant Exercises** — hands-on tasks to perform in a training tenant
5. **Knowledge Check** — self-test questions

FR codes (e.g., FR-1.6) always refer to `PRD.md` §3.x. When a client asks "can the product do X?", find the FR — if there is no FR, it is not a committed capability.

---

## Learning Paths

| Role | Required Modules | Recommended Order |
|---|---|---|
| **Implementation Consultant** (template & config work) | 01, 02, 03, 04, 08, 10, 13, 14 | as listed |
| **Solution Architect** | All modules | 01, 15, 11, then remainder |
| **Migration Specialist** (Exstream/Inspire/SmartCOMM conversions) | 01, 02, 04, 05, 09, 10 | 01 → 09 first, then deep-dive |
| **Print Production Consultant** | 01, 02, 04, 05, 06 | as listed |
| **Integration Developer** | 01, 03, 11, 13, 15 | as listed |

---

## Module Index

| # | Module | PRD Coverage |
|---|---|---|
| 01 | [Platform Overview & Architecture](module-01-platform-overview.md) | §1, §2, §5 |
| 02 | [Template Design & Content Authoring](module-02-template-design.md) | §3.1 (FR-1.1–1.9) |
| 03 | [Omnichannel Orchestration & Delivery](module-03-omnichannel-orchestration.md) | §3.2 (FR-2.1–2.3) |
| 04 | [Composition Engines: Batch, On-Demand, Interactive](module-04-composition-engines.md) | §3.3 (FR-3.1–3.6) |
| 05 | [Enterprise Print Production](module-05-print-production.md) | §3.4 (FR-4.1–4.4) |
| 06 | [Archiving, Tracking & Compliance](module-06-archiving-tracking-compliance.md) | §3.5–§3.6 (FR-5.x, FR-6.x) |
| 07 | [AI-Native Intelligence Layer](module-07-ai-intelligence.md) | §3.7 (FR-7.1–7.4) |
| 08 | [Business Rules & Decisioning](module-08-business-rules.md) | §3.8 (FR-8.1–8.2) |
| 09 | [Legacy Migration & Modernization](module-09-legacy-migration.md) | §3.9 (FR-9.1–9.2), FR-7.2 |
| 10 | [Omnichannel Proofing & QA](module-10-proofing-qa.md) | §3.10 (FR-10.1–10.2) |
| 11 | [Connectors & Enterprise Integration](module-11-connectors-integration.md) | §3.11 (FR-11.1–11.2), §5.2 |
| 12 | [Analytics & Operational Intelligence](module-12-analytics.md) | §3.12 (FR-12.1–12.2) |
| 13 | [Scripting & Extensibility Framework](module-13-scripting-extensibility.md) | §3.13 (FR-13.1–13.2) |
| 14 | [Multi-Application Workspace Management](module-14-multi-application-workspaces.md) | §3.14 (FR-14.1–14.2) |
| 15 | [Non-Functional Requirements: Performance, Security, HA & Deployment](module-15-nfr-deployment.md) | §4 |

---

## Glossary (used across all modules)

| Term | Definition |
|---|---|
| **UDM** | Unified Document Model — the intermediate object compiled from template + JSON payload; the single source rendered to every output channel (FR-1.2) |
| **Driver file** | The batch input file (CSV/JSON/XML) whose records drive document generation; one record ≈ one customer communication (FR-3.1) |
| **Reference source** | A secondary lookup store (file, table, API) queried per record using keys from the driver file (FR-3.4) |
| **Report file** | Per-record index file emitted by a batch run, mapping custom input metadata to output locations; basis for selective reprint (FR-3.5, FR-3.6) |
| **Shell** | A governed template wrapper (letterhead, footers, locked regulatory blocks) inside which business authors compose content (FR-1.9) |
| **Application** | A logical workspace within a tenant (e.g., Statements, Letters) with isolated templates, data, scripts, and permissions (FR-14.1) |
| **Imposition / N-up** | Placing multiple logical documents on one physical sheet (e.g., business cards on A4) (FR-4.4) |
| **Lifecycle hook** | A scripted pre/post extension point at a pipeline stage (FR-13.2) |
| **AFP / MO:DCA** | Advanced Function Presentation print stream format used by high-volume production printers (FR-4.1) |
| **TLE** | Tagged Logical Element — AFP structured field carrying index metadata for archiving (FR-5.2) |
| **OMR** | Optical Mark Recognition marks read by mail insertion machines (FR-4.3) |
