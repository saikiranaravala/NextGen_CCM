# Module 07 — AI-Native Intelligence Layer

**PRD coverage:** §3.7 (FR-7.1 through FR-7.4)
**Prerequisites:** Modules 01, 02

---

## Learning Objectives

After this module you can:
- Explain each AI capability and — critically — its grounding guardrails to a compliance-sensitive client
- Set up the approved content library that grounds generative authoring
- Use AI-assisted proofing in a template release cycle
- Position the AI features against Exstream Aviator and Quadient's AI/ML tooling

## Core Concepts

### FR-7.1 Generative Content Authoring
LLM-assisted drafting and rewriting, **grounded exclusively in the approved content/knowledge library** (retrieval-augmented). The model cannot introduce language that isn't traceable to approved sources — this is the answer to "our lawyers will never allow AI." Also powers the polish step in dictation letters (FR-1.9).

**KPI to set expectations:** AI Content Acceptance Rate target ≥ 70% (PRD §6) — i.e., most suggestions accepted or lightly edited.

### FR-7.2 AI Migration Accelerator
Ingests legacy exports — Exstream `.hpt`/DFC packages, Inspire resource files, SmartCOMM bundles — and NLP-parses layout, logic, and data bindings into the UDM. Output is a **human-reviewable diff**, never a blind conversion. Detail in Module 09.

### FR-7.3 AI-Assisted Proofing
On every template version change: automated visual regression detection plus a plain-language summary of what changed (layout, content, bindings). Reviewers read the summary instead of pixel-hunting. Neither Exstream, Inspire, nor SmartCOMM offers this — differentiator.

### FR-7.4 Conversational Template Editing
Natural-language commands in the Web Designer — "make the disclaimer bold and move it above the signature block" — translated into structured UDM edits, fully attributed in version history (FR-1.4). Every AI edit is a normal, revertible, auditable commit.

## The Guardrail Argument (memorize)

Client objection: *"We can't have AI writing customer communications."*
Response structure:
1. Generation is **retrieval-grounded** — only approved library content (FR-7.1)
2. Nothing reaches a customer without the same approval workflows as human content (FR-1.5)
3. Every AI action is versioned and attributed (FR-1.4, FR-7.4)
4. The integrity ledger (FR-6.2) proves what was actually sent

## Legacy Platform Mapping

| Capability | Exstream | Inspire | SmartCOMM |
|---|---|---|---|
| GenAI authoring | Experience/Content Aviator | AI/ML content optimization | not emphasized |
| AI migration | Partial (rule-based tools) | InspireXpress (NLP) | Migration services |
| AI proofing summaries | not offered | not offered | not offered |
| Conversational editing | not offered | not offered | not offered |

## Consultant Exercises

1. Load 20 approved paragraphs into the content library; draft a payment-reminder letter with FR-7.1 and verify each generated sentence traces to a library source.
2. Modify a template's footer and layout; review the FR-7.3 change summary and confirm it names both changes correctly.
3. Perform three edits via conversational commands (FR-7.4); inspect version history for attribution and revert one.
4. Roleplay: a healthcare client's compliance officer challenges AI usage. Deliver the four-point guardrail argument with FR citations.

## Knowledge Check

1. What technically prevents FR-7.1 from hallucinating non-compliant language?
2. Which two AI capabilities have no equivalent in any incumbent?
3. What artifact does the Migration Accelerator produce instead of a converted template alone?
4. How are conversational edits governed?
