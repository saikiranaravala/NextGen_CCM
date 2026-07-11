# Module 05 — Enterprise Print Production

**PRD coverage:** §3.4 (FR-4.1 through FR-4.4)
**Prerequisites:** Modules 01, 04

---

## Learning Objectives

After this module you can:
- Explain AFP/MO:DCA output and its role in high-volume production print
- Configure page setup: size, orientation, simplex/duplex, and N-up imposition
- Apply post-processing marks (OMR) and sorting/bundling rules
- Run a competent conversation with a client's print bureau

## Core Concepts

### FR-4.1 AFP (Advanced Function Presentation)
Native MO:DCA driver — page segments, form definitions (FORMDEF), codepage overlays — with **no external transform dependency**. AFP is the lingua franca of high-volume production printers (banks/insurers printing millions of pages). Custom fonts require generated AFP character sets and codepages (FR-1.8). Index tags are injected as TLE fields for archiving (FR-5.2).

### FR-4.2 Standard Industry Formats
PostScript, PCL (office/departmental printers), ZPL (label printers). Choose by the client's device fleet, not preference.

### FR-4.3 Post-Processing Engine
- **OMR barcodes** — marks read by insertion machines to control envelope stuffing (which sheets belong to one envelope, when to pull an insert)
- **Sorting & bundling** — group mail by zip/postal code to qualify for presort postage discounts. **Value story:** postage is usually the client's largest CCM cost; presort savings often fund the whole migration.

### FR-4.4 Page Setup & Imposition Control
Per template or per job:
- **Page type/size:** A4, A5, Letter, Legal, custom dimensions
- **Layout & orientation:** portrait/landscape per page or page group, layouts from FR-1.6
- **Plex:** simplex/duplex, tumble/non-tumble, per document or sheet range
- **Multiplexing / N-up imposition:** multiple logical documents per physical sheet — e.g., 10 business cards on one A4 — with configurable grid, gutters, cut/crop marks, and record ordering

**Record ordering matters:** *stack-cut* ordering places records so that after guillotine cutting, the stacks are already in sequence; *row-major* fills the sheet left-to-right. Ask the print bureau which their finishing line expects — getting this wrong reorders the client's entire mailing.

## Print Bureau Checklist (use on every engagement)

1. Target format? (AFP vs. PS/PCL)
2. Duplex default and tumble convention?
3. OMR spec document from the inserter vendor?
4. Presort rules for the client's postal market?
5. Stock list → map to page types
6. Finishing: cut patterns for any N-up work → stack-cut or row-major?

## Legacy Platform Mapping

| Concept | Exstream | Inspire | SmartCOMM |
|---|---|---|---|
| AFP output | Native | Native | Supported |
| Imposition/N-up | Supported | Supported | Supported |
| OMR/inserter marks | Supported | Supported | Partial |
| Postal presort | Via add-ons | Inspire modules | Partial |

Parity area — the differentiation is doing this **cloud-native with no external transform servers**, not the feature list itself.

## Consultant Exercises

1. Produce the same statement as AFP and PCL; inspect the AFP for FORMDEF and TLE fields.
2. Configure a business-card job: 10-up on A4, 5 mm gutters, crop marks, stack-cut ordering. Verify the cut stacks sequence correctly.
3. Add OMR marks per a sample inserter spec and validate mark positions across a 3-sheet and a 5-sheet document.
4. Configure zip-code bundling and show the presort report to estimate postage savings on a 50k-piece mailing.

## Knowledge Check

1. Why does AFP dominate high-volume print, and what three MO:DCA structures must the driver produce?
2. What breaks if you choose row-major ordering when the finishing line expects stack-cut?
3. Which FR pair connects custom fonts to AFP output?
4. What do OMR marks control physically?
