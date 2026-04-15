# Backend Admin System — Complete Setup Guide

## Architecture

```
index.html (main site)     calculator.html
        │                         │
        └─────────┬───────────────┘
                  ▼
        Supabase (PostgreSQL + Realtime)
                  │
        ┌─────────┴─────────┐
        ▼                   ▼
   admin.html         Analytics
   (password-protected)  Dashboard
```

## Step 1: Create Supabase Project

1. Go to https://supabase.com and sign up with wuxishanecnc@gmail.com
2. Create new project:
   - Name: `ndf-lending-admin`
   - Database password: Generate a strong password (save it!)
   - Region: Choose closest to California (e.g., us-west)
3. After project is ready, go to **Settings → API** and copy:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon public key**: `eyJhbG...` (long string)

## Step 2: Create Database Tables

Go to **SQL Editor** in Supabase and run:

```sql
-- Customer leads table
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
  utm_source  TEXT,
  utm_medium  TEXT,
  utm_campaign TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Visitor tracking table
CREATE TABLE visits (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  page        TEXT,
  referrer    TEXT,
  user_agent  TEXT,
  utm_source  TEXT,
  utm_medium  TEXT,
  utm_campaign TEXT,
  ip_hash     TEXT,
  timestamp   TIMESTAMPTZ DEFAULT NOW()
);

-- News articles table
CREATE TABLE news (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title       TEXT NOT NULL,
  title_en    TEXT,
  content     TEXT NOT NULL,
  content_en  TEXT,
  category    TEXT DEFAULT 'news' CHECK (category IN ('news','promotion','announcement')),
  published_at TIMESTAMPTZ DEFAULT NOW(),
  is_published BOOLEAN DEFAULT true,
  author      TEXT DEFAULT 'David Dai',
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Loan knowledge base table
CREATE TABLE loan_knowledge (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title       TEXT NOT NULL,
  title_en    TEXT,
  content     TEXT NOT NULL,
  content_en  TEXT,
  category    TEXT DEFAULT 'guide' CHECK (category IN ('guide','faq','tips','case_study')),
  tags        TEXT[],
  is_published BOOLEAN DEFAULT true,
  view_count  INTEGER DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Calculator usage analytics table
CREATE TABLE calculator_analytics (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  calculator_type TEXT DEFAULT 'purchase',
  input_data  JSONB,
  result_data JSONB,
  session_id  TEXT,
  utm_source  TEXT,
  utm_medium  TEXT,
  utm_campaign TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE news ENABLE ROW LEVEL SECURITY;
ALTER TABLE loan_knowledge ENABLE ROW LEVEL SECURITY;
ALTER TABLE calculator_analytics ENABLE ROW LEVEL SECURITY;

-- Allow anonymous INSERT for leads, visits, calculator_analytics (front-end forms)
CREATE POLICY "Allow anon insert leads" ON leads FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Allow anon insert visits" ON visits FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Allow anon insert calculator_analytics" ON calculator_analytics FOR INSERT TO anon WITH CHECK (true);

-- Allow anonymous SELECT for admin panel (protected by password in admin.html)
CREATE POLICY "Allow anon select leads" ON leads FOR SELECT TO anon USING (true);
CREATE POLICY "Allow anon select visits" ON visits FOR SELECT TO anon USING (true);
CREATE POLICY "Allow anon select news" ON news FOR SELECT TO anon USING (true);
CREATE POLICY "Allow anon select loan_knowledge" ON loan_knowledge FOR SELECT TO anon USING (true);
CREATE POLICY "Allow anon select calculator_analytics" ON calculator_analytics FOR SELECT TO anon USING (true);

-- Allow anonymous UPDATE for leads (admin panel updates)
CREATE POLICY "Allow anon update leads" ON leads FOR UPDATE TO anon USING (true);
CREATE POLICY "Allow anon update news" ON news FOR UPDATE TO anon USING (true);
CREATE POLICY "Allow anon update loan_knowledge" ON loan_knowledge FOR UPDATE TO anon USING (true);

-- Allow anonymous DELETE for news and loan_knowledge (admin panel)
CREATE POLICY "Allow anon delete news" ON news FOR DELETE TO anon USING (true);
CREATE POLICY "Allow anon delete loan_knowledge" ON loan_knowledge FOR DELETE TO anon USING (true);

-- Insert sample data
INSERT INTO news (title, title_en, content, content_en, category) VALUES
('2025 年房贷利率更新', '2025 Mortgage Rate Update', 
 '随着美联储政策调整，2025 年房贷利率出现新变化。30 年期固定利率降至 6.5% 左右...',
 'With Federal Reserve policy adjustments, 2025 mortgage rates are seeing new changes. 30-year fixed rates around 6.5%...',
 'news'),
('H1B 持签者购房指南', 'Home Buying Guide for H1B Holders',
 'H1B 签证持有者在美国购房完全可行。主要 lender 包括 Wells Fargo, Bank of America...',
 'H1B visa holders can definitely buy homes in the US. Major lenders include Wells Fargo, Bank of America...',
 'guide');

INSERT INTO loan_knowledge (title, title_en, content, content_en, category, tags) VALUES
('什么是 DSCR 贷款？', 'What is DSCR Loan?',
 'DSCR (Debt Service Coverage Ratio) 贷款是专为投资房设计的贷款类型。与传统贷款不同，DSCR 贷款主要基于房产的租金收入而非借款人的个人收入...',
 'DSCR (Debt Service Coverage Ratio) loans are designed for investment properties. Unlike conventional loans, DSCR loans primarily rely on rental income...',
 'guide', ARRAY['DSCR', '投资房', '贷款类型']);
```

## Step 3: Configure Files

Open `admin.html` and replace lines 10-13 with your Supabase credentials:

```javascript
window.SUPABASE_URL = 'https://YOUR_PROJECT_ID.supabase.co';
window.SUPABASE_ANON_KEY = 'eyJhbG...YOUR_ANON_KEY';
window.ADMIN_PASSWORD = 'your_secure_password';  // Change this!
```

## Step 4: Deploy to Cloudflare Pages

The site is already deployed at loaninca.com. Simply upload the updated files:

1. Go to https://dash.cloudflare.com → Pages → loaninca
2. Click **Create deployment** → Upload files
3. Upload: `index.html`, `calculator.html`, `admin.html`
4. Deploy

## Access URLs

- **Main Site**: https://www.loaninca.com/index.html
- **Calculator**: https://www.loaninca.com/calculator.html  
- **Admin Panel**: https://www.loaninca.com/admin.html (password protected)

## Features

### 1. Customer Form Management
- View all submitted consultation forms
- Filter by status (New, Contacted, Qualified, Closed)
- Search by name/phone/type
- Export to CSV
- Add internal notes

### 2. Visitor Statistics
- Real-time visitor count
- 7-day trend chart
- Page-level tracking
- UTM source tracking (Xiaohongshu, etc.)

### 3. Calculator Usage Tracking
- Track which calculator is used
- Record input parameters (anonymized)
- Usage trends by day/week

### 4. News Management
- Create/Edit/Delete news articles
- Bilingual support (Chinese + English)
- Categories: News, Promotion, Announcement
- Publish/unpublish toggle

### 5. Loan Knowledge Base
- Create educational content
- FAQ management
- Case studies
- Tag-based organization
- View counter
