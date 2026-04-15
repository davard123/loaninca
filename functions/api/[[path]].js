// Cloudflare Pages Functions API for NDF Lending Admin System
// Handles: leads, visits, news, knowledge, analytics, federal reserve rates

export async function onRequestPost({ request, env, waitUntil }) {
  const url = new URL(request.url);
  const path = url.pathname.split('/').filter(Boolean);

  try {
    const data = await request.json();

    // Fetch and update Federal Reserve rates
    if (path[1] === 'fed-rates' && path[2] === 'update') {
      // Fetch latest rates from FRED API or source
      const rates = await fetchFederalReserveRates();

      for (const rate of rates) {
        // Check if rate already exists
        const existing = await env.DB.prepare('SELECT * FROM federal_reserve_rates WHERE rate_type = ? ORDER BY last_updated DESC LIMIT 1').bind(rate.rate_type).first();

        // Only update if there's a change or no existing record
        if (!existing || existing.rate_value !== rate.rate_value || existing.change !== rate.change) {
          const id = 'fed-' + rate.rate_type + '-' + Date.now();
          await env.DB.prepare(`
            INSERT INTO federal_reserve_rates (id, rate_type, rate_value, previous_value, change, change_percent, last_updated, effective_date, source_url, notes)
            VALUES (?, ?, ?, ?, ?, ?, datetime('now'), ?, ?, ?)
          `).bind(id, rate.rate_type, rate.rate_value, rate.previous_value, rate.change, rate.change_percent, rate.effective_date, rate.source_url, rate.notes).run();

          // Also create news article if there's a significant change
          if (existing && Math.abs(rate.change) >= 0.25) {
            await createRateNews(env, rate);
          }
        }
      }

      return Response.json({ success: true, updated: rates.length });
    }

    if (path[1] === 'leads') {
      const id = 'lead-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
      await env.DB.prepare(`
        INSERT INTO leads (id, name, phone, email, inquiry_type, loan_amount, note, source_url, utm_source, utm_medium, utm_campaign, status, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'new', datetime('now'))
      `).bind(
        id,
        data.name || '',
        data.phone || '',
        data.email || '',
        data.inquiry_type || '',
        data.loan_amount || '',
        data.note || '',
        data.source_url || '',
        data.utm_source || '',
        data.utm_medium || '',
        data.utm_campaign || ''
      ).run();

      // Send Telegram notification to admin
      const leadData = {
        name: data.name || '未提供',
        phone: data.phone || '未提供',
        email: data.email || '未提供',
        inquiry_type: data.inquiry_type || '未指定',
        loan_amount: data.loan_amount || '未提供',
        note: data.note || '无'
      };

      const telegramMsg = `🎉 新客户咨询

姓名：${leadData.name}
电话：${leadData.phone}
邮箱：${leadData.email}
咨询类型：${leadData.inquiry_type}
贷款金额：${leadData.loan_amount}
备注：${leadData.note}

提交时间：${new Date().toLocaleString('zh-CN')}
来源：${data.source_url || '未知'}`;

      // Send to Telegram Bot using waitUntil to ensure it completes
      const sendTelegram = async () => {
        try {
          if (env.TELEGRAM_BOT_TOKEN && env.TELEGRAM_CHAT_ID) {
            const tgRes = await fetch(
              `https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`,
              {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  chat_id: env.TELEGRAM_CHAT_ID,
                  text: telegramMsg
                })
              }
            );
            const tgData = await tgRes.json();
            if (tgRes.ok) {
              console.log('Telegram notification sent:', tgData.result?.message_id);
            } else {
              console.error('Telegram API error:', tgData);
            }
          } else {
            console.log('Telegram not configured. Has token:', !!env.TELEGRAM_BOT_TOKEN, 'Has chat ID:', !!env.TELEGRAM_CHAT_ID);
          }
        } catch (tgErr) {
          console.error('Telegram send failed:', tgErr.message);
        }
      };

      // Use waitUntil to ensure Telegram notification is sent even after response
      if (waitUntil) {
        waitUntil(sendTelegram());
      } else {
        await sendTelegram();
      }

      return Response.json({ success: true, id });
    }

    if (path[1] === 'visits') {
      const id = 'visit-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
      await env.DB.prepare(`
        INSERT INTO visits (id, page, referrer, user_agent, utm_source, utm_medium, utm_campaign, ip_hash, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
      `).bind(
        id,
        data.page,
        data.referrer || '',
        data.userAgent || '',
        data.utm_source || '',
        data.utm_medium || '',
        data.utm_campaign || '',
        data.ipHash || ''
      ).run();
      return Response.json({ success: true });
    }

    if (path[1] === 'analytics') {
      const id = 'analytics-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
      await env.DB.prepare(`
        INSERT INTO calculator_analytics (id, calculator_type, input_data, result_data, session_id, utm_source, utm_medium, utm_campaign, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
      `).bind(
        id,
        data.calculator_type,
        JSON.stringify(data.input_data || {}),
        JSON.stringify(data.result_data || {}),
        data.session_id || '',
        data.utm_source || '',
        data.utm_medium || '',
        data.utm_campaign || ''
      ).run();
      return Response.json({ success: true });
    }

    return Response.json({ error: 'Unknown endpoint' }, { status: 404 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const path = url.pathname.split('/').filter(Boolean);

  try {
    // Federal Reserve Rates - Get latest rates
    if (path[1] === 'fed-rates') {
      const { results } = await env.DB.prepare('SELECT * FROM federal_reserve_rates ORDER BY last_updated DESC').all();
      return Response.json(results);
    }

    // Daily Rates Table - Get latest daily rates
    if (path[1] === 'daily-rates') {
      const { results } = await env.DB.prepare('SELECT * FROM daily_rates ORDER BY display_order').all();

      // Get latest effective date
      const latestDate = results.length > 0 ? results[0].effective_date : null;

      return Response.json({
        success: true,
        effective_date: latestDate,
        rates: results
      });
    }

    // Test endpoint for Telegram
    if (path[1] === 'test-telegram') {
      const hasToken = !!env.TELEGRAM_BOT_TOKEN;
      const hasChatId = !!env.TELEGRAM_CHAT_ID;
      const tokenPreview = env.TELEGRAM_BOT_TOKEN ? env.TELEGRAM_BOT_TOKEN.substring(0, 15) + '...' : 'none';

      // Try to send test message
      let testResult = 'not attempted';
      if (hasToken && hasChatId) {
        try {
          const tgRes = await fetch(
            `https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                chat_id: env.TELEGRAM_CHAT_ID,
                text: '✅ NDF Lending Telegram 测试消息 - ' + new Date().toLocaleString('zh-CN')
              })
            }
          );
          const tgData = await tgRes.json();
          testResult = tgRes.ok ? 'sent (message_id: ' + (tgData.result?.message_id || 'unknown') + ')' : 'error: ' + JSON.stringify(tgData);
        } catch (e) {
          testResult = 'exception: ' + e.message;
        }
      }

      return Response.json({
        success: true,
        hasToken,
        hasChatId,
        tokenPreview,
        chatId: env.TELEGRAM_CHAT_ID || 'none',
        testResult
      });
    }

    // Debug endpoint for Telegram config
    if (path[1] === 'debug') {
      return Response.json({
        hasTelegramToken: !!env.TELEGRAM_BOT_TOKEN,
        hasChatId: !!env.TELEGRAM_CHAT_ID,
        tokenPrefix: env.TELEGRAM_BOT_TOKEN ? env.TELEGRAM_BOT_TOKEN.substring(0, 10) + '...' : 'none',
        chatId: env.TELEGRAM_CHAT_ID || 'none'
      });
    }

    if (path[1] === 'leads') {
      const { results } = await env.DB.prepare('SELECT * FROM leads ORDER BY created_at DESC').all();
      return Response.json(results);
    }

    if (path[1] === 'visits') {
      const { results } = await env.DB.prepare('SELECT * FROM visits ORDER BY created_at DESC LIMIT 1000').all();
      return Response.json(results);
    }

    if (path[1] === 'news') {
      const { results } = await env.DB.prepare('SELECT * FROM news ORDER BY published_at DESC').all();
      return Response.json(results);
    }

    if (path[1] === 'knowledge') {
      const { results } = await env.DB.prepare('SELECT * FROM loan_knowledge ORDER BY created_at DESC').all();
      return Response.json(results);
    }

    if (path[1] === 'analytics') {
      const { results } = await env.DB.prepare(`
        SELECT calculator_type, COUNT(*) as usage_count, DATE(created_at) as date
        FROM calculator_analytics
        GROUP BY calculator_type, DATE(created_at)
        ORDER BY date DESC LIMIT 30
      `).all();
      return Response.json(results);
    }

    return Response.json({ error: 'Unknown endpoint' }, { status: 404 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function onRequestPut({ request, env }) {
  const url = new URL(request.url);
  const path = url.pathname.split('/').filter(Boolean);
  const id = path[2];

  try {
    const data = await request.json();

    if (path[1] === 'leads' && id) {
      await env.DB.prepare(`
        UPDATE leads SET status = ?, internal_note = ?, updated_at = datetime('now') WHERE id = ?
      `).bind(data.status, data.internal_note, id).run();
      return Response.json({ success: true });
    }

    if (path[1] === 'news' && id) {
      await env.DB.prepare(`
        UPDATE news SET title = ?, title_en = ?, content = ?, content_en = ?, category = ?, is_published = ?, updated_at = datetime('now') WHERE id = ?
      `).bind(data.title, data.title_en, data.content, data.content_en, data.category, data.is_published ? 1 : 0, id).run();
      return Response.json({ success: true });
    }

    if (path[1] === 'knowledge' && id) {
      await env.DB.prepare(`
        UPDATE loan_knowledge SET title = ?, title_en = ?, content = ?, content_en = ?, category = ?, tags = ?, is_published = ?, updated_at = datetime('now') WHERE id = ?
      `).bind(data.title, data.title_en, data.content, data.content_en, data.category, data.tags, data.is_published ? 1 : 0, id).run();
      return Response.json({ success: true });
    }

    return Response.json({ error: 'Unknown endpoint' }, { status: 404 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function onRequestDelete({ request, env }) {
  const url = new URL(request.url);
  const path = url.pathname.split('/').filter(Boolean);
  const id = path[2];

  try {
    if (path[1] === 'news' && id) {
      await env.DB.prepare('DELETE FROM news WHERE id = ?').bind(id).run();
      return Response.json({ success: true });
    }

    if (path[1] === 'knowledge' && id) {
      await env.DB.prepare('DELETE FROM loan_knowledge WHERE id = ?').bind(id).run();
      return Response.json({ success: true });
    }

    return Response.json({ error: 'Unknown endpoint' }, { status: 404 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

// Helper function to fetch Federal Reserve rates
async function fetchFederalReserveRates() {
  // Using Freddie Mac Primary Mortgage Market Survey data
  // In production, you would fetch from FRED API or other reliable source
  const today = new Date();
  const effectiveDate = today.toISOString().split('T')[0];

  // Simulated rates - in production, fetch from actual API
  const rates = [
    {
      rate_type: 'fed_funds_rate',
      rate_value: 4.33,
      previous_value: 4.33,
      change: 0,
      change_percent: 0,
      effective_date: effectiveDate,
      source_url: 'https://www.federalreserve.gov',
      notes: 'Federal Funds Target Rate Upper Bound'
    },
    {
      rate_type: 'mortgage_30yr_fixed',
      rate_value: 6.78,
      previous_value: 6.82,
      change: -0.04,
      change_percent: -0.59,
      effective_date: effectiveDate,
      source_url: 'https://freddiemac.com/pmms',
      notes: '30-Year Fixed Rate Mortgage Average'
    },
    {
      rate_type: 'mortgage_15yr_fixed',
      rate_value: 5.95,
      previous_value: 6.01,
      change: -0.06,
      change_percent: -1.0,
      effective_date: effectiveDate,
      source_url: 'https://freddiemac.com/pmms',
      notes: '15-Year Fixed Rate Mortgage Average'
    },
    {
      rate_type: 'mortgage_5_1_arm',
      rate_value: 6.12,
      previous_value: 6.18,
      change: -0.06,
      change_percent: -0.97,
      effective_date: effectiveDate,
      source_url: 'https://freddiemac.com/pmms',
      notes: '5/1 Adjustable Rate Mortgage Average'
    },
    {
      rate_type: 'treasury_10yr',
      rate_value: 4.25,
      previous_value: 4.31,
      change: -0.06,
      change_percent: -1.39,
      effective_date: effectiveDate,
      source_url: 'https://treasury.gov',
      notes: '10-Year Treasury Constant Maturity Rate'
    }
  ];

  return rates;
}

// Helper function to create news article when rates change significantly
async function createRateNews(env, rate) {
  const today = new Date();
  const direction = rate.change > 0 ? '上涨' : '下降';
  const newsId = 'news-fed-' + Date.now();

  let title = '';
  let content = '';

  if (rate.rate_type === 'fed_funds_rate') {
    title = `美联储利率${direction}${Math.abs(rate.change)}个基点 - ${today.toLocaleDateString('zh-CN')}`;
    content = `联邦基金利率${direction}${Math.abs(rate.change)}个基点，从${rate.previous_value}%调整至${rate.rate_value}%。这是自${today.getFullYear()}年以来的重要调整，将对房贷利率和整体经济产生重要影响。`;
  } else if (rate.rate_type === 'mortgage_30yr_fixed') {
    title = `30 年期房贷利率${direction}${Math.abs(rate.change)}个基点 - ${today.toLocaleDateString('zh-CN')}`;
    content = `30 年期固定房贷利率${direction}${Math.abs(rate.change)}个基点，从${rate.previous_value}%调整至${rate.rate_value}%。对于$500,000 贷款，月供将${rate.change > 0 ? '增加' : '减少'}约$${Math.abs(Math.round(rate.change * 5000 / 12))}。`;
  }

  if (title) {
    await env.DB.prepare(`
      INSERT INTO news (id, title, title_en, content, content_en, category, is_published, published_at, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, 'news', 1, datetime('now'), datetime('now'), datetime('now'))
    `).bind(
      newsId,
      title,
      `Fed Rate ${direction} by ${Math.abs(rate.change)}bps - ${today.toLocaleDateString('en-US')}`,
      content,
      content
    ).run();
  }
}
