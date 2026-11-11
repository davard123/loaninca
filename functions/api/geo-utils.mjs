// GEO 效果测量：识别 AI 爬虫 / AI 产品带来的访问，并把「哪天、哪个页面、谁、状态码、几次」记进 D1。
// 只记这五样。不记 IP、不记完整 UA、不记网址里问号后面的参数、不写 cookie。
// 这里的所有函数都不能抛错到调用方：中间件靠它记账，但页面响应不能受它影响。

// kind：ai_train = 抓去训练模型；ai_search = 给 AI 搜索建索引；ai_user = 有人正在问 AI，AI 当场来读这一页；
//       search = 传统搜索引擎（Google / Bing 的结果同时喂给 Gemini、Copilot、ChatGPT 搜索）。
// 顺序有讲究：更具体的名字要排在前面（例如 Google-CloudVertexBot 要先于 Googlebot）。
// 名单依据各家官方文档（2026-11 核对）：
//   OpenAI      https://developers.openai.com/api/docs/bots
//   Perplexity  https://docs.perplexity.ai/guides/bots
//   Anthropic   https://support.claude.com/en/articles/8896518
//   Google      https://developers.google.com/crawling/docs/crawlers-fetchers/google-common-crawlers
//               https://developers.google.com/crawling/docs/crawlers-fetchers/google-user-triggered-fetchers
//   其余        https://developers.cloudflare.com/ai-crawl-control/reference/bots/
// 注意：Google-Extended 和 Applebot-Extended 只是 robots.txt 里的开关名，不会出现在访问记录里，所以这里没有。
export const BOT_RULES = [
  { name: 'GPTBot', operator: 'OpenAI', kind: 'ai_train', re: /GPTBot/i },
  { name: 'OAI-SearchBot', operator: 'OpenAI', kind: 'ai_search', re: /OAI-SearchBot/i },
  { name: 'ChatGPT-User', operator: 'OpenAI', kind: 'ai_user', re: /ChatGPT-User/i },
  { name: 'OAI-AdsBot', operator: 'OpenAI', kind: 'other', re: /OAI-AdsBot/i },

  { name: 'Perplexity-User', operator: 'Perplexity', kind: 'ai_user', re: /Perplexity-User/i },
  { name: 'PerplexityBot', operator: 'Perplexity', kind: 'ai_search', re: /PerplexityBot/i },

  { name: 'Claude-User', operator: 'Anthropic', kind: 'ai_user', re: /Claude-User/i },
  { name: 'Claude-SearchBot', operator: 'Anthropic', kind: 'ai_search', re: /Claude-SearchBot/i },
  { name: 'ClaudeBot', operator: 'Anthropic', kind: 'ai_train', re: /ClaudeBot|anthropic-ai|claude-web/i },

  { name: 'Google-CloudVertexBot', operator: 'Google', kind: 'ai_train', re: /Google-CloudVertexBot/i },
  { name: 'Google-Agent', operator: 'Google', kind: 'ai_user', re: /Google-Agent/i },
  { name: 'Google-GeminiNotebook', operator: 'Google', kind: 'ai_user', re: /Google-GeminiNotebook|Google-NotebookLM/i },
  { name: 'GoogleOther', operator: 'Google', kind: 'other', re: /GoogleOther/i },
  { name: 'Googlebot', operator: 'Google', kind: 'search', re: /Googlebot/i },

  { name: 'Bingbot', operator: 'Microsoft', kind: 'search', re: /bingbot/i },

  { name: 'Bytespider', operator: 'ByteDance', kind: 'ai_train', re: /Bytespider/i },
  { name: 'Meta-ExternalFetcher', operator: 'Meta', kind: 'ai_user', re: /meta-externalfetcher/i },
  { name: 'Meta-ExternalAgent', operator: 'Meta', kind: 'ai_train', re: /meta-externalagent/i },
  { name: 'FacebookBot', operator: 'Meta', kind: 'ai_train', re: /FacebookBot/i },
  { name: 'Amazonbot', operator: 'Amazon', kind: 'ai_train', re: /Amazonbot/i },
  { name: 'Applebot', operator: 'Apple', kind: 'ai_search', re: /Applebot/i },
  { name: 'DuckAssistBot', operator: 'DuckDuckGo', kind: 'ai_user', re: /DuckAssistBot/i },
  { name: 'MistralAI-User', operator: 'Mistral', kind: 'ai_user', re: /MistralAI-User/i },
  { name: 'CCBot', operator: 'Common Crawl', kind: 'ai_train', re: /CCBot/i },
  { name: 'cohere-ai', operator: 'Cohere', kind: 'ai_train', re: /cohere-ai|cohere-training-data-crawler/i },
  { name: 'YouBot', operator: 'You.com', kind: 'ai_search', re: /YouBot/i },
  { name: 'PetalBot', operator: 'Huawei', kind: 'search', re: /PetalBot/i },
  { name: 'Baiduspider', operator: 'Baidu', kind: 'search', re: /Baiduspider/i },
];

