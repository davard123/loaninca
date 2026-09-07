const DAY = 86400000;
const SOURCE_HOSTS = ['freddiemac.com', 'fanniemae.com', 'fhfa.gov', 'hud.gov', 'consumerfinance.gov', 'mba.org', 'redfin.com', 'federalreserve.gov', 'stlouisfed.org', 'census.gov', 'bls.gov'];
export function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}
export function validDate(value) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && Number.isFinite(Date.parse(value)) && new Date(value).toISOString().slice(0,10) === value;
}
export function sourceUrl(value) {
  const url = new URL(value);
  if (url.protocol !== 'https:' || url.username || url.password || !SOURCE_HOSTS.some(host => url.hostname === host || url.hostname.endsWith('.' + host))) throw new Error('Unsupported news source URL');
  return url.href;
}
export function validateFeed(feed, now = new Date()) {
  if (!feed || !Array.isArray(feed.items) || !feed.items.length || feed.items.length > 30) throw new Error('News feed is empty or invalid');
  const seen = new Set();
  for (const item of feed.items) {
    if (!validDate(item.date) || item.date > now.toISOString().slice(0,10)) throw new Error('Invalid/future news publication date');
    for (const field of ['source','title_zh','summary_zh']) if (typeof item[field] !== 'string' || !item[field].trim()) throw new Error(`Missing ${field}`);
    const key = sourceUrl(item.url) + '|' + item.date;
    if (seen.has(key)) throw new Error('Duplicate news item');
    seen.add(key);
  }
  return [...feed.items].sort((a,b) => b.date.localeCompare(a.date));
}
export function renderFeed(feed, now = new Date()) {
  const items = validateFeed(feed, now);
  const age = date => (now.getTime() - Date.parse(date)) / DAY;
  const recent = items.filter(x => age(x.date) <= 45);
  const archive = items.filter(x => age(x.date) > 45);
  const pmms = items.find(x => x.source === 'Freddie Mac');
  const stale = !pmms || age(pmms.date) > 10;
  const cards = list => list.map(x => `<article class="news-item"><p class="news-meta">${escapeHtml(x.source)} · 来源发布于 <time datetime="${x.date}">${x.date}</time></p><h3><a href="${escapeHtml(sourceUrl(x.url))}" target="_blank" rel="noopener noreferrer">${escapeHtml(x.title_zh)}</a></h3><p>${escapeHtml(x.summary_zh)}</p><a class="news-source" href="${escapeHtml(sourceUrl(x.url))}" target="_blank" rel="noopener noreferrer">阅读 ${escapeHtml(x.source)} 原文 ↗</a></article>`).join('\n');
  return `<p class="status">最新来源日期：${items[0].date}。</p>
${stale ? '<p class="news-warning" role="status">周度利率资料已超过 10 天或暂不可用，查看 <a href="https://www.freddiemac.com/pmms">Freddie Mac 最新发布</a>。</p>' : ''}
<div class="news-list">${recent.length ? cards(recent) : '<p>暂没有近 45 天内的已核实资讯，下面保留历史资料。</p>'}</div>
${archive.length ? `<details class="news-archive"><summary>较早资料（${archive.length} 条）</summary>${cards(archive)}</details>` : ''}`;
}
