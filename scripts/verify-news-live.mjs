import { readFile } from 'node:fs/promises';
import { setTimeout as delay } from 'node:timers/promises';
import { validateFeed, escapeHtml } from '../assets/news-utils.mjs';
const expected = JSON.parse(await readFile('assets/mortgage-news.json','utf8'));
validateFeed(expected);
const attempts = Number(process.env.NEWS_VERIFY_ATTEMPTS || 12);
for (let n=1;n<=attempts;n++) {
  try {
    const bust = `?verify=${Date.now()}`;
    const [dataRes,pageRes] = await Promise.all([
      fetch('https://www.loaninca.com/assets/mortgage-news.json'+bust,{signal:AbortSignal.timeout(15000),cache:'no-store'}),
      fetch('https://www.loaninca.com/news'+bust,{signal:AbortSignal.timeout(15000),cache:'no-store'}),
    ]);
    if (!dataRes.ok || !pageRes.ok) throw new Error('Production response not OK');
    const actual = await dataRes.json();
    validateFeed(actual);
    const html = await pageRes.text();
    if (JSON.stringify(actual.items) !== JSON.stringify(expected.items)) throw new Error('Production feed has not caught up');
    for (const item of expected.items) if (!html.includes(escapeHtml(item.title_zh))) throw new Error('Production HTML is not synchronized with the feed');
    if (!html.includes('/assets/news.mjs')) throw new Error('Production still has the legacy news renderer');
    console.log(`PASS: production news HTML and ${expected.items.length} source records match this revision`);
    process.exit(0);
  } catch(error) {
    if(n===attempts) throw error;
    console.log(`Awaiting production verification (${n}/${attempts}): ${error.message}`);
    await delay(15000);
  }
}
