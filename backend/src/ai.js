// FR-7.1 Generative Content Authoring + FR-7.4 Conversational Template Editing.
// Provider: OpenAI-compatible gateway (OpenRouter). Settings from config.xml <ai>;
// the API key comes from backend/.env (OPENROUTER_API_KEY) — see src/config.js.
import { config } from './config.js';
import { collection } from './store.js';
import { logger } from './logger.js';

const MODEL = config.ai.model;

function requireKey() {
  if (!config.ai.apiKey) {
    throw Object.assign(
      new Error('OPENROUTER_API_KEY is not set in backend/.env — copy .env.example to .env and add your key to enable AI features.'),
      { status: 503 }
    );
  }
}

async function chat(messages, { maxTokens = config.ai.maxTokens, json = false } = {}) {
  requireKey();
  const res = await fetch(config.ai.baseUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${config.ai.apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'http://localhost:3000',
      'X-Title': 'NextGen-CCM',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: maxTokens,
      messages,
      ...(json ? { response_format: { type: 'json_object' } } : {}),
    }),
  });
  if (!res.ok) {
    const body = await res.text();
    logger.error(`OpenRouter ${res.status}: ${body.slice(0, 300)}`);
    throw Object.assign(new Error(`AI provider error (${res.status}). Check OPENROUTER_API_KEY / OPENROUTER_MODEL.`), { status: 502 });
  }
  const data = await res.json();
  const text = data.choices?.[0]?.message?.content ?? '';
  logger.debug(`ai call ok: model=${data.model ?? MODEL} tokens=${data.usage?.total_tokens ?? '?'}`);
  return text;
}

// Some models wrap JSON in markdown fences despite response_format — strip defensively.
function parseJsonLoose(text) {
  const cleaned = text.trim().replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '');
  return JSON.parse(cleaned);
}

// FR-7.1 — draft letter body grounded exclusively in the approved paragraph library.
export async function draftLetter({ intent, customerName, applicationId = 'app_letters' }) {
  const approved = collection('paragraphs').filter(
    (p) => p.applicationId === applicationId || p.applicationId === '*'
  );
  if (!approved.length) throw Object.assign(new Error('No approved paragraphs for this application'), { status: 400 });

  const text = await chat([
    {
      role: 'system',
      content: `You draft customer correspondence for a regulated enterprise (banking/insurance/healthcare).
STRICT GROUNDING RULE: compose the letter body ONLY from the approved paragraphs below, lightly adapted for grammar and flow. Never invent commitments, amounts, legal claims, dates, or policy statements that are not present in the approved library. Do not add a salutation or sign-off (the template shell provides them). Return only the letter body text.

APPROVED PARAGRAPH LIBRARY:
${approved.map((p) => `[${p.id}] ${p.title}: ${p.text}`).join('\n')}`,
    },
    { role: 'user', content: `Draft the body of a letter to ${customerName}. Agent's intent: ${intent}` },
  ]);

  return { draft: text.trim(), groundedIn: approved.map((p) => p.id), model: MODEL };
}

// FR-7.4 — natural-language instruction -> structured block edits for a template.
// Locked blocks (FR-1.3) are excluded from what the model may touch, and re-checked by the caller.
export async function conversationalEdit(template, instruction) {
  const text = await chat(
    [
      {
        role: 'system',
        content: `You edit document templates for a CCM platform. Given a template (JSON) and a user instruction, return ONLY a JSON object:
{
  "summary": "<one sentence describing the change>",
  "edits": [
    {
      "blockId": "<id of an existing block>",
      "action": "update_text" | "update_style" | "move" | "remove",
      "text": "<new text, for update_text>",
      "style": { "bold": true|false, "fontSize": <number>, "color": "<hex>" },
      "moveAfterBlockId": "<block id to place this block after, for move>"
    }
  ]
}
Rules: never edit, move, or remove blocks where "locked": true — if the instruction requires it, return an empty edits array and explain in summary. Keep {{placeholders}} intact unless asked to change them. Only reference existing block ids.`,
      },
      {
        role: 'user',
        content: `Template:\n${JSON.stringify(template, null, 2)}\n\nInstruction: "${instruction}"`,
      },
    ],
    { json: true, maxTokens: 4096 }
  );
  const parsed = parseJsonLoose(text);
  if (!Array.isArray(parsed.edits)) throw Object.assign(new Error('AI returned malformed edits'), { status: 502 });
  return { summary: parsed.summary ?? '', edits: parsed.edits, model: MODEL };
}

// Apply AI edits to a template object, enforcing FR-1.3 locking server-side (never trust the model).
export function applyEdits(template, edits) {
  const tpl = structuredClone(template);
  const skipped = [];
  for (const edit of edits) {
    const idx = tpl.blocks.findIndex((b) => b.id === edit.blockId);
    if (idx === -1) { skipped.push({ ...edit, reason: 'unknown block' }); continue; }
    if (tpl.blocks[idx].locked) { skipped.push({ ...edit, reason: 'locked block (FR-1.3)' }); continue; }
    switch (edit.action) {
      case 'update_text':
        tpl.blocks[idx].text = edit.text ?? tpl.blocks[idx].text;
        break;
      case 'update_style':
        tpl.blocks[idx].style = { ...(tpl.blocks[idx].style ?? {}), ...(edit.style ?? {}) };
        break;
      case 'remove':
        tpl.blocks.splice(idx, 1);
        break;
      case 'move': {
        const [block] = tpl.blocks.splice(idx, 1);
        const afterIdx = tpl.blocks.findIndex((b) => b.id === edit.moveAfterBlockId);
        tpl.blocks.splice(afterIdx === -1 ? tpl.blocks.length : afterIdx + 1, 0, block);
        break;
      }
      default:
        skipped.push({ ...edit, reason: `unknown action ${edit.action}` });
    }
  }
  return { template: tpl, skipped };
}
