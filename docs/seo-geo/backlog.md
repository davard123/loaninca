# LoanInCA SEO/GEO 任务队列

> 本轮最多实施 3 项；所有生产发布、推送和索引提交均需另行确认。

## P1 — 本轮实施

### 1. 同步 4 个已修改页面的更新时间信号
- 证据：2026-09-08 内容提交修改了 `orange-county-mortgage.html`、`blog/home-buying-process-california-2026.html`、`blog/bank-statement-loan-pitfalls-california.html`、`blog/appraisal-below-purchase-price-california.html`；页面可见更新日期、OG `article:modified_time`/JSON-LD `dateModified` 或 sitemap `lastmod` 仍为旧日期。
- 用户收益：搜索摘要和读者能看到与实际内容维护一致的更新时间。
- 范围：仅改上述 4 个页面及对应 sitemap 条目；保留原 `datePublished`。
- 风险/回滚：日期误标会降低可信度；逐文件回退即可。日期只采用本轮真实提交日期，不批量刷新未修改页面。
- 验收：页面四处日期一致、sitemap 为同一真实日期、现有站点验证通过。

### 2. 为 llms 知识文件改用当前规范 URL
- 证据：`llms.txt`/`llms-full.txt` 有多个旧服务和旧文章路径，会命中 `_redirects`；当前 sitemap 已提供 `/mortgage/.../` 与新文章规范入口。
- 用户收益：爬虫和生成式检索读取到可直接访问的服务/文章，减少重定向和过期入口。
- 范围：仅重写两份知识文件的链接与相应页面清单，并在站点验证脚本中增加回归检查；不改变 robots 的 AI 爬虫策略，不承诺引用提升。
- 风险/回滚：遗漏真实规范 URL会减少发现入口；以 git 单文件回退。只保留 sitemap 中可核验 URL。
- 验收：两文件中的站内 URL 全在 sitemap；无旧重定向路径；人工复核品牌、服务范围和联系方式不变；人为替换一个旧路径时验证脚本能报错。

### 3. 修正新闻页分享元数据
- 证据：`news.html` 的 `<title>`/description/JSON-LD 指向资讯页，但 `og:title` 与 `og:description` 仍是 About 页文案。
- 用户收益：分享到微信、邮件或社交平台时，标题和摘要能准确说明是房贷与住房资讯。
- 范围：只改 `news.html` 两个 Open Graph 字段；不改新闻来源、抓取频率或生产数据。
- 风险/回滚：低；回退两个字段即可。
- 验收：OG 标题/描述与页面 title/description 一致，站点验证和测试通过。

## 待确认/未实施

- GSC/GA4/Bing/AI 引用平台连接与数据授权。
- 是否调整 `robots.txt` 中的 AI 爬虫访问策略（本轮不擅自改）。

## 继续核查后新增

### P1 — 新闻自动更新频率收敛（本地已改，待发布）
- **证据**：原工作流有 3 个 `schedule` 表达式，而产品要求每周 1 次；`verify-news-live.mjs` 当前可验证生产页与 5 条来源记录一致。
- **改动**：`.github/workflows/update-mortgage-news.yml` 保留每周四 17:30 UTC 的单一定时触发，保留 `push` 与 `workflow_dispatch`；`tests/news.test.mjs` 增加调度数量回归测试。
- **验收**：站点验证通过、16/16 测试通过、生产新闻只读同步检查通过。
- **状态**：本地完成，尚未推送；发布需用户明确确认。
