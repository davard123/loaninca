# 新闻维护与发布

来源数据只有一份：`assets/mortgage-news.json`。iOS 的同名文件保持内容一致。
`news.html` 中 MARKET_NEWS 标记内由 `scripts/render-news.mjs` 生成，浏览器再从同域 JSON 核查更新；接口故障时仍保留静态正文。

## 数据规则
- 只使用能访问和核查的原始来源，保留真实发布日期、直接链接和简短中文摘要；不要把爬取时间当发布日期，不凑每日新闻条数。
- 预测必须写明是预测，全国平均利率不能当个人报价。未能验证的旧政策不得重新标为新消息。
- 网站动态、市场资讯和常青指南分别维护；不要把旧 `/api/news` 种子预测或失效 AI 内容接口重新混入。
- 45 天以前的资料折叠为历史；PMMS 超过 10 天会警示，不用静默编造新利率。
- 没有内容变化不刷新 generated_at。失败不覆盖有效源数据。

## 执行
1. 从 origin/main 建干净临时 worktree，保留用户原目录未提交内容。每次重新 fetch，不从旧工作树打包上线。
2. `node scripts/update-mortgage-news.mjs` 核查周度 PMMS。其他来源需实际阅读原文再摘要，按日期倒序，保留不超过 8 条。
3. 同步 iOS JSON；`node scripts/render-news.mjs`。
4. `node scripts/render-news.mjs --check`、`node scripts/validate-site.mjs`、`node --test tests/*.test.mjs`。
5. 只提交本次新闻数据及生成的 news.html；正常 fast-forward 推送 main。若并发改动冲突则停止并报告，禁止 force push。
6. 原 Git 集成发布 Cloudflare Pages `loaninca`。`node scripts/verify-news-live.mjs` 核对生产 JSON 与 HTML，不用脏工作目录直接 wrangler 上传。

GitHub 周四更新并在周四稍晚、周五补查 PMMS；Codex 已有每日任务负责更广泛来源，运行依赖本机可用。两者不能互相假冒更新成功。不要创建重复自动化或新增付费接口。
