# Module 04 — Composition Engines: Batch, On-Demand, Interactive

**PRD coverage:** §3.3 (FR-3.1 through FR-3.6)
**Prerequisites:** Modules 01, 02

---

## Learning Objectives

After this module you can:
- Choose the right engine profile for a client use case and configure it
- Set up secondary reference data lookups driven by driver-file fields
- Configure production report files and execute a selective reprint
- Explain the batch processing flow well enough to size a client's workload

## Core Concepts

### FR-3.1 Ultra High-Volume Batch Engine
Ingests millions of driver-file records (CSV, JSON, XML), distributes composition across parallel nodes, merges outputs. Target: ≥ 50,000 pages/min per cluster (PRD §4.1). **Sizing conversation:** ask for the client's largest cycle (records × pages/record × cycles/day) and their print-window deadline; that gives you the node count.

### FR-3.2 Low-Latency On-Demand Engine
Synchronous endpoint returning rendered binary in ≤ 300 ms (P99). Used for triggered notifications and portal "download my statement now" flows. Stateless — scales horizontally (PRD §4.1).

### FR-3.3 Interactive Document Customization
Web UI for operational staff (call centers) to fill open fields or toggle optional clauses in structured templates before generation. Contrast with FR-1.9 (Content Author): Interactive is *form-filling inside one document instance*; Content Author is *composing letter content*.

### FR-3.4 Secondary Reference Data Sources
Per-record, key-based lookups at composition time. The key comes from a driver-file field; the source is a lookup file, database table, or REST endpoint.

**Example:** driver record has `product_code=GOLD-01` → lookup fetches the Gold plan's rate table and marketing paragraph → composition injects both. Results are cached per batch run.

**Design rule:** driver file carries *who and what to send*; reference sources carry *shared/slow-changing content*. Don't denormalize reference data into the driver file — that's the legacy anti-pattern migrations should remove.

### FR-3.5 Production Report Files
Every batch emits per-record report/index files (CSV/JSON/XML). Field mapping from input metadata is configurable per application — typical fields: customer ID, account number, document type, page count, sheet range/offset in the print file, channel outcome. Consumers: mailroom systems, archives, reconciliation jobs, and selective reprint.

### FR-3.6 Selective Reprint
Re-generate or extract one customer record (or a range) from a completed batch, addressed by its report-file entry — no full batch rerun. Output is a standalone print-ready file. Reprint events are audit-logged (FR-6.1).

**Classic scenario:** the mailroom damages sheets 4,010–4,025 of a 100k-document run. Ops looks up the affected records in the report file, triggers reprint for exactly those, and re-inserts.

## Batch Flow (memorize this)

```
Driver file → validate → per-record: [reference lookups (FR-3.4)] → compose UDM
  → render (print/digital) → merge outputs → emit report files (FR-3.5)
  → archive (FR-5.1) + tracking events (FR-6.1)
```

## Legacy Platform Mapping

| Concept | Exstream | Inspire | SmartCOMM |
|---|---|---|---|
| Batch engine | Exstream Engine | Scaler | Batch generate |
| Reference lookups | Reference files | Data modules | Integration layer |
| Report files | Report definitions | (partial) | (partial) |
| Selective reprint | Supported | (partial) | not offered |

## Consultant Exercises

1. Run a 10k-record driver file through batch with one file-based lookup and one REST lookup; verify cache hit rates in the job log.
2. Configure a report file mapping five custom fields; validate the sheet offsets against the generated print file.
3. Simulate the damaged-mail scenario: pick 15 records from the report file and produce a reprint file containing only those documents.
4. A client needs statement generation both nightly (2M records) and on-demand in their portal. Which profiles do you deploy, and what is shared between them?

## Knowledge Check

1. What belongs in a driver file vs. a reference source?
2. Which FR makes selective reprint *addressable* — i.e., how does the platform know where record X lives in the output?
3. What is the batch throughput target and where is it defined?
4. How does FR-3.3 differ from FR-1.9?
