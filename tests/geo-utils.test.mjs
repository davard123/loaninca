import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import { DatabaseSync } from 'node:sqlite';
import {
  aiSourceFromUtm, classifyAiReferrer, classifyBot, classifyRequest, isAiBot, isTrackablePath,
  loadGeoReportData, recordHit, trackGeoHit,
} from '../functions/api/geo-utils.mjs';
import { onRequest } from '../functions/_middleware.js';

// 全部离线：不联网、不碰线上数据库。D1 用 Node 自带的内存 SQLite 模拟。
const ROOT = path.dirname(fileURLToPath(import.meta.url));

// 各家官方文档里的 UA 原文（2026-11 核对）
const UAS = {
  'GPTBot': 'Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko); compatible; GPTBot/1.4; +https://openai.com/gptbot',
  'OAI-SearchBot': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36; compatible; OAI-SearchBot/1.4; +https://openai.com/searchbot',
  'ChatGPT-User': 'Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko); compatible; ChatGPT-User/1.0; +https://openai.com/bot',
  'PerplexityBot': 'Mozilla/5.0 (compatible; PerplexityBot/1.0; +https://perplexity.ai/perplexitybot)',
  'Perplexity-User': 'Mozilla/5.0 (compatible; Perplexity-User/1.0; +https://perplexity.ai/perplexity-user)',
  'ClaudeBot': 'Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; ClaudeBot/1.0; +claudebot@anthropic.com)',
  'Claude-User': 'Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; Claude-User/1.0; +Claude-User@anthropic.com)',
  'Claude-SearchBot': 'Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; Claude-SearchBot/1.0; +Claude-SearchBot@anthropic.com)',
  'Googlebot': 'Mozilla/5.0 (Linux; Android 6.0.1; Nexus 5X Build/MMB29P) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Mobile Safari/537.36 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
  'GoogleOther': 'Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; GoogleOther) Chrome/131.0.0.0 Safari/537.36',
  'Google-CloudVertexBot': 'Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; Google-CloudVertexBot; +https://cloud.google.com/enterprise-search) Chrome/131.0.0.0 Safari/537.36',
  'Google-Agent': 'Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; Google-Agent; +https://developers.google.com/crawling/docs/crawlers-fetchers/google-agent) Chrome/131.0.0.0 Safari/537.36',
  'Bingbot': 'Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm) Chrome/116.0.1938.76 Safari/537.36',
  'Bytespider': 'Mozilla/5.0 (Linux; Android 5.0) AppleWebKit/537.36 (KHTML, like Gecko) Mobile Safari/537.36 (compatible; Bytespider; spider-feedback@bytedance.com)',
  'Meta-ExternalAgent': 'meta-externalagent/1.1 (+https://developers.facebook.com/docs/sharing/webmasters/crawler)',
  'Applebot': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Safari/605.1.15 (Applebot/0.1; +http://www.apple.com/go/applebot)',
  'Amazonbot': 'Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; Amazonbot/0.1; +https://developer.amazon.com/support/amazonbot) Chrome/119.0.6045.214 Safari/537.36',
  'DuckAssistBot': 'DuckAssistBot/1.2; (+http://duckduckgo.com/duckassistbot.html)',
  'CCBot': 'CCBot/2.0 (https://commoncrawl.org/faq/)',
};
const CHROME = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';

test('classifyBot names every documented crawler from its real UA string', () => {
  for (const [name, ua] of Object.entries(UAS)) assert.equal(classifyBot(ua)?.name, name, name);
});

test('classifyBot leaves ordinary browsers and empty values alone', () => {
  for (const ua of [CHROME, '', null, undefined, 'curl/8.4.0', 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 Safari/604.1']) {
    assert.equal(classifyBot(ua), null);
  }
});

test('AI crawlers and classic search crawlers are told apart', () => {
  for (const name of ['GPTBot', 'OAI-SearchBot', 'ChatGPT-User', 'PerplexityBot', 'Perplexity-User', 'ClaudeBot', 'Claude-User', 'Claude-SearchBot', 'Bytespider']) assert.equal(isAiBot(name), true, name);
  for (const name of ['Googlebot', 'Bingbot', 'GoogleOther', 'SomethingUnknown']) assert.equal(isAiBot(name), false, name);
  assert.equal(classifyBot(UAS['ChatGPT-User']).kind, 'ai_user');
});

test('classifyAiReferrer recognises AI product domains and utm_source', () => {
  const cases = [
    ['https://chatgpt.com/', '', 'ChatGPT'], ['https://chat.openai.com/c/abc', '', 'ChatGPT'],
    ['https://www.perplexity.ai/search/x', '', 'Perplexity'], ['https://gemini.google.com/app', '', 'Gemini'],
    ['https://copilot.microsoft.com/', '', 'Copilot'], ['https://claude.ai/chat/1', '', 'Claude'],
    ['', '?utm_source=chatgpt.com', 'ChatGPT'], ['', '?a=1&utm_source=perplexity', 'Perplexity'],
    ['https://www.doubao.com/chat/', '', '豆包'],
  ];
  for (const [referer, search, expected] of cases) assert.equal(classifyAiReferrer(referer, search)?.source, expected, referer + search);
  for (const [referer, search] of [
    ['https://www.google.com/', ''], ['https://www.bing.com/search?q=x', ''], ['', ''], ['not a url', '?utm_source=xiaohongshu'],
    ['https://notchatgpt.com/', ''], ['https://www.loaninca.com/blog/a', ''], ['', '?utm_source=%E0%A4%A'],
  ]) assert.equal(classifyAiReferrer(referer, search), null, referer + search);
  assert.equal(aiSourceFromUtm('claudette'), null);
});

test('isTrackablePath keeps pages and the crawler text files, skips assets and API', () => {
  for (const p of ['/', '/blog/fha-loan-i797-no-ead', '/blog/x.html', '/mortgage/dscr/', '/robots.txt', '/llms.txt', '/sitemap.xml', '/loan-finder']) assert.equal(isTrackablePath(p), true, p);
  for (const p of ['/assets/site-v2.js', '/assets/x.css', '/favicon.ico', '/images/a.png', '/api/leads', '/api/geo-report', '/admin.html', '/rate-card/', '/BingSiteAuth.xml', '/x.txt', '/' + 'a'.repeat(300), '', null]) assert.equal(isTrackablePath(p), false, String(p));
});

test('classifyRequest: bots, AI referrals, and everything it must ignore', () => {
  const base = { method: 'GET', pathname: '/blog/a', search: '', userAgent: CHROME, referer: '' };
  assert.deepEqual(classifyRequest({ ...base, userAgent: UAS.GPTBot }), { kind: 'bot', source: 'GPTBot', path: '/blog/a' });
  assert.deepEqual(classifyRequest({ ...base, referer: 'https://chatgpt.com/' }), { kind: 'ai_ref', source: 'ChatGPT', path: '/blog/a' });
  assert.equal(classifyRequest(base), null);                                                    // 普通访客：不记
  assert.equal(classifyRequest({ ...base, referer: 'https://www.google.com/' }), null);         // 搜索来的：不记
  assert.equal(classifyRequest({ ...base, method: 'POST', userAgent: UAS.GPTBot }), null);
  assert.equal(classifyRequest({ ...base, pathname: '/assets/a.css', userAgent: UAS.GPTBot }), null);
  assert.equal(classifyRequest({ ...base, referer: 'https://chatgpt.com/', secFetchDest: 'image' }), null);
  assert.equal(classifyRequest({ ...base, referer: 'https://chatgpt.com/', purpose: 'prefetch' }), null);
  assert.equal(classifyRequest({ ...base, pathname: '/robots.txt', referer: 'https://chatgpt.com/' }), null);
  // 网址参数和 UA 原文都不会进记录
  const hit = classifyRequest({ ...base, search: '?utm_source=chatgpt.com&phone=6265551234' });
  assert.deepEqual(Object.keys(hit), ['kind', 'source', 'path']);
  assert.equal(JSON.stringify(hit).includes('6265551234'), false);
});

// ---- 用内存 SQLite 冒充 D1，执行仓库里真正的建表 SQL ----
function fakeD1() {
  const sqlite = new DatabaseSync(':memory:');
  sqlite.exec(fs.readFileSync(path.join(ROOT, '..', 'sql', '2026-11-11-geo-hits.sql'), 'utf8'));
  sqlite.exec(`CREATE TABLE calculator_analytics (id TEXT PRIMARY KEY, calculator_type TEXT, input_data TEXT, result_data TEXT, session_id TEXT, utm_source TEXT, utm_medium TEXT, utm_campaign TEXT, created_at DATETIME);
    CREATE TABLE leads (id TEXT PRIMARY KEY, name TEXT, phone TEXT, email TEXT, inquiry_type TEXT, loan_amount TEXT, note TEXT, source_url TEXT, utm_source TEXT, utm_medium TEXT, utm_campaign TEXT, created_at DATETIME);`);
  return {
    sqlite,
    prepare(sql) {
      const statement = sqlite.prepare(sql);
      let params = [];
      const api = {
        bind(...values) { params = values; return api; },
        async run() { statement.run(...params); return { success: true }; },
        async all() { return { results: statement.all(...params) }; },
        async first() { return statement.get(...params) ?? null; },
      };
      return api;
    },
  };
}

test('recordHit: one row per day/page/source/status, hits add up', async () => {
  const db = fakeD1();
  const hit = { kind: 'bot', source: 'GPTBot', path: '/blog/a' };
  assert.equal(await recordHit(db, hit, 200, new Date('2026-11-12T01:00:00Z')), true);
  assert.equal(await recordHit(db, hit, 200, new Date('2026-11-12T09:30:00Z')), true);
  assert.equal(await recordHit(db, hit, 404, new Date('2026-11-12T10:00:00Z')), true);
  assert.equal(await recordHit(db, hit, 200, new Date('2026-11-13T00:00:01Z')), true);
  const rows = db.sqlite.prepare('SELECT day, status, hits, first_seen, last_seen FROM geo_hits ORDER BY day, status').all();
  assert.equal(rows.length, 3);
  assert.deepEqual({ ...rows[0] }, { day: '2026-11-12', status: 200, hits: 2, first_seen: '2026-11-12T01:00:00.000Z', last_seen: '2026-11-12T09:30:00.000Z' });
  const columns = db.sqlite.prepare('PRAGMA table_info(geo_hits)').all().map((c) => c.name);
  assert.deepEqual(columns, ['day', 'path', 'kind', 'source', 'status', 'hits', 'first_seen', 'last_seen']); // 没有 IP、没有 UA
});

test('recordHit swallows every database failure', async () => {
  const broken = { prepare() { throw new Error('D1_ERROR: no such table: geo_hits'); } };
  const rejecting = { prepare: () => ({ bind: () => ({ run: () => Promise.reject(new Error('daily limit exceeded')) }) }) };
  assert.equal(await recordHit(broken, { kind: 'bot', source: 'GPTBot', path: '/' }, 200), false);
  assert.equal(await recordHit(rejecting, { kind: 'bot', source: 'GPTBot', path: '/' }, 200), false);
  assert.equal(await recordHit(null, null, 200), false);
});

function fakeContext({ url = 'https://www.loaninca.com/blog/a', headers = {}, db, method = 'GET', status = 200, env } = {}) {
  const waits = [];
  const page = new Response('<h1>page</h1>', { status, headers: { 'content-type': 'text/html' } });
  return {
    waits, page,
    request: new Request(url, { method, headers }),
    env: env ?? { DB: db, ASSETS: { fetch: async () => new Response('not found page') } },
    waitUntil(promise) { waits.push(promise); },
    next: async () => page,
  };
}

test('middleware: page response is returned untouched and a bot hit is written in the background', async () => {
  const db = fakeD1();
  const ctx = fakeContext({ db, headers: { 'user-agent': UAS['ChatGPT-User'] } });
  const response = await onRequest(ctx);
  assert.equal(response, ctx.page);
  assert.equal(ctx.waits.length, 1);
  await Promise.all(ctx.waits);
  assert.deepEqual({ ...db.sqlite.prepare('SELECT path, kind, source, status, hits FROM geo_hits').get() }, { path: '/blog/a', kind: 'bot', source: 'ChatGPT-User', status: 200, hits: 1 });
});

test('middleware: ordinary visitors and static files never touch the database', async () => {
  let touched = 0;
  const db = { prepare() { touched += 1; throw new Error('should not be called'); } };
  for (const ctx of [
    fakeContext({ db, headers: { 'user-agent': CHROME } }),
    fakeContext({ db, headers: { 'user-agent': CHROME, referer: 'https://www.google.com/' } }),
    fakeContext({ db, url: 'https://www.loaninca.com/assets/site-v2.js', headers: { 'user-agent': UAS.GPTBot } }),
    fakeContext({ db, url: 'https://www.loaninca.com/api/leads', method: 'POST', headers: { 'user-agent': UAS.GPTBot } }),
  ]) {
    assert.equal(await onRequest(ctx), ctx.page);
    assert.equal(ctx.waits.length, 0);
  }
  assert.equal(touched, 0);
});

test('middleware: AI referral is recorded without query string', async () => {
  const db = fakeD1();
  const ctx = fakeContext({ db, url: 'https://www.loaninca.com/blog/a?utm_source=chatgpt.com&x=secret', headers: { 'user-agent': CHROME, 'sec-fetch-dest': 'document' } });
  await onRequest(ctx);
  await Promise.all(ctx.waits);
  const rows = db.sqlite.prepare('SELECT * FROM geo_hits').all();
  assert.equal(rows.length, 1);
  assert.equal(rows[0].source, 'ChatGPT');
  assert.equal(JSON.stringify(rows).includes('secret'), false);
});

test('middleware: tracking failures of any kind never break the page', async () => {
  const bot = { 'user-agent': UAS.GPTBot };
  const cases = [
    fakeContext({ headers: bot, db: { prepare() { throw new Error('boom'); } } }),
    fakeContext({ headers: bot, db: { prepare: () => ({ bind: () => ({ run: () => Promise.reject(new Error('no such table')) }) }) } }),
    fakeContext({ headers: bot, env: {} }),                                   // 没绑定数据库
    Object.assign(fakeContext({ headers: bot, db: fakeD1() }), { waitUntil: undefined }),
    Object.assign(fakeContext({ headers: bot, db: fakeD1() }), { waitUntil() { throw new Error('waitUntil broke'); } }),
  ];
  for (const ctx of cases) {
    const response = await onRequest(ctx);
    assert.equal(response, ctx.page);
    await Promise.all(ctx.waits);
  }
});

test('middleware: GEO_TRACKING=off is a kill switch; blocked repo files still 404 and are not logged', async () => {
  const db = fakeD1();
  const off = fakeContext({ headers: { 'user-agent': UAS.GPTBot }, env: { DB: db, GEO_TRACKING: 'off' } });
  await onRequest(off);
  assert.equal(off.waits.length, 0);
  const blocked = fakeContext({ db, url: 'https://www.loaninca.com/schema.sql', headers: { 'user-agent': UAS.GPTBot } });
  const response = await onRequest(blocked);
  assert.equal(response.status, 404);
  assert.equal(blocked.waits.length, 0);
  assert.equal(db.sqlite.prepare('SELECT COUNT(*) AS n FROM geo_hits').get().n, 0);
});

test('trackGeoHit never throws, even on a nonsense context', () => {
  for (const ctx of [undefined, null, {}, { request: {} }, { request: { url: '::bad::', headers: new Headers() }, env: { DB: {} } }]) {
    assert.doesNotThrow(() => trackGeoHit(ctx, 200));
  }
});

test('loadGeoReportData returns page-level data only, never customer contact details', async () => {
  const db = fakeD1();
  const now = new Date('2026-11-18T16:00:00Z');
  await recordHit(db, { kind: 'bot', source: 'GPTBot', path: '/blog/a' }, 200, new Date('2026-11-17T10:00:00Z'));
  await recordHit(db, { kind: 'bot', source: 'GPTBot', path: '/blog/old' }, 200, new Date('2026-09-01T10:00:00Z'));
  db.sqlite.prepare('INSERT INTO leads (id, name, phone, email, note, inquiry_type, source_url, utm_source, created_at) VALUES (?,?,?,?,?,?,?,?,?)')
    .run('lead-1', 'SECRET NAME', '626-555-0100', 'secret@example.invalid', 'SECRET NOTE', 'loan_finder', 'https://www.loaninca.com/loan-finder', '', '2026-11-17 18:00:00');
  db.sqlite.prepare('INSERT INTO calculator_analytics (id, calculator_type, input_data, session_id, utm_source, created_at) VALUES (?,?,?,?,?,?)')
    .run('a-1', 'lead_submitted', JSON.stringify({ path: '/loan-finder', landing: '/blog/a', ref_host: 'chatgpt.com' }), 'abcdefgh-1234-5678', '', '2026-11-17 18:00:02');
  db.sqlite.prepare('INSERT INTO calculator_analytics (id, calculator_type, input_data, created_at) VALUES (?,?,?,?)').run('a-2', 'lead_started', '{broken json', '2026-11-17 17:59:00');
  db.sqlite.prepare('INSERT INTO calculator_analytics (id, calculator_type, input_data, created_at) VALUES (?,?,?,?)').run('a-3', 'purchase', '{"price":900000}', '2026-11-17 17:00:00');

  const data = await loadGeoReportData(db, 14, now);
  assert.deepEqual(data.errors, []);
  assert.equal(data.hits.length, 1);
  assert.equal(data.tracking_started, '2026-09-01T10:00:00.000Z');
  assert.deepEqual(data.events.map((e) => e.type), ['lead_started', 'lead_submitted']);
  assert.equal(data.events[1].landing, '/blog/a');
  assert.equal(data.events[1].session, 'abcdefgh');
  assert.deepEqual(Object.keys(data.leads[0]), ['id', 'created_at', 'inquiry_type', 'source_url', 'utm_source', 'utm_medium', 'utm_campaign']);
  assert.equal(/SECRET|626-555|example\.invalid|900000/.test(JSON.stringify(data)), false);
});

test('loadGeoReportData reports missing tables instead of throwing', async () => {
  const broken = { prepare(sql) { throw new Error(`no such table (${sql.length})`); } };
  const data = await loadGeoReportData(broken, 7);
  assert.equal(data.errors.length, 3);
  assert.deepEqual([data.hits, data.events, data.leads], [[], [], []]);
});

// ---- 浏览器端：进站页记录（assets/site-v2.js） ----
function runSiteScript({ referrer = '', pathname = '/blog/a', search = '', stored = new Map(), storageBroken = false } = {}) {
  const posts = [];
  const sessionStorage = {
    getItem(key) { if (storageBroken) throw new Error('SecurityError'); return stored.has(key) ? stored.get(key) : null; },
    setItem(key, value) { if (storageBroken) throw new Error('SecurityError'); stored.set(key, String(value)); },
  };
  const document = { referrer, head: { appendChild() {} }, querySelector: () => null, querySelectorAll: () => [], createElement: () => ({}), addEventListener() {}, dispatchEvent() {} };
  const window = { dataLayer: [] };
  const context = vm.createContext({
    window, document, sessionStorage, URL, URLSearchParams, Date, Math, JSON,
    location: { pathname, search, host: 'www.loaninca.com' },
    crypto: { randomUUID: () => 'offline-session' },
    CustomEvent: class { constructor(name, init) { this.name = name; this.detail = init?.detail; } },
    fetch: (url, init) => { posts.push({ url, body: JSON.parse(init.body) }); return Promise.resolve({ ok: true }); },
  });
  new vm.Script(fs.readFileSync(path.join(ROOT, '..', 'assets', 'site-v2.js'), 'utf8')).runInContext(context);
  return { window, stored, posts };
}
const plain = (value) => JSON.parse(JSON.stringify(value));

test('site-v2.js remembers the landing page and referrer domain for the session', () => {
  const stored = new Map();
  runSiteScript({ referrer: 'https://chatgpt.com/c/private-conversation-id', pathname: '/blog/a', search: '?utm_source=chatgpt.com', stored });
  assert.deepEqual(JSON.parse(stored.get('loaninca_first')), { landing: '/blog/a', landing_inferred: 0, ref_host: 'chatgpt.com', utm_source: 'chatgpt.com' });
  assert.equal(stored.get('loaninca_first').includes('private-conversation-id'), false);   // 只留域名

  // 同一个标签页里走到 loan-finder 再提交：进站页仍是第一页
  const later = runSiteScript({ referrer: 'https://www.loaninca.com/blog/a', pathname: '/loan-finder', stored });
  later.window.LoanInCA.track('lead_submitted', { source: 'loan_finder' });
  assert.equal(later.posts.length, 1);
  assert.equal(later.posts[0].url, '/api/analytics');
  assert.deepEqual(plain(later.posts[0].body.input_data), { path: '/loan-finder', landing: '/blog/a', landing_inferred: 0, ref_host: 'chatgpt.com', first_utm_source: 'chatgpt.com' });
  assert.equal(later.posts[0].body.calculator_type, 'lead_submitted');
});

test('site-v2.js infers the landing page when the first page had no script, and survives blocked storage', () => {
  const inferred = runSiteScript({ referrer: 'https://www.loaninca.com/blog/h1b-layoff-mortgage-guide', pathname: '/loan-finder' });
  assert.deepEqual(JSON.parse(inferred.stored.get('loaninca_first')), { landing: '/blog/h1b-layoff-mortgage-guide', landing_inferred: 1, ref_host: '', utm_source: '' });

  const broken = runSiteScript({ storageBroken: true });
  assert.doesNotThrow(() => broken.window.LoanInCA.track('phone_clicked'));
  assert.deepEqual(plain(broken.posts[0].body.input_data), { path: '/blog/a', landing: '', landing_inferred: 0, ref_host: '', first_utm_source: '' });
});
