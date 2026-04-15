-- Cloudflare D1 Database Schema for NDF Lending Admin System
-- Simpler approach - generate IDs in application code

-- 客户线索表
CREATE TABLE IF NOT EXISTS leads (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  inquiry_type TEXT,
  loan_amount TEXT,
  note TEXT,
  internal_note TEXT,
  status TEXT DEFAULT 'new' CHECK (status IN ('new','contacted','qualified','closed')),
  source_url TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  created_at DATETIME DEFAULT (datetime('now'))
);

-- 访客记录表
CREATE TABLE IF NOT EXISTS visits (
  id TEXT PRIMARY KEY,
  page TEXT,
  referrer TEXT,
  user_agent TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  ip_hash TEXT,
  created_at DATETIME DEFAULT (datetime('now'))
);

-- 新闻文章表
CREATE TABLE IF NOT EXISTS news (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  title_en TEXT,
  content TEXT NOT NULL,
  content_en TEXT,
  category TEXT DEFAULT 'news',
  published_at DATETIME DEFAULT (datetime('now')),
  is_published INTEGER DEFAULT 1,
  author TEXT DEFAULT 'David Dai',
  created_at DATETIME DEFAULT (datetime('now')),
  updated_at DATETIME DEFAULT (datetime('now'))
);

-- 贷款知识库表
CREATE TABLE IF NOT EXISTS loan_knowledge (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  title_en TEXT,
  content TEXT NOT NULL,
  content_en TEXT,
  category TEXT DEFAULT 'guide',
  tags TEXT,
  is_published INTEGER DEFAULT 1,
  view_count INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT (datetime('now')),
  updated_at DATETIME DEFAULT (datetime('now'))
);

-- 计算器使用统计表
CREATE TABLE IF NOT EXISTS calculator_analytics (
  id TEXT PRIMARY KEY,
  calculator_type TEXT DEFAULT 'purchase',
  input_data TEXT,
  result_data TEXT,
  session_id TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  created_at DATETIME DEFAULT (datetime('now'))
);

-- 每日贷款利率表
CREATE TABLE IF NOT EXISTS daily_rates (
  id TEXT PRIMARY KEY,
  rate_name TEXT NOT NULL,
  rate_name_cn TEXT,
  rate_value REAL NOT NULL,
  apr REAL,
  category TEXT DEFAULT 'loan',
  display_order INTEGER DEFAULT 0,
  effective_date DATETIME DEFAULT (datetime('now')),
  created_at DATETIME DEFAULT (datetime('now'))
);

-- 插入示例数据
INSERT INTO news (id, title, title_en, content, content_en, category) VALUES
('news-001', '2025 年房贷利率更新', '2025 Mortgage Rate Update',
 '随着美联储政策调整，2025 年房贷利率出现新变化。30 年期固定利率降至 6.5% 左右，为购房者提供更好的机会。',
 'With Federal Reserve policy adjustments, 2025 mortgage rates are seeing new changes. 30-year fixed rates around 6.5%, offering better opportunities for home buyers.',
 'news'),
('news-002', 'H1B 持签者购房指南', 'Home Buying Guide for H1B Holders',
 'H1B 签证持有者在美国购房完全可行。主要 lender 包括 Wells Fargo, Bank of America, Chase 等都接受 H1B 签证持有人。需要提供：护照、I-797 批准通知、offer letter、2 个月银行流水。',
 'H1B visa holders can definitely buy homes in the US. Major lenders including Wells Fargo, Bank of America, and Chase accept H1B visa holders. Required documents: passport, I-797 approval notice, offer letter, 2 months bank statements.',
 'news');

INSERT INTO loan_knowledge (id, title, title_en, content, content_en, category, tags) VALUES
('guide-001', '什么是 DSCR 贷款？', 'What is DSCR Loan?',
 'DSCR (Debt Service Coverage Ratio) 贷款是专为投资房设计的贷款类型。与传统贷款不同，DSCR 贷款主要基于房产的租金收入而非借款人的个人收入。DSCR = 净营业收入 / 年度债务偿还。通常要求 DSCR >= 1.2。',
 'DSCR (Debt Service Coverage Ratio) loans are designed for investment properties. Unlike conventional loans, DSCR loans primarily rely on rental income. DSCR = Net Operating Income / Annual Debt Service. Typically requires DSCR >= 1.2.',
 'guide', 'DSCR,投资房，贷款类型'),
('guide-002', 'FHA 贷款详解', 'FHA Loan Explained',
 'FHA 贷款由联邦住房管理局担保，首付可低至 3.5%，信用分要求较低（通常 580+）。适合首次购房者。需要支付 upfront MIP 和 annual MIP 保险费。',
 'FHA loans are backed by the Federal Housing Administration, with down payments as low as 3.5% and lower credit score requirements (typically 580+). Ideal for first-time home buyers. Requires upfront and annual MIP premiums.',
 'guide', 'FHA，首次购房，低首付');

-- 每日贷款利率示例数据
INSERT INTO daily_rates (id, rate_name, rate_name_cn, rate_value, apr, category, display_order) VALUES
('daily-001', 'VA 30 Year Fixed', 'VA 30 年固定利率', 5.750, 5.969, 'loan', 1),
('daily-002', '30 Year Fixed', '30 年固定利率', 5.750, 5.969, 'loan', 2),
('daily-003', '15 Year Fixed', '15 年固定利率', 5.250, 5.463, 'loan', 3),
('daily-004', 'JUMBO 30 Year Fixed', 'JUMBO 30 年固定利率', 6.125, 6.349, 'loan', 4),
('daily-005', '30 Year Fixed Bank Stmt', '30 年固定利率 Bank Stmt', 6.250, 6.476, 'loan', 5),
('daily-006', '5/6 ARM', '5/6 可调利率', 5.750, null, 'arm', 6),
('daily-007', '7/6 ARM', '7/6 可调利率', 5.875, null, 'arm', 7),
('daily-008', 'DSCR 30 Year Fixed', 'DSCR 30 年固定利率', 6.125, null, 'dscr', 8),
('daily-009', 'Bridge 12 Month', 'Bridge 12 个月', 6.990, null, 'bridge', 9);
