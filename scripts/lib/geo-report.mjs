// 每周 GEO 效果报表：把 /api/geo-report 返回的数据整理成一份 Markdown。
// 这里全是纯函数（不联网、不读文件），方便本地测试。

import { aiSourceFromHost, aiSourceFromUtm, botInfo, isAiBot } from '../../functions/api/geo-utils.mjs';

const DAY_MS = 86400000;
const KIND_LABEL = {
  ai_train: '训练抓取',
  ai_search: 'AI 搜索索引',
  ai_user: '用户提问时实时读取',
  search: '传统搜索引擎',
  other: '其他',
};

// 同一个页面的几种写法（/blog/a、/blog/a.html、/blog/a/）归成一个。
export function pageKey(input) {
  let path = String(input ?? '');
  try {
    if (/^https?:\/\//i.test(path)) path = new URL(path).pathname;
  } catch { /* 按原样处理 */ }
  path = path.split('#')[0].split('?')[0];
  try { path = decodeURIComponent(path); } catch { /* 按原样处理 */ }
  path = path.replace(/\/index\.html?$/i, '/').replace(/\.html?$/i, '');
  if (path.length > 1) path = path.replace(/\/+$/, '');
  return path || '/';
}

export function parseSitemap(xml) {
  const pages = [];
  for (const block of String(xml ?? '').matchAll(/<url>([\s\S]*?)<\/url>/g)) {
    const loc = block[1].match(/<loc>\s*([^<\s]+)\s*<\/loc>/)?.[1];
    if (!loc) continue;
    let path;
    try { path = new URL(loc).pathname; } catch { continue; }
    pages.push({ path, key: pageKey(path), lastmod: block[1].match(/<lastmod>\s*([^<\s]+)\s*<\/lastmod>/)?.[1] || null });
  }
  return pages;
}

// 网址路径 → 仓库里的文件名，用来查这个页面是哪天第一次提交的。
export function pageFile(path) {
  const key = pageKey(path);
  if (key === '/') return 'index.html';
  return String(path).endsWith('/') ? `${key.slice(1)}/index.html` : `${key.slice(1)}.html`;
}

function parseTime(value) {
  if (!value) return null;
  const text = String(value).trim();
  const iso = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(text) ? `${text.replace(' ', 'T')}Z` : text;
  const time = new Date(iso);
  return Number.isNaN(time.getTime()) ? null : time;
}

const PT_FORMAT = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'America/Los_Angeles', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false,
});

// 报表里的时间一律写成加州时间。
export function formatPacific(value, withTime = true) {
  const time = value instanceof Date ? value : parseTime(value);
  if (!time) return '—';
  const parts = Object.fromEntries(PT_FORMAT.formatToParts(time).map((part) => [part.type, part.value]));
  const date = `${parts.month}-${parts.day}`;
  return withTime ? `${date} ${parts.hour === '24' ? '00' : parts.hour}:${parts.minute}` : `${parts.year}-${date}`;
}

function cell(value) {
  return String(value ?? '').replace(/\|/g, '\\|').replace(/[\r\n]+/g, ' ');
}

function table(headers, rows) {
  if (rows.length === 0) return '（本期没有记录）\n';
  const lines = [`| ${headers.join(' | ')} |`, `| ${headers.map(() => '---').join(' | ')} |`];
  for (const row of rows) lines.push(`| ${row.map(cell).join(' | ')} |`);
  return `${lines.join('\n')}\n`;
}

function breakdown(map) {
  return [...map.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).map(([name, count]) => `${name} ${count}`).join('、');
}

const isOk = (status) => (status >= 200 && status < 300) || status === 304;
const later = (a, b) => (!a ? b : !b ? a : (a > b ? a : b));

function utcDay(time) {
  return time.toISOString().slice(0, 10);
}