const BOT_BY_NAME = new Map(BOT_RULES.map((rule) => [rule.name, rule]));
const AI_KINDS = new Set(['ai_train', 'ai_search', 'ai_user']);

export function classifyBot(userAgent) {
  const ua = String(userAgent ?? '');
  if (!ua) return null;
  for (const rule of BOT_RULES) {
    if (rule.re.test(ua)) return { name: rule.name, operator: rule.operator, kind: rule.kind };
  }
  return null;
}

export function botInfo(name) {
  const rule = BOT_BY_NAME.get(name);
  return rule ? { name: rule.name, operator: rule.operator, kind: rule.kind } : { name, operator: '', kind: 'other' };
}

// 「AI 爬虫」= 上面三类 AI 用途；Googlebot、Bingbot 这类传统搜索爬虫单独算。
export function isAiBot(name) {
  return AI_KINDS.has(botInfo(name).kind);
}

// AI 产品的网页域名 → 报表里显示的名字。域名本身和它的任何子域名都算。
const AI_REFERRER_HOSTS = [
  ['chatgpt.com', 'ChatGPT'],
  ['chat.openai.com', 'ChatGPT'],
  ['perplexity.ai', 'Perplexity'],
  ['gemini.google.com', 'Gemini'],
  ['notebooklm.google.com', 'NotebookLM'],
  ['copilot.microsoft.com', 'Copilot'],
  ['copilot.com', 'Copilot'],
  ['claude.ai', 'Claude'],
  ['grok.com', 'Grok'],
  ['meta.ai', 'Meta AI'],
  ['chat.mistral.ai', 'Mistral'],
  ['you.com', 'You.com'],
  ['phind.com', 'Phind'],
  ['poe.com', 'Poe'],
  ['chat.deepseek.com', 'DeepSeek'],
  ['doubao.com', '豆包'],
  ['kimi.com', 'Kimi'],
  ['kimi.moonshot.cn', 'Kimi'],
  ['yuanbao.tencent.com', '腾讯元宝'],
  ['tongyi.com', '通义'],
  ['tongyi.aliyun.com', '通义'],
  ['yiyan.baidu.com', '文心一言'],
  ['chatglm.cn', '智谱清言'],
  ['metaso.cn', '秘塔'],
];

// utm_source 里常见的写法（ChatGPT 会自动给链接加 utm_source=chatgpt.com）。
const AI_UTM_WORDS = [
  ['chatgpt', 'ChatGPT'],
  ['openai', 'ChatGPT'],
  ['perplexity', 'Perplexity'],
  ['gemini', 'Gemini'],
  ['copilot', 'Copilot'],
  ['claude', 'Claude'],
  ['deepseek', 'DeepSeek'],
  ['doubao', '豆包'],
  ['kimi', 'Kimi'],
  ['grok', 'Grok'],
];

export function aiSourceFromHost(host) {
  const value = String(host ?? '').trim().toLowerCase().replace(/^www\./, '');
  if (!value) return null;
  for (const [domain, label] of AI_REFERRER_HOSTS) {
    if (value === domain || value.endsWith(`.${domain}`)) return label;
  }
  return null;
}

export function aiSourceFromUtm(utmSource) {
  const value = String(utmSource ?? '').trim().toLowerCase();
  if (!value) return null;
  const byHost = aiSourceFromHost(value);
  if (byHost) return byHost;
  for (const [word, label] of AI_UTM_WORDS) {
    if (value === word || value.startsWith(`${word}.`) || value.startsWith(`${word}-`) || value.startsWith(`${word}_`)) {
      return label;
    }
  }
  return null;
}

