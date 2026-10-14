// 拦截不该公开的仓库文件（项目记录、配置、数据库结构、iOS 工程、设计草稿等）。
// Cloudflare Pages 会把整个仓库当静态文件发布，这些文件原本谁都能下载。
// 注意：BingSiteAuth.xml、yandex_*.html、IndexNow 密钥 .txt、llms.txt 必须保持公开，不要加进来。
const BLOCK = [
  /\.(md|toml|sql|sh|patch)$/i,
  /^\/api-worker\.js$/i,
  /^\/(ios|docs|tests|scripts|templates|origin|www|lending_apple|ndf_lending|estate_ink|gilded_hearth|cupertino_finance|david_dai_[^/]*|%[^/]*)(\/|$)/i,
];

export async function onRequest(context) {
  let path = new URL(context.request.url).pathname;
  try { path = decodeURIComponent(path); } catch { /* 编码不规范就按原样匹配 */ }
  if (BLOCK.some((re) => re.test(path))) {
    const page = await context.env.ASSETS.fetch(new URL('/404.html', context.request.url));
    return new Response(page.body, { status: 404, headers: { 'content-type': 'text/html; charset=utf-8' } });
  }
  return context.next();
}
