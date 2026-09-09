# LoanInCA SEO/GEO 基线

- 盘点日期：2026-09-08（America/Los_Angeles）
- 本轮授权：仅在本地工作分支修改与测试；不发布、不推送、不改 DNS、不提交索引、不提交真实表单。
- 当前仓库：`D:\document\digital-team\business\websites\reader-content-2026-09-06\loaninca`
- 分支：`codex/reader-content-20260906`；盘点开始时工作区干净。

## 站点确认

- 站点：LoanInCA，规范域名 `https://www.loaninca.com/`。
- 证据：主页和抽查页面的 canonical 均指向 `www.loaninca.com`；`robots.txt` 的 sitemap 指向同一域名；`wrangler.toml` 使用静态站点目录 `.`。
- 技术形态：静态 HTML/CSS/JS + Cloudflare Pages Functions/D1 配置；仓库没有 `package.json`，现有验证脚本为 `scripts/validate-site.mjs`、`scripts/audit-production.mjs`。
- 既有内容与 URL 保留；本轮不删除页面、不改 URL、不批量调整重定向。

## 只读现状检查

命令：

```text
node scripts/validate-site.mjs
node scripts/audit-production.mjs https://www.loaninca.com
```

结果：

- 本地站点验证：通过。
- 生产只读审计：sitemap 35 个 URL；页面状态异常 0；内部链接 23 个；断链 1 个；风险表述命中 0 个。
- 该 1 个断链是 Cloudflare Email Protection 注入的 `/cdn-cgi/l/email-protection` 404，不是仓库源文件中的业务链接；本轮不修改 Cloudflare 注入内容。
- GSC/GA4/AI 引用报告：当前任务没有可用的已授权连接，因此不报告曝光、点击、CTR、排名、收录或 AI 引用趋势。没有把“未连接”解释为“没有数据”。

## 核心页面抽查

| URL | 意图/用户 | 状态与页面信号 | 入口/下一步 | 收录证据 |
| --- | --- | --- | --- | --- |
| `/` | 加州华人买房、重贷、投资房用户了解服务 | 200；标题、H1、canonical、index/follow 正常 | 4 个 `loan-finder` 入口 | 未用 GSC 验证 |
| `/mortgage/dscr/` | 投资房/DSCR 方案理解 | 200；3 个 FAQ；有 JSON-LD | 3 个咨询入口 | 未验证 |
| `/mortgage/self-employed/` | 自雇/1099 用户比较收入审核 | 200；3 个 FAQ；有 JSON-LD | 4 个咨询入口 | 未验证 |
| `/mortgage/h1b-opt/` | H1B/OPT 用户准备文件 | 200；3 个 FAQ；有 JSON-LD | 4 个咨询入口 | 未验证 |
| `/mortgage/jumbo/` | 高价房用户了解 Jumbo | 200；3 个 FAQ；有 JSON-LD | 3 个咨询入口 | 未验证 |
| `/mortgage/refinance/` | 房主评估重贷回本 | 200；3 个 FAQ；有 JSON-LD | 3 个咨询入口 | 未验证 |
| `/questions` | 解决常见房贷问题 | 200；28 个 FAQ；有 JSON-LD | 站内咨询入口 | 未验证 |
| `/news` | 官方房贷/住房资讯 | 200；有 JSON-LD | 站内咨询入口 | 未验证 |
| `/loan-finder` | 将场景整理成咨询入口 | 200；有 JSON-LD | 表单/咨询流程 | 未提交真实数据 |

## 证据驱动的问题

1. `llms.txt` 与 `llms-full.txt` 仍列出多个旧服务/旧文章 URL（如 `/refinance-california`、`/blog/h1b-california-home-loan`），这些 URL 会走重定向，不能作为当前规范知识入口。
2. 2026-09-08 的内容人性化提交改动了 Orange County 页面和 3 篇文章，但它们的页面日期、`dateModified` 与 sitemap `lastmod` 仍停留在 2026-08-07/08-28，更新时间信号不一致。
3. `/news` 的页面标题和描述是“房贷与住房资讯”，但 Open Graph 标题/描述仍写成 About 页面内容，分享卡片与页面主题不一致。
4. 现有站点验证脚本不会检查 GEO 知识文件中的 URL 是否为 sitemap 规范 URL，未来容易回归。

## 限制

- 未连接 GSC、GA4、Bing Webmaster 或 AI 引用平台；因此本轮优先做可复现的代码和内容元数据检查，不声称带来排名、收录或引用提升。
- 贷款资格、利率、费用等动态事实未在本轮新增；沿用页面已有来源与文案，不添加未经核实的承诺。
