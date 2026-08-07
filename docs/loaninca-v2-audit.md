# LoanInCA V2 Technical Audit

Generated: 2026-08-06

## Architecture

- Static HTML site hosted on Cloudflare Pages.
- Styling: shared CSS plus legacy page-local CSS/Tailwind CDN on some pages.
- Backend: Cloudflare Pages Functions and D1.
- Content: root service pages and static HTML under blog/.
- Forms: POST /api/leads.
- Analytics: existing visit/calculator endpoints; V2 adds privacy-minimized event names via dataLayer/CustomEvent.
- URLs use extensionless canonicals with Cloudflare redirects from .html.

## Page inventory

| URL | Title | H1 | Canonical | JSON-LD | CTA |
|---|---|---|---|---|---|
| /about | 关于 LoanInCA / 加州华人房贷决策平台 | 让复杂房贷先变得可以理解 | Yes | Yes | Yes |
| /bank-statement-loan-california | 加州 Bank Statement Loan / 自雇人士替代收入房贷 / LoanInCA | Bank Statement Loan 不是“看流水就行”，而是看你的流水能不能被算成收入。 | Yes | Yes | No |
| /bay-area-mortgage | 旧金山湾区华人房贷指南 / LoanInCA | 旧金山湾区华人房贷指南 | Yes | Yes | Yes |
| /calculator | LoanInCA 贷款计算器套件 / NMLS# 2454756 | 🏠 LoanInCA 房贷计算器 | Yes | Yes | No |
| /calculators | 加州房贷计算器平台 / LoanInCA | 把假设写清楚，再看数字 | Yes | Yes | Yes |
| /david-dai | David Dai, Mortgage Advisor / NMLS# 2454756 / LoanInCA | David Dai | Yes | Yes | Yes |
| /disclosures | LoanInCA 执照与披露 | 执照与披露 | Yes | Yes | No |
| /doctor-loan-california | 加州医生贷款 / 低首付、Offer Letter、无 PMI 场景 / LoanInCA | 加州医生贷款，重点不是宣传词，而是结构适不适合你。 | Yes | Yes | No |
| /dscr-loan-california | DSCR Loans California (2026): Investment Property Financing for  | DSCR Loans California (2026)  加州投资房贷款 — 用租金收入申请，无需税表 | Yes | Yes | No |
| /first-time-home-buyer-california | 加州首次购房贷款指南 / 首付、预批、月供、购房补贴 / LoanInCA | 加州首次购房贷款指南 | Yes | Yes | No |
| /glossary | Mortgage Glossary 房贷术语 / LoanInCA | Mortgage Glossary 房贷术语 | Yes | Yes | Yes |
| / | 加州华人房贷决策与工具 / LoanInCA David Dai | 加州买房，先算清楚你适合怎么贷 | Yes | Yes | Yes |
| /irvine-mortgage | Irvine 房贷 / 学区换房、Jumbo、首次购房与重贷 / LoanInCA | Irvine 买房，很多时候先要看的是预算和学区，不是先追一个最低利率。 | Yes | Yes | No |
| /jumbo-loan-california | 加州 Jumbo 贷款指南 / 大额贷款、高房价、信用分要求 / LoanInCA | 加州 Jumbo 贷款指南 | Yes | Yes | No |
| /loan-finder | 贷款方向判断工具 / Loan Scenario Finder / LoanInCA | 用几分钟整理你的贷款方向 | Yes | Yes | Yes |
| /los-angeles-mortgage | Los Angeles 房贷 / 自住房、投资房、Jumbo 与自雇场景 / LoanInCA | 洛杉矶买房，真正拉开差距的往往不是一句利率，而是预算、首付和区域差异。 | Yes | Yes | No |
| /mortgage-dscr | 加州 DSCR Loan 完整指南 / LoanInCA | 加州 DSCR Loan 完整指南 | Yes | Yes | Yes |
| /mortgage-h1b-opt | H1B / OPT 加州房贷指南 / LoanInCA | H1B / OPT 加州房贷指南 | Yes | Yes | Yes |
| /mortgage-jumbo | 加州 Jumbo Loan 决策指南 / LoanInCA | 加州 Jumbo Loan 决策指南 | Yes | Yes | Yes |
| /mortgage-refinance | 加州 Refinance 决策指南 / LoanInCA | 加州 Refinance 决策指南 | Yes | Yes | Yes |
| /mortgage-self-employed | 加州自雇与 1099 房贷指南 / LoanInCA | 加州自雇与 1099 房贷指南 | Yes | Yes | Yes |
| /mortgage | 加州房贷指南 / Mortgage Hub / LoanInCA | 加州房贷指南 | Yes | Yes | Yes |
| /news | LoanInCA 新闻中心 / 房贷最新资讯 | 新闻中心 | Yes | Yes | Yes |
| /opt-home-loan-california | OPT / F1 加州房贷 / 身份、收入、首付与文件结构 / LoanInCA | OPT / F1 在加州能不能做房贷，重点不只是身份本身。 | Yes | Yes | No |
| /orange-county-mortgage | Orange County 房贷 / 购房、换房、重贷、自雇与投资房 / LoanInCA | Orange County 很多贷款问题，不是单点难，而是预算、换房和现金流一起出现。 | Yes | Yes | No |
| /privacy | LoanInCA 隐私政策 | 隐私政策 | Yes | Yes | No |
| /questions | 房贷常见问题 / LoanInCA | 房贷常见问题 | Yes | Yes | Yes |
| /refinance-california | 加州 Refinance / 降月供、Cash-Out、回本时间判断 / LoanInCA | 重贷不是只看利率，而是看你多久能回本、月供会怎么变。 | Yes | Yes | No |
| /san-diego-mortgage | San Diego 华人房贷指南 / LoanInCA | San Diego 华人房贷指南 | Yes | Yes | Yes |
| /san-jose-mortgage | San Jose 房贷 / 科技收入、RSU、Jumbo 与重贷 / LoanInCA | San Jose 贷款难点，很多时候不在基础资格，而在收入结构怎么被 lender 认。 | Yes | Yes | No |
| /scenarios | 贷款 Example Scenarios / LoanInCA | 贷款 Example Scenarios | Yes | Yes | Yes |
| /self-employed-mortgage-california | 加州自雇人士房贷 / Bank Statement、1099、Tax Return 路径 / LoanInCA | 加州自雇人士房贷，真正要先分清的是你适合走哪条收入路径。 | Yes | Yes | No |
| /terms | LoanInCA 使用条款 | 使用条款 | Yes | Yes | No |
| /what-is-loaninca | LoanInCA 是什么网站？/ 加州双语房贷咨询平台 | LoanInCA 是什么网站？ | Yes | Yes | Yes |

