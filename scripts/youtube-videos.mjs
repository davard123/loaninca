#!/usr/bin/env node
// David Dai 的 YouTube 视频 → 网站「视频」页（loaninca / rentalinca 共用同一份脚本）
//
//   node scripts/youtube-videos.mjs --refresh   先读频道 RSS，把新视频并入 data/youtube-videos.json，再生成页面
//   node scripts/youtube-videos.mjs             只按现有数据重新生成页面
//
// 每个视频有一个 topic：mortgage / buying / rental / market；null 表示与房产无关，不上网站。
// 新视频按标题关键词自动归类，归不进去的记为 null，需要的话手工改 data 文件。
// 站点差异写在 scripts/youtube-videos.config.json。

import fs from 'node:fs'
import path from 'node:path'

const ROOT = process.cwd()
const CHANNEL_ID = 'UCUcOnCMN8IN13qKYbuZYzuw'
const CHANNEL_URL = 'https://www.youtube.com/@wuxishane'
const DATA = path.join(ROOT, 'data/youtube-videos.json')
const CONFIG = JSON.parse(fs.readFileSync(path.join(ROOT, 'scripts/youtube-videos.config.json'), 'utf8'))

export const TOPICS = [
  { key: 'mortgage', label: '房贷与贷款', words: ['房贷', '贷款', '利率', '重贷', '首付', '评估价', '放款', 'HELOC', 'Cash-Out', 'Refinance', 'ARM', 'DSCR', 'Jumbo', 'FHA', 'PMI', 'Home Equity', '还贷'] },
  { key: 'rental', label: '出租与房东', words: ['出租', '房东', '房租', '租客', '租金', '租约', '空置', '托管', 'house hack'] },
  { key: 'buying', label: '买房避坑', words: ['买房', '购房', '验房', 'HOA', 'Condo', '开发商', '中介', '代理', 'closing', 'escrow', '和解金', '看房', '学区'] },
  { key: 'market', label: '楼市与持有成本', words: ['房市', '楼市', '房价', '卖房', '地税', '房产税', '保险', '水电', '公寓', '房产'] },
]

const clean = (t) => (t || '').replace(/#\S+/g, '').replace(/\s+/g, ' ').replace(/[:：,，\s]+$/, '').trim()
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
const xmlText = (s) => s.replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&')

// 先看去掉 #标签 的标题，匹配不上再看标签
function guessTopic(title) {
  for (const t of [clean(title).toLowerCase(), title.toLowerCase()]) {
    const hit = TOPICS.find((x) => x.words.some((w) => t.includes(w.toLowerCase())))
    if (hit) return hit.key
  }
  return null
}

function isoDuration(sec) {
  if (!sec) return undefined
  sec = Math.round(sec)
  const h = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60), s = sec % 60
  return `PT${h ? h + 'H' : ''}${m ? m + 'M' : ''}${s}S`
}

const load = () => JSON.parse(fs.readFileSync(DATA, 'utf8'))

// 同一内容发了长视频和短视频（标题相同）时只留一个，优先长视频
function dedupe(videos) {
  const best = new Map()
  for (const v of videos) {
    const k = clean(v.title)
    const cur = best.get(k)
    if (!cur || (cur.kind === 'short' && v.kind === 'long')) best.set(k, v)
  }
  return [...best.values()].sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0))
}

async function refresh() {
  const res = await fetch(`https://www.youtube.com/feeds/videos.xml?channel_id=${CHANNEL_ID}`)
  if (!res.ok) throw new Error(`RSS ${res.status}`)
  const xml = await res.text()
  const data = load()
  const known = new Set(data.videos.map((v) => v.id))
  const added = []
  for (const m of xml.matchAll(/<entry>([\s\S]*?)<\/entry>/g)) {
    const e = m[1]
    const id = e.match(/<yt:videoId>([^<]+)/)?.[1]
    if (!id || known.has(id)) continue
    const title = xmlText(e.match(/<title>([^<]*)/)?.[1] || '')
    const link = e.match(/<link rel="alternate" href="([^"]+)"/)?.[1] || ''
    const v = {
      id,
      kind: link.includes('/shorts/') ? 'short' : 'long',
      title,
      date: (e.match(/<published>([^<]+)/)?.[1] || '').slice(0, 10),
      duration: null,
      topic: guessTopic(title),
      description: xmlText(e.match(/<media:description>([\s\S]*?)<\/media:description>/)?.[1] || '').slice(0, 300),
    }
    data.videos.push(v)
    added.push(v)
  }
  if (added.length) {
    data.updated = new Date().toISOString().slice(0, 10)
    fs.writeFileSync(DATA, JSON.stringify(data, null, 1) + '\n')
  }
  for (const v of added) console.log(`new: ${v.id} [${v.topic ?? '不上网站'}] ${v.title}`)
  console.log(`refresh: ${added.length} new video(s)`)
}

