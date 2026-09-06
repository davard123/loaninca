import { readFile } from 'node:fs/promises';
import { setTimeout as delay } from 'node:timers/promises';
import { validateFeed, escapeHtml } from '../assets/news-utils.mjs';
const expected = JSON.parse(await readFile('assets/mortgage-news.json','utf8'));
validateFeed(expected);
const attempts = Number(process.env.NEWS_VERIFY_ATTEMPTS || 12);
for (let n=1;n<=attempts;n++) {
  try {
    const bust = `?verify=${Date.now()}`;
    const fetchPair = base => Promise.all([
      fetch(base+'/assets/mortgage-news.json'+bust,{signal:AbortSignal.timeout(15000),cache:'no-store'}),
      fetch(base+'/news'+bust,{signal:AbortSignal.timeout(15000),cache:'no-store'}),
    ]);
    let [dataRes,pageRes] = await fetchPair('https://www.loaninca.com');
    let verifiedHost = 'www.loaninca.com';
    // Keep the custom domain's bot protections intact. A hosted CI runner can
    // also verify this project's public production alias, never a preview site.
    if ([403,429].includes(dataRes.status) || [403,429].includes(pageRes.status)) {
      console.warn(`Custom-domain verification restricted: JSON HTTP ${dataRes.status}, HTML HTTP ${pageRes.status}; checking the loaninca production alias instead. Custom-domain UI still needs a normal-browser check.`);
      [dataRes,pageRes] = await fetchPair('https://loaninca.pages.dev');
      verifiedHost = 'loaninca.pages.dev (production alias; custom-domain request restricted)';
    }
    if (!dataRes.ok || !pageRes.ok) throw new Error(`Production response not OK: JSON HTTP ${dataRes.status}, HTML HTTP ${pageRes.status}`);
    const actual = await dataRes.json();
    validateFeed(actual);
    const html = await pageRes.text();
    if (JSON.stringify(actual.items) !== JSON.stringify(expected.items)) throw new Error('Production feed has not caught up');
    for (const item of expected.items) if (!html.includes(escapeHtml(item.title_zh))) throw new Error('Production HTML is not synchronized with the feed');
    if (!html.includes('/assets/news.mjs')) throw new Error('Production still has the legacy news renderer');
    console.log(`PASS: ${verifiedHost} news HTML and ${expected.items.length} source records match this revision`);
    break; // Let fetch handles close normally, including on Windows.
  } catch(error) {
    if(n===attempts) throw error;
    console.log(`Awaiting production verification (${n}/${attempts}): ${error.message}`);
    await delay(15000);
  }
}