Blog inventory: 17 static articles. Existing sitemap retained article URLs.

## Technical SEO findings

### Corrected in V2
- Core V2 pages now use one canonical, unique title/description, one visible H1, zh-CN lang, OG fields and JSON-LD aligned with visible content.
- Removed unsupported homepage LocalBusiness claims, exact hours, price range, address precision, multi-state coverage, Cantonese claim and empty sameAs from the new homepage.
- Added stable WebSite, Organization and Person entity IDs.
- Added clean routes, redirect rules and sitemap entries for new P0/P1 pages.
- Admin is explicitly noindex.
- Existing indexed URLs remain available.

### Risks still present in legacy pages
- Legacy service/blog pages mix page-local styles and metadata patterns. They require a second content-by-content factual and compliance review before template migration.
- Some legacy pages may contain fixed program requirements or market-dependent claims. They were not silently rewritten because owner/lender confirmation is required.
- hreflang is not enabled for V2 because a reciprocal, complete English architecture does not yet exist. The former query-string alternate on the homepage was removed.
- WWW/non-WWW and HTTPS consolidation must be verified in Cloudflare production settings.
- External links and HTTP behavior require production crawl after deploy.

## Accessibility and mobile

V2 includes skip navigation, semantic landmarks, visible focus, 44px+ primary controls, responsive layouts at 600/900px, no horizontal calculator tables, aria-live results and reduced-motion handling. Target viewport QA: 390, 430, 768, 1024, 1440.

## Performance risks

- V2 removes Tailwind CDN and large inline framework config from the homepage.
- David headshot is the only non-OG homepage image and has explicit dimensions.
- Google Fonts remains a third-party dependency and should be self-hosted if Lighthouse flags it.
- Legacy pages may still load Tailwind CDN and large inline CSS.

## Claims audit

Verified configuration: David Dai, NMLS# 2454756, Chinese/English, California focus. Program-dependent values are centralized in assets/siteFacts.mjs. Annual loan limits and market rates remain unpopulated until verified.

## Lighthouse target

Not claimed without an actual browser run. Run production Lighthouse after deployment; target Performance >=90, Accessibility >=95, Best Practices >=95, SEO >=95.

## Continuation QA — 2026-08-07

- Correctly styled HTTP screenshots regenerated for desktop and mobile.
- Sixteen V2 routes crawled: HTTP 200, one H1, canonical present, no console error, no horizontal overflow. See docs/v2-route-qa.json.
- Removed render-blocking Google Fonts CSS from V2 pages. Lighthouse improved from 59 to 89 Performance; Accessibility 100, Best Practices 100, SEO 100. Local Python server response time accounts for the remaining performance warning; production CDN must be measured after deployment.
- Conservative legacy claim scan found 32 strings requiring contextual owner/compliance review. See docs/TODO_REQUIRES_OWNER_CONFIRMATION.md.
