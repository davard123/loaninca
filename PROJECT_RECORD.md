# NDF Lending 网站项目完整记录

**项目创建时间**: 2026-04-13  
**最后更新**: 2026-04-13  
**负责人**: David Dai (NDF Lending, NMLS# 2454756)

---

## 一、项目概述

### 业务背景
- **公司名称**: NDF Lending
- **品牌**: David Dai Mortgage
- **NMLS**: #2454756
- **业务范围**: 加州及全美多州房贷服务
- **目标客户**: 华裔社区，包括 H1B/OPT 持签者、自雇人士、投资者

### 服务项目
1. 房屋购买贷款 (Home Purchase)
2. 重贷 (Refinance)
3. DSCR 投资房贷款
4. Jumbo 大额贷款
5. H1B/OPT 工签买房
6. 自雇人士贷款 (Self-Employed)

---

## 二、技术架构

### 前端
- **技术栈**: 纯 HTML + Tailwind CSS (CDN)
- **设计风格**: NDF Lending 金棕色主题
- **响应式**: 移动端优先

### 后端
- **平台**: Cloudflare Pages
- **数据库**: Cloudflare D1 (SQLite)
- **API**: Cloudflare Pages Functions
- **部署**: GitHub → Cloudflare Pages 自动部署

### 域名配置
- **主域名**: loaninca.com
- **Pages 项目**: loaninca
- **GitHub Repo**: https://github.com/davard123/loaninca

---

## 三、文件结构

```
/Users/harry/Documents/my-web-site/
├── index.html              # 主网站
├── calculator.html         # 贷款计算器套件
├── admin.html              # 管理后台
├── functions/
│   └── api/
│       └── [[path]].js     # API 后端
├── wrangler.toml           # Cloudflare 配置
├── schema.sql              # 数据库建表语句
├── BUILD.md                # 构建指南
├── DEPLOYED.md             # 部署说明
└── PROJECT_RECORD.md       # 本文件
```

---

## 四、数据库结构

### 1. leads (客户线索表)
| 字段 | 类型 | 说明 |
|------|------|------|
| id | TEXT | UUID 主键 |
| name | TEXT | 客户姓名 |
| phone | TEXT | 电话号码 |
| email | TEXT | 邮箱 |
| inquiry_type | TEXT | 咨询类型 |
| loan_amount | TEXT | 贷款金额范围 |
| note | TEXT | 客户备注 |
| internal_note | TEXT | 内部跟进记录 |
| status | TEXT | new/contacted/qualified/closed |
| source_url | TEXT | 来源页面 URL |
| utm_source | TEXT | UTM 来源 |
| utm_medium | TEXT | UTM 媒介 |
| utm_campaign | TEXT | UTM 活动 |
| created_at | DATETIME | 创建时间 |

### 2. visits (访客记录表)
| 字段 | 类型 | 说明 |
|------|------|------|
| id | TEXT | UUID 主键 |
| page | TEXT | 访问页面 |
| referrer | TEXT | 来源网站 |
| user_agent | TEXT | 浏览器信息 |
| utm_source | TEXT | UTM 来源 |
| utm_medium | TEXT | UTM 媒介 |
| utm_campaign | TEXT | UTM 活动 |
| ip_hash | TEXT | IP 哈希 (匿名) |
| created_at | DATETIME | 访问时间 |

### 3. news (新闻文章表)
| 字段 | 类型 | 说明 |
|------|------|------|
| id | TEXT | UUID 主键 |
| title | TEXT | 中文标题 |
| title_en | TEXT | 英文标题 |
| content | TEXT | 中文内容 |
| content_en | TEXT | 英文内容 |
| category | TEXT | news/promotion/announcement |
| is_published | INTEGER | 发布状态 |
| author | TEXT | 作者 (默认 David Dai) |
| published_at | DATETIME | 发布时间 |
| created_at | DATETIME | 创建时间 |
| updated_at | DATETIME | 更新时间 |

### 4. loan_knowledge (贷款知识库表)
| 字段 | 类型 | 说明 |
|------|------|------|
| id | TEXT | UUID 主键 |
| title | TEXT | 中文标题 |
| title_en | TEXT | 英文标题 |
| content | TEXT | 中文内容 |
| content_en | TEXT | 英文内容 |
| category | TEXT | guide/faq/tips/case_study |
| tags | TEXT | 标签 (逗号分隔) |
| is_published | INTEGER | 发布状态 |
| view_count | INTEGER | 浏览次数 |
| created_at | DATETIME | 创建时间 |
| updated_at | DATETIME | 更新时间 |

### 5. calculator_analytics (计算器统计表)
| 字段 | 类型 | 说明 |
|------|------|------|
| id | TEXT | UUID 主键 |
| calculator_type | TEXT | purchase/refinance/income/closing-cost |
| input_data | TEXT | 输入数据 (JSON) |
| result_data | TEXT | 计算结果 (JSON) |
| session_id | TEXT | 会话 ID |
| utm_source | TEXT | UTM 来源 |
| utm_medium | TEXT | UTM 媒介 |
| utm_campaign | TEXT | UTM 活动 |
| created_at | DATETIME | 创建时间 |

---

## 五、API 端点

### Leads (客户线索)
| 方法 | 端点 | 说明 |
|------|------|------|
| POST | /api/leads | 提交新线索 |
| GET | /api/leads | 获取所有线索 |
| PUT | /api/leads/:id | 更新线索状态 |

### Visits (访客记录)
| 方法 | 端点 | 说明 |
|------|------|------|
| POST | /api/visits | 记录访客 |
| GET | /api/visits | 获取访客列表 |

### News (新闻管理)
| 方法 | 端点 | 说明 |
|------|------|------|
| GET | /api/news | 获取所有新闻 |
| POST | /api/news | 创建新闻 |
| PUT | /api/news/:id | 更新新闻 |
| DELETE | /api/news/:id | 删除新闻 |

### Knowledge (知识库)
| 方法 | 端点 | 说明 |
|------|------|------|
| GET | /api/knowledge | 获取所有文章 |
| POST | /api/knowledge | 创建文章 |
| PUT | /api/knowledge/:id | 更新文章 |
| DELETE | /api/knowledge/:id | 删除文章 |

### Analytics (统计)
| 方法 | 端点 | 说明 |
|------|------|------|
| GET | /api/analytics | 获取计算器使用统计 |
| POST | /api/analytics | 记录计算器使用 |

---

## 六、管理员信息

### 访问地址
- **管理后台**: https://www.loaninca.com/admin.html

### 登录凭证
- **密码**: `david2025!`

### 管理员功能
1. 数据概览仪表盘
   - 今日新线索
   - 本月线索总量
   - 今日访客数
   - 待跟进线索
   - 7 天访客趋势图

2. 客户线索管理
   - 查看全部线索
   - 按状态筛选 (新/已联系/已确认/已成交)
   - 搜索功能 (姓名/电话/类型)
   - 导出 CSV
   - 添加内部备注
   - 更新状态

3. 访客记录
   - 查看完整访客列表
   - 来源页面追踪
   - UTM 参数分析

4. 新闻管理
   - 创建/编辑/删除新闻
   - 中英文双语支持
   - 分类管理
   - 发布/取消发布

5. 知识库管理
   - 创建/编辑/删除文章
   - 标签系统
   - 浏览次数统计

---

## 七、文件变更记录

### 2026-04-13: 初始版本
- ✅ 创建 index.html (主网站)
- ✅ 创建 calculator.html (5 合 1 计算器)
- ✅ 配置 Cloudflare Pages
- ✅ 绑定域名 loaninca.com

### 2026-04-13: 邮件路由
- ✅ 配置 Cloudflare Email Routing
- ✅ 设置 david@loaninca.com → wuxishanecnc@gmail.com

### 2026-04-13: 后端系统
- ✅ 创建 Cloudflare D1 数据库
- ✅ 执行 SQL 建表语句
- ✅ 开发 Pages Functions API
- ✅ 创建 admin.html 管理后台
- ✅ 添加访客追踪代码
- ✅ 添加计算器使用追踪
- ✅ 部署到 Cloudflare Pages
- ✅ 推送到 GitHub

---

## 八、Cloudflare 配置

### 数据库
- **名称**: ndf-lending-db
- **ID**: f127c66b-d115-4d0b-a143-8decf6b6be4b
- **区域**: WNAM

### Pages 项目
- **名称**: loaninca
- **生产分支**: main
- **构建命令**: 无 (静态文件)
- **输出目录**: .

### wrangler.toml
```toml
name = "ndf-lending"
compatibility_date = "2024-01-01"
pages_build_output_dir = "."

[[d1_databases]]
binding = "DB"
database_name = "ndf-lending-db"
database_id = "f127c66b-d115-4d0b-a143-8decf6b6be4b"
```

---

## 九、访问统计

### UTM 追踪参数
用于追踪营销渠道效果：

```
https://www.loaninca.com/?utm_source=xiaohongshu&utm_medium=social&utm_campaign=h1b_guide
```

- **utm_source**: 来源平台 (xiaohongshu, google, facebook)
- **utm_medium**: 媒介类型 (social, cpc, email)
- **utm_campaign**: 活动名称 (h1b_guide, refinance_promo)

---

## 十、安全与隐私

### 数据保护
- 客户信息存储在 Cloudflare D1 (加密)
- 管理后台密码保护
- 无第三方数据共享

### 合规性
- 表单包含隐私声明
- 数据仅用于贷款咨询目的

---

## 十一、后续扩展建议

### 短期 (1-3 个月)
- [ ] 添加邮件通知功能 (新线索提醒)
- [ ] 集成 Google Analytics 4
- [ ] 添加更多计算器类型

### 中期 (3-6 个月)
- [ ] 多管理员账号支持
- [ ] 客户预约系统
- [ ] 贷款利率展示页面

### 长期 (6-12 个月)
- [ ] 客户门户 (查看贷款进度)
- [ ] 文件上传功能
- [ ] 自动化工作流

---

## 十二、联系信息

### 公司
- **名称**: NDF Lending
- **NMLS**: 2454756
- **电话**: 949-656-1278
- **网站**: https://www.loaninca.com

### 社交媒体
- **微信**: WuxiShane
- **小红书**: Wuxshane

---

**文档结束**

最后更新：2026-04-13
