import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildReport, formatPacific, pageFile, pageKey, parseSitemap } from '../scripts/lib/geo-report.mjs';

// 离线：只用 tests/fixtures/geo/sample-data.json 这份假数据。
const ROOT = path.dirname(fileURLToPath(import.meta.url));
const data = JSON.parse(fs.readFileSync(path.join(ROOT, 'fixtures', 'geo', 'sample-data.json'), 'utf8'));
const now = new Date('2026-11-25T16:00:00Z');
const page = (p, published) => ({ path: p, key: pageKey(p), published: published ? new Date(published) : null, publishedFrom: 'git' });
const pages = [
  page('/', '2026-04-01T12:00:00Z'),
  page('/loan-finder', '2026-08-01T12:00:00Z'),
  page('/blog/fha-loan-i797-no-ead', '2026-11-11T15:41:25Z'),
  page('/blog/itin-mortgage-california', '2026-11-11T15:41:25Z'),
  page('/blog/rsu-income-mortgage-california', '2026-11-11T15:41:25Z'),          // 只在 12 天前被抓过一次
  page('/blog/no-credit-score-buy-home-california', '2026-11-11T15:41:25Z'),     // 只有 Googlebot 来过
  page('/blog/opt-income-not-accepted-mortgage', '2026-11-11T15:41:25Z'),        // 谁都没来过
  page('/blog/brand-new-page', '2026-11-20T15:00:00Z'),                          // 上线才 5 天
  page('/mortgage/dscr/', '2026-05-01T12:00:00Z'),
];
const report = buildReport({ data, pages, now, days: 7, crawlWindowDays: 14, newPageDays: 60 });
const section = (title) => {
  const start = report.markdown.indexOf(title);
  assert.notEqual(start, -1, `missing section ${title}`);
  const next = report.markdown.indexOf('\n## ', start + title.length);
  return report.markdown.slice(start, next === -1 ? undefined : next);
};

test('pageKey folds the different spellings of one page together', () => {
  for (const p of ['/blog/a', '/blog/a.html', '/blog/a/', 'https://www.loaninca.com/blog/a?utm_source=x#top']) assert.equal(pageKey(p), '/blog/a');
  assert.equal(pageKey('/'), '/');
  assert.equal(pageKey('/index.html'), '/');
  assert.equal(pageKey('/mortgage/dscr/index.html'), '/mortgage/dscr');
  assert.equal(pageFile('/mortgage/dscr/'), 'mortgage/dscr/index.html');
  assert.equal(pageFile('/blog/a'), 'blog/a.html');
  assert.equal(pageFile('/'), 'index.html');
});

test('parseSitemap reads both the multi-line and the one-line url entries', () => {
  const xml = '<urlset>\n  <url>\n    <loc>https://www.loaninca.com/</loc>\n    <lastmod>2026-05-05</lastmod>\n  </url>\n  <url><loc>https://www.loaninca.com/blog/a</loc><lastmod>2026-11-11</lastmod></url>\n</urlset>';
  assert.deepEqual(parseSitemap(xml), [{ path: '/', key: '/', lastmod: '2026-05-05' }, { path: '/blog/a', key: '/blog/a', lastmod: '2026-11-11' }]);
  const real = parseSitemap(fs.readFileSync(path.join(ROOT, '..', 'sitemap.xml'), 'utf8'));
  assert.ok(real.length > 50);
  assert.ok(real.some((p) => p.key === '/blog/fha-loan-i797-no-ead'));
});

test('formatPacific converts D1 UTC timestamps to California time', () => {
  assert.equal(formatPacific('2026-11-21 23:36:10'), '11-21 15:36');
  assert.equal(formatPacific('2026-11-22T08:00:00.000Z'), '11-22 00:00');
  assert.equal(formatPacific('2026-07-01T07:30:00Z', false), '2026-07-01');
  assert.equal(formatPacific(null), '—');
  assert.equal(formatPacific('garbage'), '—');
});

test('summary numbers cover only the reporting week', () => {
  assert.deepEqual(report.summary, {
    aiCrawlHits: 7,          // GPTBot 2 + ChatGPT-User 3 + PerplexityBot 1 + ClaudeBot(llms.txt) 1；11-12、11-13 的不在本周
    aiCrawlPages: 3,
    searchCrawlHits: 7,      // Googlebot 4 + 1，Bingbot 2
    aiVisits: 3,             // 首页那 5 次在 11-15，不在本周
    leads: 2,
    newPages: 6,
    newPagesNotCrawled: 2,
    coverageDays: 13,
  });
});

