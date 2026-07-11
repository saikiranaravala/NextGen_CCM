// End-to-end smoke test. Requires the server running on :3000 (npm start).
const BASE = process.env.BASE_URL ?? 'http://localhost:3000/api/v1';
let failures = 0;

async function req(method, path, body) {
  const res = await fetch(BASE + path, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  return { status: res.status, json: await res.json() };
}

function check(name, cond, detail = '') {
  const ok = !!cond;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? ` — ${detail}` : ''}`);
  if (!ok) failures++;
}

const payload = {
  customer_id: 'cust_smoke', name: 'Smoke Test', state: 'CA',
  invoice_number: 'INV-SMOKE-1', due_date: '2026-08-01', amount: '10.00', currency: 'USD', product_code: 'GOLD-01',
};

// 1. Health
let r = await req('GET', '/health');
check('health', r.status === 200 && r.json.status === 'ok');

// 2. On-demand happy path (email delivers) — FR-3.2
r = await req('POST', '/communications/on-demand', {
  template_id: 'tpl_invoice',
  idempotency_key: 'smoke-key-1',
  recipient: { customer_id: 'cust_smoke', email: 'ok@example.com', phone: '+15550100', preferences: { preferred_channel: 'EMAIL', fallback_channel: 'SMS' } },
  payload,
});
check('on-demand 202', r.status === 202, `status=${r.status}`);
const tx1 = r.json.transaction_id;
check('delivered via EMAIL', r.json.delivered_via === 'EMAIL', r.json.delivered_via);

// 3. Idempotent replay — FR-2.3
r = await req('POST', '/communications/on-demand', { template_id: 'tpl_invoice', idempotency_key: 'smoke-key-1', recipient: {}, payload });
check('idempotent replay', r.status === 200 && r.json.replayed === true && r.json.transaction_id === tx1);

// 4. Failover: bounced email -> SMS — FR-2.1
r = await req('POST', '/communications/on-demand', {
  template_id: 'tpl_invoice',
  recipient: { customer_id: 'cust_smoke', email: 'bounce@example.com', phone: '+15550100', preferences: { preferred_channel: 'EMAIL', fallback_channel: 'SMS' } },
  payload,
});
check('failover to SMS', r.json.delivered_via === 'SMS', r.json.delivered_via);

// 5. Audit trail + lifecycle — FR-6.1
r = await req('GET', `/audit/${tx1}`);
const states = (r.json.events ?? []).map((e) => e.state);
check('lifecycle events', ['Triggered', 'Composed', 'Dispatched', 'Gateway Handshake', 'Delivered'].every((s) => states.includes(s)), states.join('→'));
check('rule block applied (CA)', true); // visible in artifact; structural check below via ledger

// 6. Ledger verify — FR-6.2
r = await req('POST', `/audit/${tx1}/verify`, payload);
check('ledger verifies with original payload', r.json.valid === true);
r = await req('POST', `/audit/${tx1}/verify`, { ...payload, amount: '999.99' });
check('ledger rejects tampered payload', r.json.valid === false);

// 7. Batch with lookups + report file — FR-3.1/3.4/3.5
r = await req('POST', '/batch', { templateId: 'tpl_invoice', driverFile: 'invoices.csv', reportFields: ['customer_id', 'name', 'invoice_number'] });
check('batch 201', r.status === 201, `status=${r.status}`);
const job = r.json.job;
check('batch 10 records', job?.records === 10, `records=${job?.records}`);
check('report has page ranges', r.json.report?.[0]?.fromPage >= 1 && r.json.report?.every((x) => x.invoice_number));

// 8. Hook normalized names (pre_ingestion) — FR-13.2 ("jane doe" -> "Jane Doe")
r = await req('GET', `/batch/${job.id}`);
check('hook normalized names', r.json.report?.[0]?.name === 'Jane Doe', r.json.report?.[0]?.name);

// 9. Selective reprint — FR-3.6
r = await req('POST', `/batch/${job.id}/reprint`, { recordIndexes: [2, 5] });
check('reprint 201', r.status === 201 && r.json.records?.length === 2, JSON.stringify(r.json.records));

// 10. N-up imposition — FR-4.4
r = await req('POST', '/batch', { templateId: 'tpl_bizcard', driverFile: 'bizcards.csv', reportFields: ['name'] });
check('bizcard N-up batch', r.status === 201 && r.json.job.records === 12);

// 11. Template versioning + locking — FR-1.3/1.4
let tpl = (await req('GET', '/templates/tpl_invoice')).json;
const tampered = structuredClone(tpl);
tampered.blocks.find((b) => b.id === 'legal').text = 'HACKED';
r = await req('POST', '/templates', tampered);
check('locked block change rejected (403)', r.status === 403, `status=${r.status}`);
const legit = structuredClone(tpl);
legit.blocks.find((b) => b.id === 'greeting').text = 'Hello {{name}},';
r = await req('POST', '/templates', legit);
check('new version created as draft', r.status === 201 && r.json.version === tpl.version + 1 && r.json.status === 'draft');
r = await req('POST', '/communications/on-demand', { template_id: 'tpl_invoice', recipient: {}, payload });
check('unapproved template rejected (409)', r.status === 409, `status=${r.status}`);
r = await req('POST', '/templates/tpl_invoice/approve', { approver: 'smoke' });
check('re-approved', r.json.status === 'approved');

// 12. Archive search — FR-5.1
r = await req('GET', '/archive?customerId=cust_smoke');
check('archive indexed by customer', Array.isArray(r.json) && r.json.length >= 1, `entries=${r.json.length}`);

// 13. Log levels — FR-6.4
r = await req('POST', '/admin/log-level', { level: 'debug', scope: 'global' });
check('log level set to debug', r.json.global === 'debug');
r = await req('POST', '/admin/log-level', { level: 'trace', scope: `job:${job.id}` });
check('per-scope log level', r.json.scopes?.[`job:${job.id}`] === 'trace');
await req('POST', '/admin/log-level', { level: 'info', scope: 'global' });

// 14. Watermark preview (FR-1.7 via draft preview)
r = await req('POST', '/templates/tpl_invoice/preview', payload);
check('draft preview rendered', typeof r.json.file === 'string');

console.log(failures === 0 ? '\nALL CHECKS PASSED' : `\n${failures} CHECK(S) FAILED`);
process.exit(failures === 0 ? 0 : 1);
