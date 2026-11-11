// 生成每周 AI 效果报表（Markdown）。
//
// 用法（在仓库根目录）：
//   node scripts/weekly-geo-report.mjs                      从线上读数据，需要环境变量 LOANINCA_ADMIN_KEY
//   node scripts/weekly-geo-report.mjs --input data.json    用一份已有的数据文件，不联网
//   可选：--out 报表路径   --days 7   --site https://www.loaninca.com   --now 2026-11-18T16:00:00Z
//
// 只读：对线上只发一个 GET /api/geo-report 请求，不写任何东西。密钥只放在请求头里，不打印、不落盘。
// 报表默认写到 geo-reports/（已在 .gitignore 里，不会进仓库——仓库是公开的）。

import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { buildReport, pageFile, parseSitemap } from './lib/geo-report.mjs';

const CRAWL_WINDOW_DAYS = 14;
const NEW_PAGE_DAYS = 60;

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i += 1) {
    if (!argv[i].startsWith('--')) continue;
    const name = argv[i].slice(2);
    const next = argv[i + 1];
    if (next === undefined || next.startsWith('--')) args[name] = true;
    else { args[name] = next; i += 1; }
  }
  return args;
}

// 每个文件第一次提交进仓库的时间 = 页面上线时间。一次 git 调用读完整段历史。
function firstCommitDates(root) {
  const dates = new Map();
  try {
    const log = execFileSync('git', ['-c', 'core.quotepath=false', 'log', '--diff-filter=A', '--name-only', '--format=@%aI'], {
      cwd: root, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, stdio: ['ignore', 'pipe', 'ignore'],
    });
    let current = null;
    for (const line of log.split(/\r?\n/)) {
      if (line.startsWith('@')) current = line.slice(1);
      else if (line && current) dates.set(line, current); // 日志从新到旧，留下的是最早那次
    }
  } catch { /* 没有 git 或不是仓库：退回用 sitemap 的日期 */ }
  return dates;
}

export function loadPages(root) {
  const sitemap = parseSitemap(fs.readFileSync(path.join(root, 'sitemap.xml'), 'utf8'));
  const dates = firstCommitDates(root);
  return sitemap.map((page) => {
    const committed = dates.get(pageFile(page.path));
    const published = committed ? new Date(committed) : page.lastmod ? new Date(`${page.lastmod}T12:00:00Z`) : null;
    return {
      path: page.path,
      key: page.key,
      published: published && !Number.isNaN(published.getTime()) ? published : null,
      publishedFrom: committed ? 'git' : 'sitemap',
    };
  });
}

async function fetchData(site, days) {
  const key = process.env.LOANINCA_ADMIN_KEY || '';
  if (!key) throw new Error('缺少环境变量 LOANINCA_ADMIN_KEY（网站后台的管理密钥）。也可以用 --input 指定一份数据文件。');
  const response = await fetch(`${site.replace(/\/+$/, '')}/api/geo-report?days=${days}`, {
    headers: { 'x-admin-key': key, accept: 'application/json', 'user-agent': 'loaninca-weekly-report' },
  });
  if (response.status === 401) throw new Error('管理密钥不对（网站返回 401）。');
  if (!response.ok) throw new Error(`读取数据失败：网站返回 ${response.status}。`);
  return response.json();
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const root = process.cwd();
  const days = Math.min(Math.max(Number.parseInt(args.days, 10) || 7, 1), 60);
  const now = args.now ? new Date(args.now) : new Date();
  if (Number.isNaN(now.getTime())) throw new Error('--now 的时间格式不对。');

  const data = args.input
    ? JSON.parse(fs.readFileSync(path.resolve(String(args.input)), 'utf8'))
    : await fetchData(String(args.site || 'https://www.loaninca.com'), Math.max(days, CRAWL_WINDOW_DAYS) + 1);

  const { markdown, summary } = buildReport({
    data, pages: loadPages(root), now, days, crawlWindowDays: CRAWL_WINDOW_DAYS, newPageDays: NEW_PAGE_DAYS,
  });

  const out = path.resolve(String(args.out || path.join('geo-reports', `geo-weekly-${now.toISOString().slice(0, 10)}.md`)));
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, markdown, 'utf8');
  console.log(`报表已写到 ${out}`);
  console.log(`AI 爬虫抓取 ${summary.aiCrawlHits} 次 / ${summary.aiCrawlPages} 页；AI 来访 ${summary.aiVisits}；咨询 ${summary.leads}；满两周没被抓的新页面 ${summary.newPagesNotCrawled}`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(`生成报表失败：${error.message}`);
    process.exit(1);
  });
}
