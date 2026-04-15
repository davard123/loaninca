# David Dai 网站 — 后端数据库 & 部署指南

## 整体架构

```
前台网站 (index.html)
    │ 表单提交 + 访客记录
    ▼
Supabase (PostgreSQL 数据库)
    │ 实时数据
    ▼
管理后台 (admin.html)
    线索管理 / 访客分析 / 导出CSV
```

---

## 第一步：创建 Supabase 数据库（免费）

1. 去 https://supabase.com 注册账号（免费）
2. 新建 Project，记录下：
   - Project URL（形如 https://xxxx.supabase.co）
   - anon public key（在 Settings → API 里）

### 在 Supabase SQL Editor 运行以下建表语句：

```sql
-- 客户线索表
CREATE TABLE leads (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name        TEXT NOT NULL,
  phone       TEXT NOT NULL,
  email       TEXT,
  inquiry_type TEXT,
  loan_amount  TEXT,
  note        TEXT,
  internal_note TEXT,
  status      TEXT DEFAULT 'new' CHECK (status IN ('new','contacted','qualified','closed')),
  source_url  TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- 访客记录表
CREATE TABLE visits (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  page        TEXT,
  referrer    TEXT,
  user_agent  TEXT,
  utm_source  TEXT,
  utm_medium  TEXT,
  utm_campaign TEXT,
  timestamp   TIMESTAMPTZ DEFAULT NOW()
);

-- 允许前台匿名写入（只允许INSERT，不允许读取）
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE visits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anon insert leads" ON leads FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Allow anon insert visits" ON visits FOR INSERT TO anon WITH CHECK (true);

-- 只允许有 service_role 的后台读取（或用临时方案：anon 也可读，用密码保护页面）
CREATE POLICY "Allow anon read leads" ON leads FOR SELECT TO anon USING (true);
CREATE POLICY "Allow anon read visits" ON visits FOR SELECT TO anon USING (true);
CREATE POLICY "Allow anon update leads" ON leads FOR UPDATE TO anon USING (true);
```

---

## 第二步：填入配置

在 `index.html` 和 `admin.html` 顶部找到这段，替换成你的真实值：

```javascript
window.SUPABASE_URL = 'https://你的项目ID.supabase.co';
window.SUPABASE_ANON_KEY = 'eyJ...你的anon key...';
```

修改管理员密码（admin.html 顶部）：
```javascript
window.ADMIN_PASSWORD = '你设置的密码';
```

---

## 第三步：部署到 Vercel（免费）

1. 把 `index.html` 和 `admin.html` 放进一个文件夹
2. 去 https://vercel.com 注册（用 GitHub 账号）
3. 把文件夹上传到 GitHub（新建一个 repo）
4. 在 Vercel → New Project → 选择你的 GitHub repo → Deploy
5. 绑定你的域名：在 Vercel → Settings → Domains 添加

**访问地址：**
- 前台：https://你的域名.com/index.html
- 后台：https://你的域名.com/admin.html（密码保护）

---

## 数据库表结构说明

### leads 表（客户线索）
| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID | 自动生成 |
| name | TEXT | 客户姓名 |
| phone | TEXT | 电话 |
| email | TEXT | 邮箱（可选）|
| inquiry_type | TEXT | 咨询类型 |
| loan_amount | TEXT | 贷款金额范围 |
| note | TEXT | 客户备注 |
| internal_note | TEXT | 你的跟进记录 |
| status | TEXT | new/contacted/qualified/closed |
| source_url | TEXT | 来自哪个页面 |
| created_at | TIMESTAMPTZ | 提交时间 |

### visits 表（访客记录）
| 字段 | 类型 | 说明 |
|------|------|------|
| page | TEXT | 访问页面路径 |
| referrer | TEXT | 来源网站 |
| utm_source | TEXT | 推广渠道（如 xiaohongshu）|
| utm_medium | TEXT | 推广方式（如 social）|
| utm_campaign | TEXT | 推广活动名称 |
| timestamp | TIMESTAMPTZ | 访问时间 |

---

## 小红书引流追踪（UTM 参数）

在小红书帖子中，把网站链接改成：
```
https://你的域名.com/?utm_source=xiaohongshu&utm_medium=social&utm_campaign=h1b_guide
```

这样访客点击进来，后台访客记录里会标注来自小红书。
每篇帖子用不同的 campaign 名称，就能知道哪篇文章带来最多客户。

---

## 后续升级建议

- **邮件通知**：在 Supabase 里设置 Database Webhook，每次新线索提交自动发邮件到 lodaviddai@gmail.com
- **Supabase Auth**：用真正的账号密码登录替代现在的简单密码方案
- **分析升级**：接入 Google Analytics 4 做更详细的用户行为分析
