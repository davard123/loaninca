import { readFile, writeFile } from 'node:fs/promises';
import { parsePmms, mergePmms } from './lib/pmms.mjs';
import { validateFeed } from '../assets/news-utils.mjs';
const paths = ['assets/mortgage-news.json','ios/LoanInCACalculator/LoanInCACalculator/mortgage-news.json'];
const response = await fetch('https://www.freddiemac.com/pmms', {
  headers: {'user-agent':'LoanInCA news updater (https://www.loaninca.com)'},
  signal: AbortSignal.timeout(25000),
});
if (!response.ok) throw new Error(`PMMS HTTP ${response.status}; existing files retained`);
const item = parsePmms(await response.text());
const feed = JSON.parse(await readFile(paths[0],'utf8'));
const next = mergePmms(feed,item);
validateFeed(next);
const output = `${JSON.stringify(next,null,2)}\n`;
for (const path of paths) {
  if (await readFile(path,'utf8') !== output) await writeFile(path,output,'utf8');
}
console.log(`PMMS verified for ${item.date}; ${next === feed ? 'no new source content' : 'updated source content'}`);
