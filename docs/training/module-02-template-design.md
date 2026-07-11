# Module 02 — Template Design & Content Authoring

**PRD coverage:** §3.1 (FR-1.1 through FR-1.9)
**Prerequisites:** Module 01

---

## Learning Objectives

After this module you can:
- Build a multi-channel template in the Web Designer against the UDM
- Set up master layouts, themes, watermarks, and custom fonts for a client brand
- Configure content locking, the shared asset library, and approval routing
- Enable business users to author governed letters (Content Author Studio), including dictation letters

## Core Concepts

### FR-1.1 Web Designer Interface
Browser-based WYSIWYG editor on HTML/CSS standards. No thick client, no local install — the first thing to demo to clients coming from Exstream Designer or Inspire Designer desktop tools.

### FR-1.2 Unified Document Model (UDM)
The compilation target for every template. Design decisions are stored channel-neutral; channel-specific rendering (fixed print vs. fluid email) happens at composition. **Rule of thumb for consultants:** if you find yourself duplicating a template per channel, you are doing it wrong — use one template with channel variants.

### FR-1.3 Content Locking
Mark blocks (legal disclaimers, headers) as *Locked* per user group. Locked blocks are non-editable downstream — including in the Content Author Studio and Interactive profile.

### FR-1.4 Version Control
Git-like: commit history, visual rollback, approvals. Every asset (template, layout, script, rule) is versioned. Production always points at an approved, immutable version.

### FR-1.5 Content Governance & Shared Asset Library
Portfolio-wide library of reusable content blocks, regulatory language, and digital assets. Serial or parallel multi-stage approval chains gate promotion to production. **Implementation tip:** model the client's existing sign-off process (legal → compliance → brand) as an approval chain before building templates; retrofitting governance is painful.

### FR-1.6 Master Layouts & Theming
Define typography, color tokens, spacing, and header/footer structures once; templates subscribe to the theme. A theme change propagates via version control to all subscribing templates. This is how a rebrand becomes a one-day job instead of a six-month program.

### FR-1.7 Optional Watermarks
Text or image watermarks (DRAFT / COPY / CONFIDENTIAL) toggled per template, per environment, or per job run. **Standard practice:** enable a DRAFT watermark automatically in all non-production environments.

### FR-1.8 Custom Font Management
Upload TTF/OTF/WOFF/WOFF2 into a tenant-scoped library with license metadata. The engine auto-embeds and subsets fonts in PDF and generates AFP character sets/codepages for print. Define fallback fonts for digital channels. **Gotcha:** always capture the client's font license terms in the metadata — embedding rights differ from desktop rights.

### FR-1.9 Business Content Author Studio
The Exstream Content Author equivalent — a simplified, word-processor-like surface for business users:
- **Governed shells:** authors type only in designated editable zones; letterhead/footers/regulatory blocks stay locked (FR-1.3), theme inherited (FR-1.6)
- **Approved paragraph library:** insert pre-approved clauses (FR-1.5) with suggestions based on letter type and recipient data
- **Dictation letters:** voice dictation (speech-to-text) or free typing, with AI drafting assistance (FR-7.1) to polish against approved language
- **Governed dispatch:** approval routing when policy requires, then delivery via the standard orchestration engine with track-and-trace — never a side channel

**Positioning:** this is for the claims adjuster or relationship manager writing a one-off customer letter. Full designers use FR-1.1; call-center fill-in uses FR-3.3.

## Legacy Platform Mapping

| Concept | Exstream | Inspire | SmartCOMM |
|---|---|---|---|
| Web design | HTML5 Designer | Evolve Content Author / Flex Designer | Template designer |
| Locked content | Locked objects | Compliance content library | Locked regulatory blocks |
| Shared assets | Design Asset Service | Version-controlled library | Shared content |
| Business authoring | Content Author | Evolve Content Author | (partial) |
| Layout reuse | Design Layouts | Shared styles | Single-template layout variants |

## Consultant Exercises

1. Build an invoice template with one locked legal footer, a themed header from a master layout, and channel variants for PDF and responsive email — from a single UDM template.
2. Configure a two-stage serial approval chain (Compliance → Brand) on the shared asset library and promote a new disclaimer through it.
3. Upload a custom brand font, generate print output, and verify the font is embedded/subsetted in the PDF and mapped to an AFP codepage.
4. Set up a "Complaint Response" shell for the Content Author Studio: two editable zones, five approved paragraphs, dictation enabled, approval required before dispatch.

## Knowledge Check

1. Where do locked blocks (FR-1.3) apply besides the designer itself?
2. What propagates when a master theme (FR-1.6) is updated, and what mechanism controls the rollout?
3. Which three FRs jointly make a dictation letter compliant end-to-end?
4. What print-specific artifacts must the platform generate when a custom font is used in AFP output?
5. When do you recommend FR-1.9 (Content Author) vs. FR-3.3 (Interactive Customization)?
