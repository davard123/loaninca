import { readFile, writeFile } from 'node:fs/promises';
import { updateNewsSitemapLastmod } from './lib/news-sitemap.mjs';

const feed = JSON.parse(await readFile('assets/mortgage-news.json', 'utf8'));
const file = 'sitemap.xml';
const source = await readFile(file, 'utf8');
const result = updateNewsSitemapLastmod(source, feed);

if (!result.changed) {
  console.log(`News sitemap lastmod already ${result.lastmod}; no write`);
} else {
  await writeFile(file, result.content, 'utf8');
  console.log(`Updated /news sitemap lastmod to ${result.lastmod}`);
}
