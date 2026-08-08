import fs from 'node:fs/promises';

const base = (process.argv[2] || process.env.AUDIT_BASE_URL || 'https://www.loaninca.com').replace(/\/$/, '');
const sitemapResponse = await fetch(base + '/sitemap.xml');
if (!sitemapResponse.ok) throw new Error(`Unable to fetch sitemap: ${sitemapResponse.status}`);
const sitemap = await sitemapResponse.text();
const paths = [...sitemap.matchAll(/<loc>https:\/\/www\.loaninca\.com([^<]*)<\/loc>/g)].map((match) => match[1] || '/');
const pages = [];
const internalLinks = new Set();
const claimHits = [];
const riskyClaims = [/10\+\s*(Years|年)/i, /全美多州/i, /最低利率/i, /保证批准/i, /\$5M\+/i, /无需个人收入证明/i, /客户口碑/i];

for (const path of paths) {
  const response = await fetch(base + path, { redirect: 'manual' });
  const html = await response.text();
  const canonical = html.match(/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)/i)?.[1] || null;
  const h1 = html.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i)?.[1].replace(/<[^>]+>/g, '').trim() || null;
  pages.push({ path, status: response.status, canonical, h1 });
  for (const match of html.matchAll(/href=["'](\/[^"'#?]*)/gi)) if (!match[1].startsWith('//')) internalLinks.add(match[1] || '/');
  for (const pattern of riskyClaims) if (pattern.test(html)) claimHits.push({ path, pattern: pattern.source });
}

const brokenLinks = [];
for (const path of internalLinks) {
  const response = await fetch(base + path, { redirect: 'follow' });
  if (response.status >= 400) brokenLinks.push({ path, status: response.status });
}

const report = { auditedAt: new Date().toISOString(), base, sitemapUrlCount: paths.length, pages, internalLinkCount: internalLinks.size, brokenLinks, claimHits };
await fs.writeFile(new URL('../docs/production-audit-latest.json', import.meta.url), JSON.stringify(report, null, 2) + '\n');
const badPages = pages.filter((page) => page.status !== 200 || !page.canonical || !page.h1);
console.log(JSON.stringify({ sitemapUrlCount: paths.length, badPageCount: badPages.length, internalLinkCount: internalLinks.size, brokenLinkCount: brokenLinks.length, claimHitCount: claimHits.length }, null, 2));
if (badPages.length || brokenLinks.length || claimHits.length) process.exitCode = 1;