// referer 是请求头里的来源网址；search 是本次请求网址问号后面那段。
export function classifyAiReferrer(referer, search) {
  let host = '';
  try {
    if (referer) host = new URL(String(referer)).hostname;
  } catch {
    host = '';
  }
  const fromHost = aiSourceFromHost(host);
  if (fromHost) return { source: fromHost, via: 'referrer' };

  let utm = '';
  try {
    utm = new URLSearchParams(String(search ?? '')).get('utm_source') || '';
  } catch {
    utm = '';
  }
  const fromUtm = aiSourceFromUtm(utm);
  if (fromUtm) return { source: fromUtm, via: 'utm' };
  return null;
}

// 给 AI 和搜索引擎看的几个文本文件也值得记（它们来没来读 llms.txt、sitemap）。
const TRACKED_FILES = new Set(['/robots.txt', '/sitemap.xml', '/llms.txt', '/llms-full.txt']);
const SKIP_PREFIX = /^\/(api|assets|cdn-cgi|admin|rate-card)(\/|$|\.)/i;
const HAS_EXTENSION = /\.[a-z0-9]{1,8}$/i;

// 只记「页面」：静态资源（图片、样式、脚本、字体……）、接口、后台一律不记。
export function isTrackablePath(pathname) {
  const path = String(pathname ?? '');
  if (!path.startsWith('/') || path.length > 200) return false;
  if (TRACKED_FILES.has(path.toLowerCase())) return true;
  if (SKIP_PREFIX.test(path)) return false;
  if (/\.html?$/i.test(path)) return true;
  return !HAS_EXTENSION.test(path);
}

function cleanPath(pathname) {
  return String(pathname ?? '').replace(/[\u0000-\u001f\u007f]/g, '').slice(0, 200);
}

// 判断这次请求要不要记、记成什么。不碰数据库，方便单独测试。
export function classifyRequest({ method, pathname, search, userAgent, referer, secFetchDest, purpose }) {
  if (String(method ?? 'GET').toUpperCase() !== 'GET') return null;
  if (!isTrackablePath(pathname)) return null;

  const bot = classifyBot(userAgent);
  if (bot) return { kind: 'bot', source: bot.name, path: cleanPath(pathname) };

  // 真人：只算打开页面的那一次请求，浏览器的预加载不算。
  if (secFetchDest && secFetchDest !== 'document') return null;
  if (/prefetch|preview/i.test(String(purpose ?? ''))) return null;
  if (!/\.html?$/i.test(pathname) && HAS_EXTENSION.test(pathname)) return null;
  const ai = classifyAiReferrer(referer, search);
  if (ai) return { kind: 'ai_ref', source: ai.source, path: cleanPath(pathname) };
  return null;
}

// 同一天、同一页、同一来源、同一状态码只占一行，次数累加，表不会无限变大。
const UPSERT_SQL = `
INSERT INTO geo_hits (day, path, kind, source, status, hits, first_seen, last_seen)
VALUES (?, ?, ?, ?, ?, 1, ?, ?)
ON CONFLICT (day, path, kind, source, status)
DO UPDATE SET hits = hits + 1, last_seen = excluded.last_seen`;

export async function recordHit(db, hit, status, now = new Date()) {
  try {
    if (!db || !hit) return false;
    const iso = now.toISOString();
    await db.prepare(UPSERT_SQL)
      .bind(iso.slice(0, 10), hit.path, hit.kind, hit.source, Number(status) || 0, iso, iso)
      .run();
    return true;
  } catch {
    // 表还没建、D1 当天额度用完、网络抖动……都只是少记一笔，不能影响页面。
    return false;
  }
}