test('question 1: per-page crawler counts, per-bot breakdown and last crawl time', () => {
  const text = section('## 1. AI 爬虫抓了哪些页');
  assert.match(text, /\| \/blog\/fha-loan-i797-no-ead \| 5 \| ChatGPT-User 3、GPTBot 2 \| 11-21 14:15 \| Googlebot 4 \|/);
  assert.match(text, /\| \/blog\/itin-mortgage-california \| 1 \| PerplexityBot 1 \| 11-22 03:00 \| Bingbot 2 \|/);
  assert.match(text, /\| \/llms\.txt（不在 sitemap） \| 1 \| ClaudeBot 1 \|/);
  assert.match(text, /\| ChatGPT-User \| OpenAI \| 用户提问时实时读取 \| 3 \| 1 \| 11-21 14:15 \|/);
  assert.match(text, /\| \/blog\/no-such-page \| 404 \| 2 \| GPTBot 2 \|/);
  assert.match(text, /\| \/blog\/fha-loan-i797-no-ead \| 308 \| 1 \| ChatGPT-User 1 \|/);   // .html 旧写法的跳转单列，不算进抓取次数
});

test('question 2: human visits arriving from AI products, by landing page', () => {
  const text = section('## 2. 从 AI 产品点进来的真人访问');
  assert.match(text, /\| \/blog\/fha-loan-i797-no-ead \| 2 \| ChatGPT 2 \| 11-21 15:30 \|/);
  assert.match(text, /\| \/blog\/itin-mortgage-california \| 1 \| Perplexity 1 \|/);
  assert.doesNotMatch(text, /\| \/ \| 5 \|/);
});

test('question 3: each lead gets its landing page, submit page and source', () => {
  const text = section('## 3. 每一条咨询来自哪个页面');
  assert.match(text, /\| 11-21 15:36 \| loan_finder \| \/blog\/fha-loan-i797-no-ead \| \/loan-finder \| chatgpt\.com \| ChatGPT \| chatgpt\.com \|/);
  assert.match(text, /\| 11-24 11:00 \| loan_finder \| 没记到 \| \/loan-finder \| — \| — \| — \|/);
  assert.doesNotMatch(text, /11-12 11:00/);                                   // 上周的咨询不在本周报表里
  assert.match(text, /另有 1 次「表单提交成功」的页面事件没有对应的咨询记录/);
  assert.match(text, /\| \/blog\/fha-loan-i797-no-ead \| 1 \|/);
  assert.match(text, /\| \/blog\/itin-mortgage-california \| 点了电话 \| 1 \|/);
});

test('question 4: new pages with no AI crawl in 14 days, split by whether they are 14 days old yet', () => {
  const text = section('## 4. 上线满 14 天');
  const [overdue, young] = text.split('### 上线还不满 14 天');
  assert.match(overdue, /\| \/blog\/no-credit-score-buy-home-california \| 2026-11-11 \| 14 \| 来过 1 次 \|/);
  assert.match(overdue, /\| \/blog\/opt-income-not-accepted-mortgage \| 2026-11-11 \| 14 \| 没有 \|/);
  assert.doesNotMatch(overdue, /rsu-income/);            // 12 天前被 ClaudeBot 抓过，算抓过
  assert.doesNotMatch(overdue, /fha-loan|itin-mortgage|mortgage\/dscr|loan-finder/);
  assert.match(young, /\| \/blog\/brand-new-page \| 2026-11-20 \| 5 \|/);
});

test('per-page overview and data-coverage warning are present', () => {
  assert.match(report.markdown, /数据还不满 14 天/);
  const text = section('## 5. 逐页总表');
  assert.match(text, /\| \/blog\/fha-loan-i797-no-ead \| 2026-11-11 \| 5 \| 11-21 14:15 \| 2 \| 1 \| 是 \|/);
  assert.match(text, /\| \/blog\/rsu-income-mortgage-california \| 2026-11-11 \| 0 \| 11-13 03:00 \| 0 \| 0 \| 是 \|/);
  assert.match(text, /\| \/blog\/opt-income-not-accepted-mortgage \| 2026-11-11 \| 0 \| — \| 0 \| 0 \| 否 \|/);
});

test('buildReport copes with empty, partial and hostile input without throwing', () => {
  for (const input of [undefined, {}, { data: {} }, { data: { hits: 'x', events: null, leads: 7 } }, { data: { errors: ['geo_hits: no such table'] }, pages }]) {
    const { markdown, summary } = buildReport(input);
    assert.match(markdown, /还没有任何抓取记录/);
    assert.equal(summary.aiCrawlHits, 0);
  }
  const hostile = buildReport({
    now,
    pages,
    data: { tracking_started: '2026-10-01T00:00:00Z', hits: [{ day: '2026-11-24', path: '/a|b\n<script>', kind: 'bot', source: 'GPTBot', status: 200, hits: 1, last_seen: '2026-11-24T00:00:00Z' }] },
  });
  assert.match(hostile.markdown, /\/a\\\|b <script>/);       // 竖线转义、换行压平，表格不会被撑破
  assert.doesNotMatch(hostile.markdown, /数据还不满/);
});