// data：/api/geo-report 的返回；pages：[{ path, key, published(Date|null), publishedFrom }]
export function buildReport({ data = {}, pages = [], now = new Date(), days = 7, crawlWindowDays = 14, newPageDays = 60 } = {}) {
  const hits = Array.isArray(data.hits) ? data.hits : [];
  const events = Array.isArray(data.events) ? data.events : [];
  const leads = Array.isArray(data.leads) ? data.leads : [];
  const errors = Array.isArray(data.errors) ? data.errors : [];

  const weekStart = new Date(now.getTime() - days * DAY_MS);
  const crawlStart = new Date(now.getTime() - crawlWindowDays * DAY_MS);
  const weekDay = utcDay(weekStart);
  const crawlDay = utcDay(crawlStart);
  const trackingStarted = parseTime(data.tracking_started);
  const inventory = new Map(pages.map((page) => [page.key, page]));
  const display = (key) => inventory.get(key)?.path || key;

  // ---- 1. 爬虫 ----
  const crawlByPage = new Map();   // key → { ai: Map, search: Map, last, aiTotal }
  const botTotals = new Map();     // 爬虫名 → { hits, pages:Set, last }
  const problems = new Map();      // `${key} ${status}` → { key, status, bots: Map }
  const aiCrawled14 = new Map();   // key → 14 天内最近一次 AI 爬虫成功抓取时间

  for (const row of hits) {
    if (row.kind !== 'bot') continue;
    const key = pageKey(row.path);
    const count = Number(row.hits) || 0;
    const status = Number(row.status) || 0;
    const ai = isAiBot(row.source);

    if (row.day >= crawlDay && isOk(status) && ai) {
      aiCrawled14.set(key, later(aiCrawled14.get(key), row.last_seen));
    }
    if (row.day < weekDay) continue;

    if (!isOk(status)) {
      const id = `${key} ${status}`;
      const item = problems.get(id) || { key, status, bots: new Map(), total: 0 };
      item.bots.set(row.source, (item.bots.get(row.source) || 0) + count);
      item.total += count;
      problems.set(id, item);
      continue;
    }

    const page = crawlByPage.get(key) || { ai: new Map(), search: new Map(), aiTotal: 0, searchTotal: 0, last: null };
    const bucket = ai ? page.ai : page.search;
    bucket.set(row.source, (bucket.get(row.source) || 0) + count);
    if (ai) { page.aiTotal += count; page.last = later(page.last, row.last_seen); } else page.searchTotal += count;
    crawlByPage.set(key, page);

    const total = botTotals.get(row.source) || { hits: 0, pages: new Set(), last: null };
    total.hits += count;
    total.pages.add(key);
    total.last = later(total.last, row.last_seen);
    botTotals.set(row.source, total);
  }

  // ---- 2. 从 AI 产品点进来的真人 ----
  const visitsByPage = new Map();  // key → { sources: Map, total, last }
  for (const row of hits) {
    if (row.kind !== 'ai_ref' || row.day < weekDay || !isOk(Number(row.status))) continue;
    const key = pageKey(row.path);
    const count = Number(row.hits) || 0;
    const page = visitsByPage.get(key) || { sources: new Map(), total: 0, last: null };
    page.sources.set(row.source, (page.sources.get(row.source) || 0) + count);
    page.total += count;
    page.last = later(page.last, row.last_seen);
    visitsByPage.set(key, page);
  }

  // ---- 3. 咨询来源 ----
  const inWeek = (row) => { const time = parseTime(row.created_at); return time && time >= weekStart; };
  const submitEvents = events.filter((event) => event.type === 'lead_submitted' && inWeek(event)).map((event) => ({ ...event, used: false }));
  const leadRows = [];
  const leadsByLanding = new Map();
  for (const lead of leads.filter(inWeek)) {
    const time = parseTime(lead.created_at);
    const submitKey = lead.source_url ? pageKey(lead.source_url) : '';
    // 表单提交成功后页面会立刻发一条 lead_submitted 事件，按时间（前后 3 分钟内最近的一条）对上。
    let match = null;
    for (const event of submitEvents) {
      if (event.used) continue;
      const gap = Math.abs(parseTime(event.created_at) - time);
      if (gap <= 180000 && (!match || gap < match.gap)) match = { event, gap };
    }
    if (match) match.event.used = true;
    const event = match?.event || {};
    const landingKey = event.landing ? pageKey(event.landing) : '';
    const aiSource = aiSourceFromHost(event.ref_host) || aiSourceFromUtm(event.first_utm_source) || aiSourceFromUtm(lead.utm_source);
    leadRows.push([
      formatPacific(time),
      lead.inquiry_type || '—',
      landingKey ? `${display(landingKey)}${event.landing_inferred ? '（推断）' : ''}` : '没记到',
      submitKey ? display(submitKey) : '没记到',
      event.ref_host || (landingKey ? '直接打开或站内' : '—'),
      aiSource || '—',
      event.first_utm_source || lead.utm_source || '—',
    ]);
    const bucket = landingKey || submitKey || '(未知)';
    leadsByLanding.set(bucket, (leadsByLanding.get(bucket) || 0) + 1);
  }
  const orphanSubmits = submitEvents.filter((event) => !event.used).length;

  const actionRows = new Map();    // `${landing} ${type}` → count
  for (const event of events) {
    if (!inWeek(event) || !['phone_clicked', 'email_clicked', 'lead_started'].includes(event.type)) continue;
    const landing = event.landing ? display(pageKey(event.landing)) : '没记到';
    const id = `${landing}\u0000${event.type}`;
    actionRows.set(id, (actionRows.get(id) || 0) + 1);
  }
  const ACTION_LABEL = { phone_clicked: '点了电话', email_clicked: '点了邮箱', lead_started: '打开了咨询表单' };

  // ---- 4. 新页面两周内没被 AI 爬虫抓过 ----
  const coverageDays = trackingStarted ? Math.floor((now - trackingStarted) / DAY_MS) : 0;
  const notCrawled = [];
  for (const page of pages) {
    if (!page.published) continue;
    const age = Math.floor((now - page.published) / DAY_MS);
    if (age > newPageDays || age < 0) continue;
    if (aiCrawled14.has(page.key)) continue;
    const search = crawlByPage.get(page.key)?.searchTotal || 0;
    notCrawled.push({ page, age, search });
  }
  notCrawled.sort((a, b) => b.age - a.age || a.page.path.localeCompare(b.page.path));
  const overdue = notCrawled.filter((item) => item.age >= crawlWindowDays);
  const young = notCrawled.filter((item) => item.age < crawlWindowDays);
  const newPages = pages.filter((page) => page.published && (now - page.published) / DAY_MS <= newPageDays && now >= page.published);

  // ---- 汇总数字 ----
  const sum = (iterable, pick) => { let total = 0; for (const item of iterable) total += pick(item); return total; };
  const summary = {
    aiCrawlHits: sum(crawlByPage.values(), (page) => page.aiTotal),
    aiCrawlPages: [...crawlByPage.values()].filter((page) => page.aiTotal > 0).length,
    searchCrawlHits: sum(crawlByPage.values(), (page) => page.searchTotal),
    aiVisits: sum(visitsByPage.values(), (page) => page.total),
    leads: leadRows.length,
    newPages: newPages.length,
    newPagesNotCrawled: overdue.length,
    coverageDays,
  };

  // ---- 写成 Markdown ----
  const out = [];
  out.push(`# loaninca.com 每周 AI 效果报表（${formatPacific(weekStart, false)} 至 ${formatPacific(now, false)}）`);
  out.push('');
  out.push(`生成时间：${formatPacific(now, false)} ${formatPacific(now).slice(6)}（加州时间）。下面的时间都是加州时间。`);
  out.push('');

  if (!trackingStarted) {
    out.push('> **还没有任何抓取记录。** 可能是记录功能刚上线、数据库里的表还没建，或者这段时间确实没有 AI 爬虫来过。第 1、2、4 部分暂时是空的。');
    out.push('');
  } else if (coverageDays < crawlWindowDays) {
    out.push(`> **数据还不满 ${crawlWindowDays} 天。** 记录是从 ${formatPacific(trackingStarted, false)} 开始的，到现在 ${coverageDays} 天。第 4 部分「两周没被抓」的结论要等记满 ${crawlWindowDays} 天才算数。`);
    out.push('');
  }
  if (errors.length > 0) {
    out.push(`> 读取数据时有 ${errors.length} 处没读到：${errors.map(cell).join('；')}`);
    out.push('');
  }

  out.push('## 一眼看完');
  out.push('');
  out.push(`- AI 爬虫这 ${days} 天成功抓取 **${summary.aiCrawlHits}** 次，涉及 **${summary.aiCrawlPages}** 个页面（Google、Bing 等传统搜索爬虫另有 ${summary.searchCrawlHits} 次）。`);
  out.push(`- 从 AI 产品点进来的真人访问：**${summary.aiVisits}** 次。`);
  out.push(`- 收到咨询：**${summary.leads}** 条。`);
  out.push(`- 近 ${newPageDays} 天上线的页面共 ${summary.newPages} 个，其中上线满 ${crawlWindowDays} 天却没有任何 AI 爬虫来抓的：**${summary.newPagesNotCrawled}** 个。`);
  out.push('');

  out.push('## 1. AI 爬虫抓了哪些页');
  out.push('');
  out.push('### 按爬虫');
  out.push('');
  out.push(table(
    ['爬虫', '哪家', '用途', '抓取次数', '页面数', '最近一次'],
    [...botTotals.entries()].sort((a, b) => b[1].hits - a[1].hits).map(([name, total]) => {
      const info = botInfo(name);
      return [name, info.operator || '—', KIND_LABEL[info.kind] || info.kind, total.hits, total.pages.size, formatPacific(total.last)];
    }),
  ));
  out.push('### 按页面');
  out.push('');
  out.push(table(
    ['页面', 'AI 爬虫合计', '各家次数', '最近一次', '传统搜索爬虫'],
    [...crawlByPage.entries()]
      .sort((a, b) => b[1].aiTotal - a[1].aiTotal || b[1].searchTotal - a[1].searchTotal || a[0].localeCompare(b[0]))
      .map(([key, page]) => [
        `${display(key)}${inventory.has(key) ? '' : '（不在 sitemap）'}`,
        page.aiTotal,
        breakdown(page.ai) || '—',
        formatPacific(page.last),
        breakdown(page.search) || '—',
      ]),
  ));
  if (problems.size > 0) {
    out.push('### 爬虫没拿到正文的请求（跳转、找不到等）');
    out.push('');
    out.push('301/308 是旧网址自动跳到新网址，属于正常；404 是爬虫在找一个不存在的页面，数量多的话值得看看是不是哪里链接写错了。');
    out.push('');
    out.push(table(
      ['路径', '状态码', '次数', '哪些爬虫'],
      [...problems.values()].sort((a, b) => b.total - a.total).slice(0, 25).map((item) => [item.key, item.status, item.total, breakdown(item.bots)]),
    ));
  }

  out.push('## 2. 从 AI 产品点进来的真人访问');
  out.push('');
  out.push(table(
    ['落在哪个页面', '次数', '来自', '最近一次'],
    [...visitsByPage.entries()].sort((a, b) => b[1].total - a[1].total).map(([key, page]) => [display(key), page.total, breakdown(page.sources), formatPacific(page.last)]),
  ));
  out.push('这个数字是下限：手机 App 里的 AI（以及部分网页版）点链接时不告诉网站自己是谁，这类访问认不出来。');
  out.push('');

  out.push('## 3. 每一条咨询来自哪个页面');
  out.push('');
  out.push(table(['时间', '类型', '进站页', '提交时所在页', '来源网站', 'AI 来源', 'utm_source'], leadRows));
  if (orphanSubmits > 0) {
    out.push(`另有 ${orphanSubmits} 次「表单提交成功」的页面事件没有对应的咨询记录（通常是被垃圾过滤挡掉的机器人提交）。`);
    out.push('');
  }
  if (leadsByLanding.size > 0) {
    out.push('### 按进站页汇总');
    out.push('');
    out.push(table(['进站页', '咨询数'], [...leadsByLanding.entries()].sort((a, b) => b[1] - a[1]).map(([key, count]) => [display(key), count])));
  }
  if (actionRows.size > 0) {
    out.push('### 其他联系动作（按进站页）');
    out.push('');
    out.push(table(
      ['进站页', '动作', '次数'],
      [...actionRows.entries()].sort((a, b) => b[1] - a[1]).map(([id, count]) => { const [landing, type] = id.split('\u0000'); return [landing, ACTION_LABEL[type] || type, count]; }),
    ));
  }

  out.push(`## 4. 上线满 ${crawlWindowDays} 天、却没有任何 AI 爬虫抓过的新页面`);
  out.push('');
  out.push(`范围：近 ${newPageDays} 天上线的页面；「没抓过」指最近 ${crawlWindowDays} 天里没有一次 AI 爬虫成功读到这一页。`);
  out.push('');
  out.push(table(
    ['页面', '上线日期', '已上线天数', '这周传统搜索爬虫来过吗'],
    overdue.map((item) => [item.page.path, formatPacific(item.page.published, false), item.age, item.search > 0 ? `来过 ${item.search} 次` : '没有']),
  ));
  if (young.length > 0) {
    out.push(`### 上线还不满 ${crawlWindowDays} 天、目前还没被 AI 爬虫抓到的（仅供参考，共 ${young.length} 个）`);
    out.push('');
    out.push(table(['页面', '上线日期', '已上线天数'], young.map((item) => [item.page.path, formatPacific(item.page.published, false), item.age])));
  }

  out.push('## 5. 逐页总表');
  out.push('');
  out.push(`只列这 ${days} 天有动静的页面和近 ${newPageDays} 天的新页面。`);
  out.push('');
  const keys = new Set([...crawlByPage.keys()].filter((key) => inventory.has(key)));
  for (const key of visitsByPage.keys()) keys.add(key);
  for (const key of leadsByLanding.keys()) if (key !== '(未知)') keys.add(key);
  for (const page of newPages) keys.add(page.key);
  out.push(table(
    ['页面', '上线日期', `AI 爬虫（${days} 天）`, '最近一次抓取', 'AI 来的访问', '咨询', `${crawlWindowDays} 天内被 AI 抓过`],
    [...keys]
      .map((key) => ({ key, crawl: crawlByPage.get(key), visits: visitsByPage.get(key), leads: leadsByLanding.get(key) || 0 }))
      .sort((a, b) => b.leads - a.leads || (b.visits?.total || 0) - (a.visits?.total || 0) || (b.crawl?.aiTotal || 0) - (a.crawl?.aiTotal || 0) || a.key.localeCompare(b.key))
      .map((row) => [
        display(row.key),
        inventory.get(row.key)?.published ? formatPacific(inventory.get(row.key).published, false) : '—',
        row.crawl?.aiTotal || 0,
        formatPacific(aiCrawled14.get(row.key) || row.crawl?.last),
        row.visits?.total || 0,
        row.leads,
        aiCrawled14.has(row.key) ? '是' : '否',
      ]),
  ));

  out.push('## 读这份报表要知道的几件事');
  out.push('');
  out.push('- 爬虫是按它自己报的名字认的。名字可以冒充，所以个别数字可能偏高；Bytespider 等爬虫有时伪装成普通浏览器，会偏低。');
  out.push('- Google-Extended、Applebot-Extended 只是 robots.txt 里的开关，不是真的爬虫，所以表里不会出现。Google 的 AI（Gemini、AI 概览）用的是 Googlebot 抓到的内容。');
  out.push('- 「用户提问时实时读取」（ChatGPT-User、Perplexity-User、Claude-User）最值得看：这表示有人正在问 AI，AI 当场来读了这一页。');
  out.push('- 被爬虫抓到不等于被 AI 引用。AI 回答里到底有没有提到网站，这份报表看不到。');
  out.push('- 咨询的「进站页」靠访客浏览器里的临时记录，访客换了设备、隔天再来或关过标签页就记不到。');
  out.push('');

  return { markdown: out.join('\n'), summary };
}