// 中间件调用的唯一入口。整个函数自己兜住所有异常。
// 在 Cloudflare Pages 的环境变量里把 GEO_TRACKING 设成 off 可以随时关掉记录，不用改代码。
export function trackGeoHit(context, status) {
  try {
    const { request, env } = context;
    if (!env || !env.DB || env.GEO_TRACKING === 'off') return;
    const url = new URL(request.url);
    const hit = classifyRequest({
      method: request.method,
      pathname: url.pathname,
      search: url.search,
      userAgent: request.headers.get('user-agent'),
      referer: request.headers.get('referer'),
      secFetchDest: request.headers.get('sec-fetch-dest'),
      purpose: request.headers.get('sec-purpose') || request.headers.get('purpose'),
    });
    if (!hit) return;
    const pending = recordHit(env.DB, hit, status).catch(() => false);
    if (typeof context.waitUntil === 'function') context.waitUntil(pending);
  } catch {
    // 忽略：测量失败不算事故。
  }
}

// ---- 周报用的只读数据 ----

const EVENT_TYPES = [
  'lead_submitted', 'lead_started', 'phone_clicked', 'email_clicked',
  'loan_finder_started', 'loan_finder_completed', 'afford_started',
];

function parseJsonObject(text) {
  try {
    const value = JSON.parse(text || '{}');
    return value && typeof value === 'object' ? value : {};
  } catch {
    return {};
  }
}

function shortText(value, max = 200) {
  return String(value ?? '').replace(/[\u0000-\u001f\u007f]/g, ' ').trim().slice(0, max);
}

// 给 /api/geo-report 用：三段查询互不影响，哪张表缺了就返回空数组并在 errors 里说明。
// 咨询只取编号、时间、类型和来源页——姓名、电话、邮箱、备注一律不出库。
export async function loadGeoReportData(db, days = 14, now = new Date()) {
  const span = Math.min(Math.max(Math.trunc(Number(days)) || 14, 1), 120);
  const since = new Date(now.getTime() - span * 86400000);
  const sinceDay = since.toISOString().slice(0, 10);
  const sinceSql = since.toISOString().slice(0, 19).replace('T', ' ');
  const out = { generated_at: now.toISOString(), days: span, since: since.toISOString(), hits: [], events: [], leads: [], tracking_started: null, errors: [] };

  try {
    const { results } = await db.prepare(
      'SELECT day, path, kind, source, status, hits, first_seen, last_seen FROM geo_hits WHERE day >= ? ORDER BY day, path LIMIT 20000',
    ).bind(sinceDay).all();
    out.hits = results || [];
    const first = await db.prepare('SELECT MIN(first_seen) AS first_seen FROM geo_hits').first();
    out.tracking_started = first?.first_seen || null;
  } catch (error) {
    out.errors.push(`geo_hits: ${shortText(error?.message)}`);
  }

  try {
    const marks = EVENT_TYPES.map(() => '?').join(',');
    const { results } = await db.prepare(
      `SELECT calculator_type, input_data, session_id, utm_source, created_at FROM calculator_analytics
       WHERE created_at >= ? AND calculator_type IN (${marks}) ORDER BY created_at LIMIT 5000`,
    ).bind(sinceSql, ...EVENT_TYPES).all();
    out.events = (results || []).map((row) => {
      const input = parseJsonObject(row.input_data);
      return {
        type: row.calculator_type,
        created_at: row.created_at,
        path: shortText(input.path),
        landing: shortText(input.landing),
        landing_inferred: input.landing_inferred ? 1 : 0,
        ref_host: shortText(input.ref_host, 100),
        first_utm_source: shortText(input.first_utm_source, 80),
        utm_source: shortText(row.utm_source, 80),
        session: shortText(row.session_id, 8),
      };
    });
  } catch (error) {
    out.errors.push(`calculator_analytics: ${shortText(error?.message)}`);
  }

  try {
    const { results } = await db.prepare(
      'SELECT id, created_at, inquiry_type, source_url, utm_source, utm_medium, utm_campaign FROM leads WHERE created_at >= ? ORDER BY created_at LIMIT 2000',
    ).bind(sinceSql).all();
    out.leads = (results || []).map((row) => ({
      id: shortText(row.id, 60),
      created_at: row.created_at,
      inquiry_type: shortText(row.inquiry_type, 80),
      source_url: shortText(row.source_url, 300),
      utm_source: shortText(row.utm_source, 80),
      utm_medium: shortText(row.utm_medium, 80),
      utm_campaign: shortText(row.utm_campaign, 80),
    }));
  } catch (error) {
    out.errors.push(`leads: ${shortText(error?.message)}`);
  }

  return out;
}
