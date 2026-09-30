#!/usr/bin/env node
// 推送后通知 IndexNow（Bing、Yandex 等）：读线上站点地图，只报这次改动过的页面
//   INDEXNOW_HOST / INDEXNOW_KEY：站点域名与密钥
//   CHANGED_FILES：本次 push 改动的文件（换行分隔）；为空或设 INDEXNOW_ALL=1 时报站点地图里的全部网址
import { execSync } from 'node:child_process'

const host = process.env.INDEXNOW_HOST
const key = process.env.INDEXNOW_KEY
const base = `https://${host}`

// 等部署上线，最多约 4 分钟：站点地图能读到就开始
let sitemap = ''
for (let i = 0; i < 8; i++) {
  await new Promise((r) => setTimeout(r, 30000))
  const res = await fetch(`${base}/sitemap.xml`, { headers: { 'cache-control': 'no-cache' } }).catch(() => null)
  if (res?.ok) { sitemap = await res.text(); break }
}
if (!sitemap) throw new Error('sitemap not reachable')
const all = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].trim())

// 网址和文件路径都归一成 "cities/irvine" 这样的形式来比对
const norm = (p) => p.replace(/^https?:\/\/[^/]+/, '').replace(/^\//, '').replace(/(^|\/)index\.html$/, '').replace(/\.html$/, '').replace(/\/$/, '')
let urls = all
const changed = (process.env.CHANGED_FILES || '').split('\n').map((s) => s.trim()).filter(Boolean)
if (!process.env.INDEXNOW_ALL && changed.length) {
  const html = new Set(changed.filter((f) => f.endsWith('.html')).map(norm))
  urls = all.filter((u) => html.has(norm(u)))
}
if (!urls.length) { console.log('No sitemap URLs changed; nothing to submit'); process.exit(0) }

const res = await fetch('https://api.indexnow.org/indexnow', {
  method: 'POST',
  headers: { 'content-type': 'application/json; charset=utf-8' },
  body: JSON.stringify({ host, key, keyLocation: `${base}/${key}.txt`, urlList: urls.slice(0, 10000) }),
})
console.log(`IndexNow ${res.status}: submitted ${urls.length} URL(s)`)
urls.slice(0, 50).forEach((u) => console.log('  ' + u))
if (res.status >= 400) process.exit(1)
