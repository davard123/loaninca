// 生成每周 AI 效果报表（Markdown）。
//
// 用法（在仓库根目录）：
//   node scripts/weekly-geo-report.mjs --from-d1            推荐：用本机已登录的 wrangler 直接查线上 D1，不需要任何密钥
//   node scripts/weekly-geo-report.mjs                      从线上 /api/geo-report 读数据，需要环境变量 LOANINCA_ADMIN_KEY
//   node scripts/weekly-geo-report.mjs --input data.json    用一份已有的数据文件，不联网
//   可选：--out 报表路径   --days 7   --site https://www.loaninca.com   --now 2026-11-18T16:00:00Z   --db ndf-lending-db
//
// 只读：--from-d1 只发 SELECT（和 /api/geo-report 用同一套查询，咨询不取姓名、电话、邮箱、备注）；
// 否则只发一个 GET /api/geo-report 请求。密钥只放在请求头里，不打印、不落盘。
// --from-d1 的报表默认写到 D:\document\推广周报\GEO报表\<日期>.md；其他方式默认写到 geo-reports/
// （已在 .gitignore 里）。报表都不进仓库——仓库是公开的。

import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { buildReport, formatPacific, pageFile, parseSitemap } from './lib/geo-report.mjs';
import { createWranglerDb, DEFAULT_DATABASE } from './lib/d1-cli.mjs';
import { loadGeoReportData } from '../functions/api/geo-utils.mjs';

const CRAWL_WINDOW_DAYS = 14;
const NEW_PAGE_DAYS = 60;
export const LOCAL_REPORT_DIR = 'D:/document/推广周报/GEO报表';

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

// 直接查线上 D1：复用 /api/geo-report 背后的同一个函数，结果形状完全一样。
export async function fetchDataFromD1({ days, now, database = DEFAULT_DATABASE, run, cwd } = {}) {
  const db = createWranglerDb({ database, run, cwd });
  const data = await loadGeoReportData(db, days, now);
  if (data.errors.length >= 3) throw new Error(`三张表都没读到，可能是 wrangler 没登录或连不上：${data.errors.join('；')}`);
  return data;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const root = process.cwd();
  const days = Math.min(Math.max(Number.parseInt(args.days, 10) || 7, 1), 60);
  const now = args.now ? new Date(args.now) : new Date();
  if (Number.isNaN(now.getTime())) throw new Error('--now 的时间格式不对。');

  const span = Math.max(days, CRAWL_WINDOW_DAYS) + 1;
  let data;
  if (args.input) data = JSON.parse(fs.readFileSync(path.resolve(String(args.input)), 'utf8'));
  else if (args['from-d1']) data = await fetchDataFromD1({ days: span, now, database: typeof args.db === 'string' ? args.db : DEFAULT_DATABASE, cwd: root });
  else data = await fetchData(String(args.site || 'https://www.loaninca.com'), span);
  for (const error of data.errors || []) console.warn(`注意：${error}`);

  const { markdown, summary } = buildReport({
    data, pages: loadPages(root), now, days, crawlWindowDays: CRAWL_WINDOW_DAYS, newPageDays: NEW_PAGE_DAYS,
  });

  const defaultOut = args['from-d1'] && !args.input
    ? path.join(LOCAL_REPORT_DIR, `${formatPacific(now, false)}.md`)
    : path.join('geo-reports', `geo-weekly-${now.toISOString().slice(0, 10)}.md`);
  const out = path.resolve(String(args.out || defaultOut));
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
