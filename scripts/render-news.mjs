import { readFile, writeFile } from 'node:fs/promises';
import { renderFeed } from '../assets/news-utils.mjs';
const feed = JSON.parse(await readFile('assets/mortgage-news.json','utf8'));
const file = 'news.html';
const source = (await readFile(file,'utf8')).replace(/\r\n/g, '\n');
const marker = /<!-- MARKET_NEWS_START -->[\s\S]*?<!-- MARKET_NEWS_END -->/;
if (!marker.test(source)) throw new Error('Missing news rendering markers');
const output = source.replace(marker, `<!-- MARKET_NEWS_START -->\n${renderFeed(feed)}\n<!-- MARKET_NEWS_END -->`);
if (process.argv.includes('--check')) {
  if (output !== source) throw new Error('News HTML does not match the feed; run node scripts/render-news.mjs');
  console.log('PASS: news HTML matches the validated source feed');
} else {
  await writeFile(file, output);
  console.log('Rendered news from assets/mortgage-news.json');
}
