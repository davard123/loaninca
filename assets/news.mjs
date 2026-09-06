import { renderFeed } from './news-utils.mjs';
const region = document.querySelector('#market-news');
const status = document.querySelector('#news-status');
if (new URLSearchParams(location.search).has('id')) document.querySelector('#legacy-news-note').hidden = false;
try {
  const response = await fetch('/assets/mortgage-news.json', { cache: 'no-store', signal: AbortSignal.timeout(12000) });
  if (!response.ok) throw new Error(`News HTTP ${response.status}`);
  region.innerHTML = renderFeed(await response.json());
  status.textContent = '已载入本站保存的来源资料。Freddie Mac 利率通常每周发布，不是实时个人报价。';
} catch {
  // Keep the checked-in HTML usable when fetching or validation fails.
  status.textContent = '暂时无法核查是否有新资料，以下显示已保存内容。请按每条发布日期判断，并以原始来源为准。';
}
