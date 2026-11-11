-- GEO 效果测量：AI 爬虫抓取和「从 AI 产品点进来」的访问，按天按页面累计。
-- 由 functions/_middleware.js 写入，scripts/weekly-geo-report.mjs 读取。
-- 只有这几列：不记 IP、不记完整 UA、不记网址参数。
--
-- 上线前执行一次（只建表，不动现有数据，可重复执行）：
--   npx wrangler d1 execute ndf-lending-db --remote --file=sql/2026-11-11-geo-hits.sql
-- 没执行也不会出错：中间件写不进去会自己放弃，只是没有数据。

CREATE TABLE IF NOT EXISTS geo_hits (
  day TEXT NOT NULL,                 -- 日期（UTC），YYYY-MM-DD
  path TEXT NOT NULL,                -- 页面路径，不含问号后面的参数
  kind TEXT NOT NULL,                -- 'bot' = 爬虫；'ai_ref' = 真人从 AI 产品点进来
  source TEXT NOT NULL,              -- 爬虫名（GPTBot…）或 AI 产品名（ChatGPT…）
  status INTEGER NOT NULL,           -- 网站返回的状态码（200 正常、301 跳转、404 找不到）
  hits INTEGER NOT NULL DEFAULT 1,   -- 当天累计次数
  first_seen TEXT NOT NULL,          -- 当天第一次的时间（UTC）
  last_seen TEXT NOT NULL,           -- 当天最后一次的时间（UTC）
  PRIMARY KEY (day, path, kind, source, status)
) WITHOUT ROWID;               -- 按主键直接存，每次只算 1 行写入

-- 以后想清理旧数据（可选，例如只留半年）：
--   npx wrangler d1 execute ndf-lending-db --remote --command "DELETE FROM geo_hits WHERE day < date('now','-180 day')"