const watchUrl = (v) => (v.kind === 'short' ? `https://www.youtube.com/shorts/${v.id}` : `https://www.youtube.com/watch?v=${v.id}`)

function card(v) {
  const title = clean(v.title)
  return `<article class="yt-card"><div class="yt-play" role="button" tabindex="0" data-id="${v.id}" aria-label="播放：${esc(title)}"><img src="https://i.ytimg.com/vi/${v.id}/hqdefault.jpg" alt="${esc(title)}" loading="lazy" width="480" height="360"><span class="yt-badge">${v.kind === 'short' ? '短视频' : '视频'}</span></div><h3><a href="${watchUrl(v)}" target="_blank" rel="noopener">${esc(title)}</a></h3><p class="yt-date">${v.date}</p></article>`
}

function videoObject(v) {
  const title = clean(v.title)
  return {
    '@type': 'VideoObject', name: title, description: clean(v.description) || title,
    thumbnailUrl: `https://i.ytimg.com/vi/${v.id}/hqdefault.jpg`, uploadDate: v.date, duration: isoDuration(v.duration),
    contentUrl: watchUrl(v), embedUrl: `https://www.youtube.com/embed/${v.id}`,
    author: { '@type': 'Person', name: 'David Dai', url: CHANNEL_URL },
  }
}

function render() {
  const data = load()
  const vids = dedupe(data.videos).filter((v) => CONFIG.topics.includes(v.topic))
  const groups = CONFIG.topics.map((k) => ({ ...TOPICS.find((t) => t.key === k), items: vids.filter((v) => v.topic === k) })).filter((g) => g.items.length)
  const ordered = groups.flatMap((g) => g.items)
  const body = [
    `<nav class="yt-toc" aria-label="视频分类">${groups.map((g) => `<a href="#${g.key}">${g.label}（${g.items.length}）</a>`).join('')}</nav>`,
    ...groups.map((g) => `<section id="${g.key}" class="yt-group"><h2>${g.label}</h2><div class="yt-grid">${g.items.map(card).join('')}</div></section>`),
  ].join('\n')

  const url = CONFIG.pageUrl
  const ld = {
    '@context': 'https://schema.org',
    '@graph': [
      { '@type': 'CollectionPage', '@id': `${url}#page`, url, name: CONFIG.title, description: CONFIG.description, inLanguage: 'zh-CN',
        author: { '@type': 'Person', name: 'David Dai', sameAs: [CHANNEL_URL] }, mainEntity: { '@id': `${url}#videos` } },
      { '@type': 'ItemList', '@id': `${url}#videos`, numberOfItems: ordered.length,
        itemListElement: ordered.map((v, i) => ({ '@type': 'ListItem', position: i + 1, item: videoObject(v) })) },
    ],
  }

  const html = fs.readFileSync(path.join(ROOT, CONFIG.template), 'utf8')
    .replaceAll('{{TITLE}}', esc(CONFIG.title)).replaceAll('{{DESCRIPTION}}', esc(CONFIG.description))
    .replaceAll('{{URL}}', url).replaceAll('{{COUNT}}', String(ordered.length)).replaceAll('{{UPDATED}}', data.updated || '')
    .replace('{{JSONLD}}', () => `<script type="application/ld+json">${JSON.stringify(ld).replace(/</g, '\\u003c')}</script>`)
    .replace('{{CONTENT}}', () => body)
  fs.writeFileSync(path.join(ROOT, CONFIG.output), html)

  const smPath = path.join(ROOT, 'sitemap.xml')
  const sm = fs.readFileSync(smPath, 'utf8')
  const entry = `<url><loc>${url}</loc><lastmod>${data.updated}</lastmod><changefreq>weekly</changefreq><priority>0.6</priority></url>`
  const re = new RegExp(`<url>\\s*<loc>${url.replace(/[.?]/g, '\\$&')}</loc>[\\s\\S]*?</url>`)
  const next = re.test(sm) ? sm.replace(re, entry) : sm.replace('</urlset>', `  ${entry}\n</urlset>`)
  if (next !== sm) fs.writeFileSync(smPath, next)
  console.log(`render: ${ordered.length} videos → ${CONFIG.output}`)
}

if (process.argv.includes('--refresh')) await refresh()
render()
