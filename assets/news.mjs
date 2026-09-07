import { renderFeed } from './news-utils.mjs';
const region = document.querySelector('#market-news');
const status = document.querySelector('#news-status');
if (new URLSearchParams(location.search).has('id')) document.querySelector('#legacy-news-note').hidden = false;
try {
  const response = await fetch('/assets/mortgage-news.json', { cache: 'no-store', signal: AbortSignal.timeout(12000) });
  if (!response.ok) throw new Error(`News HTTP ${response.status}`);
  region.innerHTML = renderFeed(await response.json());
  status.textContent = 'Freddie Mac 每周发布全国房贷平均利率，最新收录日期见下方。';
} catch {
  // Keep the checked-in HTML usable when fetching or validation fails.
  status.textContent = '更新检查暂不可用，以下资讯仍可阅读。';
}
