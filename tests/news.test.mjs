import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { parsePmms, mergePmms } from '../scripts/lib/pmms.mjs';
import { validateFeed, renderFeed, sourceUrl } from '../assets/news-utils.mjs';
const now = new Date('2026-09-06T16:00:00Z');
const sample = prior => `U.S. weekly mortgage rate averages as of 09/03/2026 <b>30-year Fixed-Rate Mortgage</b> 6.71% 15-year Fixed-Rate Mortgage 6.04% The 30-year fixed-rate mortgage averaged 6.71%, when it averaged ${prior}%`;
const item = parsePmms(sample('6.66'),now);
test('PMMS parses widget independent of changing prose and compares rates',()=>{
  assert.equal(item.date,'2026-09-03');
  assert.match(item.summary_zh,/高于前一周的 6.66%/);
  assert.match(parsePmms(sample('6.71'),now).summary_zh,/持平/);
  assert.match(parsePmms(sample('6.80'),now).summary_zh,/低于/);
  assert.doesNotMatch(parsePmms(sample('6.66').split('The 30-year')[0],now).summary_zh,/前一周/);
});
test('PMMS rejects invalid, stale, future, out-of-range or missing source values',()=>{
  for(const html of ['unavailable',sample('6.66').replace('09/03/2026','02/31/2026'),sample('6.66').replace('09/03/2026','10/03/2026'),sample('6.66').replace('09/03/2026','08/03/2026'),sample('6.66').replaceAll('6.71','99')]) assert.throws(()=>parsePmms(html,now));
});
test('unchanged data does not fake a new publication and older releases cannot replace newer ones',()=>{
  const feed={generated_at:'2026-09-03T20:00:00Z',items:[item]};
  assert.strictEqual(mergePmms(feed,item,now),feed);
  assert.throws(()=>mergePmms(feed,{...item,date:'2026-08-27'},now));
});
test('feed validation rejects unsafe URLs, future dates and duplicate items',()=>{
  for(const url of ['javascript:alert(1)','https://freddiemac.com.evil.test','https://evil.test']) assert.throws(()=>sourceUrl(url));
  assert.throws(()=>validateFeed({items:[item,item]},now));
  assert.throws(()=>validateFeed({items:[{...item,date:'2026-09-07'}]},now));
});
test('rendering escapes source copy, retains historical labels and warns about stale PMMS',()=>{
  const html=renderFeed({items:[{...item,title_zh:'<img onerror=alert(1)>',date:'2026-06-01'}]},now);
  assert.ok(html.includes('&lt;img'));
  assert.ok(!html.includes('<img'));
  assert.match(html,/已超过 10 天/);
  assert.match(html,/较早资料/);
});
test('news page is statically readable and has no old broken API pipeline',()=>{
  const html=readFileSync('news.html','utf8');
  assert.match(html,/MARKET_NEWS_START/);
  assert.match(html,/class="news-item"/);
  assert.match(html,/assets\/news.mjs/);
  assert.doesNotMatch(html,/ai-content-pipeline|fetch\('\/api\/news/);
});
test('weekly news workflow has one scheduled run plus manual and code-change triggers',()=>{
  const workflow=readFileSync('.github/workflows/update-mortgage-news.yml','utf8');
  const schedules=[...workflow.matchAll(/^\s*- cron:\s*"([^"]+)"\s*$/gm)].map(match=>match[1]);
  assert.deepEqual(schedules,['30 17 * * 4']);
  assert.match(workflow,/^\s*workflow_dispatch:\s*$/m);
  assert.match(workflow,/^\s*push:\s*$/m);
});
