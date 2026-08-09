import test from 'node:test';
import assert from 'node:assert/strict';
import { cleanText, escapeHtml, normalizeLead, validateLead } from '../functions/api/lead-utils.mjs';

test('cleanText normalizes whitespace and limits length', () => {
  assert.equal(cleanText('  David\n Dai  ', 20), 'David Dai');
  assert.equal(cleanText('abcdef', 3), 'abc');
});

test('escapeHtml protects email template interpolation', () => {
  assert.equal(escapeHtml('<b>"David" & co.</b>'), '&lt;b&gt;&quot;David&quot; &amp; co.&lt;/b&gt;');
});

test('validateLead accepts a normalized contact submission', () => {
  const result = validateLead({ name: ' David ', email: 'DAVID@example.com', note: ' hello\nworld ' });
  assert.equal(result.ok, true);
  assert.equal(result.spam, false);
  assert.equal(result.lead.email, 'david@example.com');
  assert.equal(result.lead.note, 'hello world');
});

test('validateLead silently accepts honeypot submissions as spam', () => {
  const result = validateLead({ website: 'https://spam.invalid', name: 'Bot', phone: '123' });
  assert.equal(result.ok, true);
  assert.equal(result.spam, true);
});

test('validateLead rejects missing or malformed contact details', () => {
  assert.equal(validateLead({ name: 'David' }).ok, false);
  assert.equal(validateLead({ name: 'David', email: 'not-an-email' }).ok, false);
});

test('normalizeLead removes control characters and truncates fields', () => {
  const result = normalizeLead({ name: 'A\u0000B', utm_source: 'x'.repeat(200) });
  assert.equal(result.name, 'A B');
  assert.equal(result.utm_source.length, 120);
});
