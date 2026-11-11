import test from 'node:test';
import assert from 'node:assert/strict';
import { assertReadOnly, createWranglerDb, inlineParams, parseWranglerOutput, sqlLiteral } from '../scripts/lib/d1-cli.mjs';
import { fetchDataFromD1 } from '../scripts/weekly-geo-report.mjs';
import { buildReport } from '../scripts/lib/geo-report.mjs';

// 全部离线：wrangler 调用被换成假的 run，不碰线上库。
const ok = (results) => JSON.stringify([{ results, success: true, meta: { changes: 0 } }]);
const now = new Date('2026-11-18T16:00:00Z');

function fakeRun(tables = {}) {
  const calls = [];
  const run = async (database, sql) => {
    calls.push({ database, sql });
    if (/FROM geo_hits WHERE/.test(sql)) return ok(tables.hits ?? []);
    if (/MIN\(first_seen\)/.test(sql)) return ok([{ first_seen: tables.first ?? null }]);
    if (/FROM calculator_analytics/.test(sql)) return ok(tables.events ?? []);
    if (/FROM leads/.test(sql)) return ok(tables.leads ?? []);
    throw new Error(`unexpected sql ${sql}`);
  };
  return { run, calls };
}

test('sqlLiteral and inlineParams escape values and keep quoted text intact', () => {
  assert.equal(sqlLiteral("it's"), "'it''s'");
  assert.equal(sqlLiteral(3), '3');
  assert.equal(sqlLiteral(null), 'NULL');
  assert.equal(inlineParams("SELECT '?' AS q, a FROM t WHERE b >= ? AND c IN (?,?)", ['x', 'y', "z'"]),
    "SELECT '?' AS q, a FROM t WHERE b >= 'x' AND c IN ('y','z''')");
  assert.throws(() => inlineParams('SELECT ? , ?', ['a']));
  assert.throws(() => inlineParams('SELECT ?', ['a', 'b']));
});

test('assertReadOnly only lets a single SELECT through', () => {
  assert.doesNotThrow(() => assertReadOnly('SELECT created_at, updated_by FROM leads'));
  assert.doesNotThrow(() => assertReadOnly("SELECT a FROM t WHERE b = 'drop; delete'"));
  for (const bad of [
    'DELETE FROM leads', 'UPDATE leads SET x = 1', 'INSERT INTO geo_hits VALUES (1)', 'DROP TABLE leads',
    'SELECT 1; DELETE FROM leads', 'SELECT 1 -- x', 'PRAGMA table_info(leads)',
    'WITH x AS (SELECT 1) DELETE FROM leads',
  ]) assert.throws(() => assertReadOnly(bad), undefined, bad);
});

test('parseWranglerOutput reads results and turns wrangler errors into a readable message', () => {
  assert.deepEqual(parseWranglerOutput(`some banner\n${ok([{ a: 1 }])}`), [{ a: 1 }]);
  assert.deepEqual(parseWranglerOutput(ok([])), []);
  const failure = JSON.stringify({ error: { text: 'A request failed.', notes: [{ text: 'no such table: geo_hits' }] } });
  assert.throws(() => parseWranglerOutput(failure), /no such table: geo_hits/);
  assert.throws(() => parseWranglerOutput('not json'), /JSON/);
});

test('the fake D1 binding refuses writes', async () => {
  const { run, calls } = fakeRun();
  const db = createWranglerDb({ run });
  await assert.rejects(db.prepare('UPDATE leads SET x = 1').all(), /SELECT/);
  await assert.rejects(db.prepare('SELECT 1').run(), /只读/);
  await assert.rejects(db.batch([]), /只读/);
  await assert.rejects(db.exec('DELETE FROM leads'), /只读/);
  assert.equal(calls.length, 0);
});

test('fetchDataFromD1 runs the same read-only queries as /api/geo-report and never asks for contact details', async () => {
  const { run, calls } = fakeRun({
    hits: [{ day: '2026-11-17', path: '/', kind: 'ai_search', source: 'OAI-SearchBot', status: 200, hits: 2, first_seen: '2026-11-17 01:00:00', last_seen: '2026-11-17 02:00:00' }],
    first: '2026-11-11 16:00:00',
    events: [{ calculator_type: 'lead_submitted', input_data: '{"path":"/","landing":"/","ref_host":"chatgpt.com"}', session_id: 'abcdefghijkl', utm_source: '', created_at: '2026-11-17 03:00:00' }],
    leads: [{ id: 'L1', created_at: '2026-11-17 03:00:00', inquiry_type: 'purchase', source_url: 'https://www.loaninca.com/', utm_source: 'chatgpt.com', utm_medium: '', utm_campaign: '' }],
  });
  const data = await fetchDataFromD1({ days: 15, now, run });

  assert.equal(calls.length, 4);
  for (const { database, sql } of calls) {
    assert.equal(database, 'ndf-lending-db');
    assert.match(sql, /^SELECT\b/);
    assert.doesNotMatch(sql, /\?/);
    assert.doesNotMatch(sql, /\b(name|phone|email|notes|message|first_name|last_name)\b/i);
  }
  assert.match(calls[0].sql, /WHERE day >= '2026-11-03'/);
  assert.match(calls[2].sql, /created_at >= '2026-11-03 16:00:00' AND calculator_type IN \('lead_submitted',/);
  assert.match(calls[3].sql, /^SELECT id, created_at, inquiry_type, source_url, utm_source, utm_medium, utm_campaign FROM leads/);

  assert.deepEqual(Object.keys(data).sort(), ['days', 'errors', 'events', 'generated_at', 'hits', 'leads', 'since', 'tracking_started']);
  assert.equal(data.days, 15);
  assert.equal(data.tracking_started, '2026-11-11 16:00:00');
  assert.equal(data.hits.length, 1);
  assert.equal(data.events[0].session, 'abcdefgh');
  assert.equal(data.events[0].ref_host, 'chatgpt.com');
  assert.deepEqual(Object.keys(data.leads[0]).sort(), ['created_at', 'id', 'inquiry_type', 'source_url', 'utm_campaign', 'utm_medium', 'utm_source']);
  assert.deepEqual(data.errors, []);
});

test('an empty database still produces a report that says there is nothing yet', async () => {
  const { run } = fakeRun();
  const data = await fetchDataFromD1({ days: 15, now, run });
  const { markdown, summary } = buildReport({ data, pages: [], now, days: 7, crawlWindowDays: 14, newPageDays: 60 });
  assert.equal(summary.aiCrawlHits, 0);
  assert.equal(summary.leads, 0);
  assert.match(markdown, /本期没有记录/);
});

test('fetchDataFromD1 fails loudly when none of the tables can be read', async () => {
  const run = async () => JSON.stringify({ error: { text: 'Authentication error' } });
  await assert.rejects(fetchDataFromD1({ days: 15, now, run }), /wrangler 没登录/);
  // 只缺一张表时照常出报表，并把原因记在 errors 里
  const partial = async (database, sql) => (/FROM leads/.test(sql) ? JSON.stringify({ error: { text: 'x', notes: [{ text: 'no such table: leads' }] } }) : ok([]));
  const data = await fetchDataFromD1({ days: 15, now, run: partial });
  assert.deepEqual(data.errors, ['leads: no such table: leads']);
});
