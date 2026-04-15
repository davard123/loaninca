// Cloudflare Worker API for NDF Lending Admin System
// Handles: leads, visits, news, loan_knowledge, calculator_analytics

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    const path = url.pathname.split('/').filter(Boolean);

    try {
      // API Routes
      if (path[0] === 'api') {
        if (path[1] === 'leads') {
          return await handleLeads(request, env, path[2]);
        }
        if (path[1] === 'visits') {
          return await handleVisits(request, env, path[2]);
        }
        if (path[1] === 'news') {
          return await handleNews(request, env, path[2]);
        }
        if (path[1] === 'knowledge') {
          return await handleKnowledge(request, env, path[2]);
        }
        if (path[1] === 'analytics') {
          return await handleAnalytics(request, env, path[2]);
        }
      }

      return new Response('Not Found', { status: 404 });
    } catch (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
  }
};

// Generate UUID
function generateId() {
  return 'id-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
}

// Handle Leads
async function handleLeads(request, env, id) {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  if (request.method === 'GET') {
    const { results } = await env.DB.prepare('SELECT * FROM leads ORDER BY created_at DESC').all();
    return new Response(JSON.stringify(results), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  if (request.method === 'POST') {
    const data = await request.json();
    const leadId = id || generateId();
    await env.DB.prepare(`
      INSERT INTO leads (id, name, phone, email, inquiry_type, loan_amount, note, source_url, utm_source, utm_medium, utm_campaign, status, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'new', datetime('now'))
    `).bind(leadId, data.name, data.phone, data.email, data.inquiry_type, data.loan_amount, data.note, data.source_url, data.utm_source, data.utm_medium, data.utm_campaign).run();

    return new Response(JSON.stringify({ success: true, id: leadId }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  if (request.method === 'PUT' && id) {
    const data = await request.json();
    await env.DB.prepare(`
      UPDATE leads SET status = ?, internal_note = ?, updated_at = datetime('now') WHERE id = ?
    `).bind(data.status, data.internal_note, id).run();

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  return new Response('Method not allowed', { status: 405 });
}

// Handle Visits
async function handleVisits(request, env, id) {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  if (request.method === 'GET') {
    const { results } = await env.DB.prepare('SELECT * FROM visits ORDER BY created_at DESC LIMIT 1000').all();
    return new Response(JSON.stringify(results), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  if (request.method === 'POST') {
    const data = await request.json();
    const visitId = generateId();
    await env.DB.prepare(`
      INSERT INTO visits (id, page, referrer, user_agent, utm_source, utm_medium, utm_campaign, ip_hash, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `).bind(visitId, data.page, data.referrer, data.userAgent, data.utm_source, data.utm_medium, data.utm_campaign, data.ipHash).run();

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  return new Response('Method not allowed', { status: 405 });
}

// Handle News
async function handleNews(request, env, id) {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  if (request.method === 'GET') {
    let sql;
    if (id) {
      sql = 'SELECT * FROM news WHERE id = ?';
      const { results } = await env.DB.prepare(sql).bind(id).all();
      return new Response(JSON.stringify(results[0] || null), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    sql = 'SELECT * FROM news ORDER BY published_at DESC';
    const { results } = await env.DB.prepare(sql).all();
    return new Response(JSON.stringify(results), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  if (request.method === 'POST') {
    const data = await request.json();
    const newsId = id || generateId();
    await env.DB.prepare(`
      INSERT INTO news (id, title, title_en, content, content_en, category, is_published, author, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `).bind(newsId, data.title, data.title_en, data.content, data.content_en, data.category, data.is_published ? 1 : 0, data.author || 'David Dai').run();

    return new Response(JSON.stringify({ success: true, id: newsId }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  if (request.method === 'PUT' && id) {
    const data = await request.json();
    await env.DB.prepare(`
      UPDATE news SET title = ?, title_en = ?, content = ?, content_en = ?, category = ?, is_published = ?, updated_at = datetime('now') WHERE id = ?
    `).bind(data.title, data.title_en, data.content, data.content_en, data.category, data.is_published ? 1 : 0, id).run();

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  if (request.method === 'DELETE' && id) {
    await env.DB.prepare('DELETE FROM news WHERE id = ?').bind(id).run();
    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  return new Response('Method not allowed', { status: 405 });
}

// Handle Knowledge
async function handleKnowledge(request, env, id) {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  if (request.method === 'GET') {
    let sql;
    if (id) {
      sql = 'SELECT * FROM loan_knowledge WHERE id = ?';
      const { results } = await env.DB.prepare(sql).bind(id).all();
      // Increment view count
      if (results[0]) {
        await env.DB.prepare('UPDATE loan_knowledge SET view_count = view_count + 1 WHERE id = ?').bind(id).run();
      }
      return new Response(JSON.stringify(results[0] || null), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    sql = 'SELECT * FROM loan_knowledge ORDER BY created_at DESC';
    const { results } = await env.DB.prepare(sql).all();
    return new Response(JSON.stringify(results), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  if (request.method === 'POST') {
    const data = await request.json();
    const knowledgeId = id || generateId();
    await env.DB.prepare(`
      INSERT INTO loan_knowledge (id, title, title_en, content, content_en, category, tags, is_published, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `).bind(knowledgeId, data.title, data.title_en, data.content, data.content_en, data.category, data.tags, data.is_published ? 1 : 0).run();

    return new Response(JSON.stringify({ success: true, id: knowledgeId }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  if (request.method === 'PUT' && id) {
    const data = await request.json();
    await env.DB.prepare(`
      UPDATE loan_knowledge SET title = ?, title_en = ?, content = ?, content_en = ?, category = ?, tags = ?, is_published = ?, updated_at = datetime('now') WHERE id = ?
    `).bind(data.title, data.title_en, data.content, data.content_en, data.category, data.tags, data.is_published ? 1 : 0, id).run();

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  if (request.method === 'DELETE' && id) {
    await env.DB.prepare('DELETE FROM loan_knowledge WHERE id = ?').bind(id).run();
    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  return new Response('Method not allowed', { status: 405 });
}

// Handle Analytics
async function handleAnalytics(request, env, id) {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  if (request.method === 'GET') {
    // Get calculator usage stats
    const { results } = await env.DB.prepare(`
      SELECT calculator_type, COUNT(*) as usage_count,
             DATE(created_at) as date
      FROM calculator_analytics
      GROUP BY calculator_type, DATE(created_at)
      ORDER BY date DESC
    `).all();
    return new Response(JSON.stringify(results), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  if (request.method === 'POST') {
    const data = await request.json();
    const analyticsId = generateId();
    await env.DB.prepare(`
      INSERT INTO calculator_analytics (id, calculator_type, input_data, result_data, session_id, utm_source, utm_medium, utm_campaign, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `).bind(analyticsId, data.calculator_type, JSON.stringify(data.input_data), JSON.stringify(data.result_data), data.session_id, data.utm_source, data.utm_medium, data.utm_campaign).run();

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  return new Response('Method not allowed', { status: 405 });
}
