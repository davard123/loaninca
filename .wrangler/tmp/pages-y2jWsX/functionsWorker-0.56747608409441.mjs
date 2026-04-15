var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// ../.wrangler/tmp/bundle-a5t0Ud/checked-fetch.js
var urls = /* @__PURE__ */ new Set();
function checkURL(request, init) {
  const url = request instanceof URL ? request : new URL(
    (typeof request === "string" ? new Request(request, init) : request).url
  );
  if (url.port && url.port !== "443" && url.protocol === "https:") {
    if (!urls.has(url.toString())) {
      urls.add(url.toString());
      console.warn(
        `WARNING: known issue with \`fetch()\` requests to custom HTTPS ports in published Workers:
 - ${url.toString()} - the custom port will be ignored when the Worker is published using the \`wrangler deploy\` command.
`
      );
    }
  }
}
__name(checkURL, "checkURL");
globalThis.fetch = new Proxy(globalThis.fetch, {
  apply(target, thisArg, argArray) {
    const [request, init] = argArray;
    checkURL(request, init);
    return Reflect.apply(target, thisArg, argArray);
  }
});

// api/[[path]].js
async function onRequestPost({ request, env, waitUntil }) {
  const url = new URL(request.url);
  const path = url.pathname.split("/").filter(Boolean);
  try {
    const data = await request.json();
    if (path[1] === "fed-rates" && path[2] === "update") {
      const rates = await fetchFederalReserveRates();
      for (const rate of rates) {
        const existing = await env.DB.prepare("SELECT * FROM federal_reserve_rates WHERE rate_type = ? ORDER BY last_updated DESC LIMIT 1").bind(rate.rate_type).first();
        if (!existing || existing.rate_value !== rate.rate_value || existing.change !== rate.change) {
          const id = "fed-" + rate.rate_type + "-" + Date.now();
          await env.DB.prepare(`
            INSERT INTO federal_reserve_rates (id, rate_type, rate_value, previous_value, change, change_percent, last_updated, effective_date, source_url, notes)
            VALUES (?, ?, ?, ?, ?, ?, datetime('now'), ?, ?, ?)
          `).bind(id, rate.rate_type, rate.rate_value, rate.previous_value, rate.change, rate.change_percent, rate.effective_date, rate.source_url, rate.notes).run();
          if (existing && Math.abs(rate.change) >= 0.25) {
            await createRateNews(env, rate);
          }
        }
      }
      return Response.json({ success: true, updated: rates.length });
    }
    if (path[1] === "leads") {
      const id = "lead-" + Date.now() + "-" + Math.random().toString(36).substr(2, 9);
      await env.DB.prepare(`
        INSERT INTO leads (id, name, phone, email, inquiry_type, loan_amount, note, source_url, utm_source, utm_medium, utm_campaign, status, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'new', datetime('now'))
      `).bind(
        id,
        data.name || "",
        data.phone || "",
        data.email || "",
        data.inquiry_type || "",
        data.loan_amount || "",
        data.note || "",
        data.source_url || "",
        data.utm_source || "",
        data.utm_medium || "",
        data.utm_campaign || ""
      ).run();
      const leadData = {
        name: data.name || "\u672A\u63D0\u4F9B",
        phone: data.phone || "\u672A\u63D0\u4F9B",
        email: data.email || "\u672A\u63D0\u4F9B",
        inquiry_type: data.inquiry_type || "\u672A\u6307\u5B9A",
        loan_amount: data.loan_amount || "\u672A\u63D0\u4F9B",
        note: data.note || "\u65E0"
      };
      const telegramMsg = `\u{1F389} \u65B0\u5BA2\u6237\u54A8\u8BE2

\u59D3\u540D\uFF1A${leadData.name}
\u7535\u8BDD\uFF1A${leadData.phone}
\u90AE\u7BB1\uFF1A${leadData.email}
\u54A8\u8BE2\u7C7B\u578B\uFF1A${leadData.inquiry_type}
\u8D37\u6B3E\u91D1\u989D\uFF1A${leadData.loan_amount}
\u5907\u6CE8\uFF1A${leadData.note}

\u63D0\u4EA4\u65F6\u95F4\uFF1A${(/* @__PURE__ */ new Date()).toLocaleString("zh-CN")}
\u6765\u6E90\uFF1A${data.source_url || "\u672A\u77E5"}`;
      const sendTelegram = /* @__PURE__ */ __name(async () => {
        try {
          if (env.TELEGRAM_BOT_TOKEN && env.TELEGRAM_CHAT_ID) {
            const tgRes = await fetch(
              `https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`,
              {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  chat_id: env.TELEGRAM_CHAT_ID,
                  text: telegramMsg
                })
              }
            );
            const tgData = await tgRes.json();
            if (tgRes.ok) {
              console.log("Telegram notification sent:", tgData.result?.message_id);
            } else {
              console.error("Telegram API error:", tgData);
            }
          } else {
            console.log("Telegram not configured. Has token:", !!env.TELEGRAM_BOT_TOKEN, "Has chat ID:", !!env.TELEGRAM_CHAT_ID);
          }
        } catch (tgErr) {
          console.error("Telegram send failed:", tgErr.message);
        }
      }, "sendTelegram");
      if (waitUntil) {
        waitUntil(sendTelegram());
      } else {
        await sendTelegram();
      }
      return Response.json({ success: true, id });
    }
    if (path[1] === "visits") {
      const id = "visit-" + Date.now() + "-" + Math.random().toString(36).substr(2, 9);
      await env.DB.prepare(`
        INSERT INTO visits (id, page, referrer, user_agent, utm_source, utm_medium, utm_campaign, ip_hash, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
      `).bind(
        id,
        data.page,
        data.referrer || "",
        data.userAgent || "",
        data.utm_source || "",
        data.utm_medium || "",
        data.utm_campaign || "",
        data.ipHash || ""
      ).run();
      return Response.json({ success: true });
    }
    if (path[1] === "analytics") {
      const id = "analytics-" + Date.now() + "-" + Math.random().toString(36).substr(2, 9);
      await env.DB.prepare(`
        INSERT INTO calculator_analytics (id, calculator_type, input_data, result_data, session_id, utm_source, utm_medium, utm_campaign, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
      `).bind(
        id,
        data.calculator_type,
        JSON.stringify(data.input_data || {}),
        JSON.stringify(data.result_data || {}),
        data.session_id || "",
        data.utm_source || "",
        data.utm_medium || "",
        data.utm_campaign || ""
      ).run();
      return Response.json({ success: true });
    }
    return Response.json({ error: "Unknown endpoint" }, { status: 404 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
__name(onRequestPost, "onRequestPost");
async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const path = url.pathname.split("/").filter(Boolean);
  try {
    if (path[1] === "fed-rates") {
      const { results } = await env.DB.prepare("SELECT * FROM federal_reserve_rates ORDER BY last_updated DESC").all();
      return Response.json(results);
    }
    if (path[1] === "daily-rates") {
      const { results } = await env.DB.prepare("SELECT * FROM daily_rates ORDER BY display_order").all();
      const latestDate = results.length > 0 ? results[0].effective_date : null;
      return Response.json({
        success: true,
        effective_date: latestDate,
        rates: results
      });
    }
    if (path[1] === "test-telegram") {
      const hasToken = !!env.TELEGRAM_BOT_TOKEN;
      const hasChatId = !!env.TELEGRAM_CHAT_ID;
      const tokenPreview = env.TELEGRAM_BOT_TOKEN ? env.TELEGRAM_BOT_TOKEN.substring(0, 15) + "..." : "none";
      let testResult = "not attempted";
      if (hasToken && hasChatId) {
        try {
          const tgRes = await fetch(
            `https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                chat_id: env.TELEGRAM_CHAT_ID,
                text: "\u2705 NDF Lending Telegram \u6D4B\u8BD5\u6D88\u606F - " + (/* @__PURE__ */ new Date()).toLocaleString("zh-CN")
              })
            }
          );
          const tgData = await tgRes.json();
          testResult = tgRes.ok ? "sent (message_id: " + (tgData.result?.message_id || "unknown") + ")" : "error: " + JSON.stringify(tgData);
        } catch (e) {
          testResult = "exception: " + e.message;
        }
      }
      return Response.json({
        success: true,
        hasToken,
        hasChatId,
        tokenPreview,
        chatId: env.TELEGRAM_CHAT_ID || "none",
        testResult
      });
    }
    if (path[1] === "debug") {
      return Response.json({
        hasTelegramToken: !!env.TELEGRAM_BOT_TOKEN,
        hasChatId: !!env.TELEGRAM_CHAT_ID,
        tokenPrefix: env.TELEGRAM_BOT_TOKEN ? env.TELEGRAM_BOT_TOKEN.substring(0, 10) + "..." : "none",
        chatId: env.TELEGRAM_CHAT_ID || "none"
      });
    }
    if (path[1] === "leads") {
      const { results } = await env.DB.prepare("SELECT * FROM leads ORDER BY created_at DESC").all();
      return Response.json(results);
    }
    if (path[1] === "visits") {
      const { results } = await env.DB.prepare("SELECT * FROM visits ORDER BY created_at DESC LIMIT 1000").all();
      return Response.json(results);
    }
    if (path[1] === "news") {
      const { results } = await env.DB.prepare("SELECT * FROM news ORDER BY published_at DESC").all();
      return Response.json(results);
    }
    if (path[1] === "knowledge") {
      const { results } = await env.DB.prepare("SELECT * FROM loan_knowledge ORDER BY created_at DESC").all();
      return Response.json(results);
    }
    if (path[1] === "analytics") {
      const { results } = await env.DB.prepare(`
        SELECT calculator_type, COUNT(*) as usage_count, DATE(created_at) as date
        FROM calculator_analytics
        GROUP BY calculator_type, DATE(created_at)
        ORDER BY date DESC LIMIT 30
      `).all();
      return Response.json(results);
    }
    return Response.json({ error: "Unknown endpoint" }, { status: 404 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
__name(onRequestGet, "onRequestGet");
async function onRequestPut({ request, env }) {
  const url = new URL(request.url);
  const path = url.pathname.split("/").filter(Boolean);
  const id = path[2];
  try {
    const data = await request.json();
    if (path[1] === "leads" && id) {
      await env.DB.prepare(`
        UPDATE leads SET status = ?, internal_note = ?, updated_at = datetime('now') WHERE id = ?
      `).bind(data.status, data.internal_note, id).run();
      return Response.json({ success: true });
    }
    if (path[1] === "news" && id) {
      await env.DB.prepare(`
        UPDATE news SET title = ?, title_en = ?, content = ?, content_en = ?, category = ?, is_published = ?, updated_at = datetime('now') WHERE id = ?
      `).bind(data.title, data.title_en, data.content, data.content_en, data.category, data.is_published ? 1 : 0, id).run();
      return Response.json({ success: true });
    }
    if (path[1] === "knowledge" && id) {
      await env.DB.prepare(`
        UPDATE loan_knowledge SET title = ?, title_en = ?, content = ?, content_en = ?, category = ?, tags = ?, is_published = ?, updated_at = datetime('now') WHERE id = ?
      `).bind(data.title, data.title_en, data.content, data.content_en, data.category, data.tags, data.is_published ? 1 : 0, id).run();
      return Response.json({ success: true });
    }
    return Response.json({ error: "Unknown endpoint" }, { status: 404 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
__name(onRequestPut, "onRequestPut");
async function onRequestDelete({ request, env }) {
  const url = new URL(request.url);
  const path = url.pathname.split("/").filter(Boolean);
  const id = path[2];
  try {
    if (path[1] === "news" && id) {
      await env.DB.prepare("DELETE FROM news WHERE id = ?").bind(id).run();
      return Response.json({ success: true });
    }
    if (path[1] === "knowledge" && id) {
      await env.DB.prepare("DELETE FROM loan_knowledge WHERE id = ?").bind(id).run();
      return Response.json({ success: true });
    }
    return Response.json({ error: "Unknown endpoint" }, { status: 404 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
__name(onRequestDelete, "onRequestDelete");
async function fetchFederalReserveRates() {
  const today = /* @__PURE__ */ new Date();
  const effectiveDate = today.toISOString().split("T")[0];
  const rates = [
    {
      rate_type: "fed_funds_rate",
      rate_value: 4.33,
      previous_value: 4.33,
      change: 0,
      change_percent: 0,
      effective_date: effectiveDate,
      source_url: "https://www.federalreserve.gov",
      notes: "Federal Funds Target Rate Upper Bound"
    },
    {
      rate_type: "mortgage_30yr_fixed",
      rate_value: 6.78,
      previous_value: 6.82,
      change: -0.04,
      change_percent: -0.59,
      effective_date: effectiveDate,
      source_url: "https://freddiemac.com/pmms",
      notes: "30-Year Fixed Rate Mortgage Average"
    },
    {
      rate_type: "mortgage_15yr_fixed",
      rate_value: 5.95,
      previous_value: 6.01,
      change: -0.06,
      change_percent: -1,
      effective_date: effectiveDate,
      source_url: "https://freddiemac.com/pmms",
      notes: "15-Year Fixed Rate Mortgage Average"
    },
    {
      rate_type: "mortgage_5_1_arm",
      rate_value: 6.12,
      previous_value: 6.18,
      change: -0.06,
      change_percent: -0.97,
      effective_date: effectiveDate,
      source_url: "https://freddiemac.com/pmms",
      notes: "5/1 Adjustable Rate Mortgage Average"
    },
    {
      rate_type: "treasury_10yr",
      rate_value: 4.25,
      previous_value: 4.31,
      change: -0.06,
      change_percent: -1.39,
      effective_date: effectiveDate,
      source_url: "https://treasury.gov",
      notes: "10-Year Treasury Constant Maturity Rate"
    }
  ];
  return rates;
}
__name(fetchFederalReserveRates, "fetchFederalReserveRates");
async function createRateNews(env, rate) {
  const today = /* @__PURE__ */ new Date();
  const direction = rate.change > 0 ? "\u4E0A\u6DA8" : "\u4E0B\u964D";
  const newsId = "news-fed-" + Date.now();
  let title = "";
  let content = "";
  if (rate.rate_type === "fed_funds_rate") {
    title = `\u7F8E\u8054\u50A8\u5229\u7387${direction}${Math.abs(rate.change)}\u4E2A\u57FA\u70B9 - ${today.toLocaleDateString("zh-CN")}`;
    content = `\u8054\u90A6\u57FA\u91D1\u5229\u7387${direction}${Math.abs(rate.change)}\u4E2A\u57FA\u70B9\uFF0C\u4ECE${rate.previous_value}%\u8C03\u6574\u81F3${rate.rate_value}%\u3002\u8FD9\u662F\u81EA${today.getFullYear()}\u5E74\u4EE5\u6765\u7684\u91CD\u8981\u8C03\u6574\uFF0C\u5C06\u5BF9\u623F\u8D37\u5229\u7387\u548C\u6574\u4F53\u7ECF\u6D4E\u4EA7\u751F\u91CD\u8981\u5F71\u54CD\u3002`;
  } else if (rate.rate_type === "mortgage_30yr_fixed") {
    title = `30 \u5E74\u671F\u623F\u8D37\u5229\u7387${direction}${Math.abs(rate.change)}\u4E2A\u57FA\u70B9 - ${today.toLocaleDateString("zh-CN")}`;
    content = `30 \u5E74\u671F\u56FA\u5B9A\u623F\u8D37\u5229\u7387${direction}${Math.abs(rate.change)}\u4E2A\u57FA\u70B9\uFF0C\u4ECE${rate.previous_value}%\u8C03\u6574\u81F3${rate.rate_value}%\u3002\u5BF9\u4E8E$500,000 \u8D37\u6B3E\uFF0C\u6708\u4F9B\u5C06${rate.change > 0 ? "\u589E\u52A0" : "\u51CF\u5C11"}\u7EA6$${Math.abs(Math.round(rate.change * 5e3 / 12))}\u3002`;
  }
  if (title) {
    await env.DB.prepare(`
      INSERT INTO news (id, title, title_en, content, content_en, category, is_published, published_at, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, 'news', 1, datetime('now'), datetime('now'), datetime('now'))
    `).bind(
      newsId,
      title,
      `Fed Rate ${direction} by ${Math.abs(rate.change)}bps - ${today.toLocaleDateString("en-US")}`,
      content,
      content
    ).run();
  }
}
__name(createRateNews, "createRateNews");

// ../.wrangler/tmp/pages-y2jWsX/functionsRoutes-0.2413881254734257.mjs
var routes = [
  {
    routePath: "/api/:path*",
    mountPath: "/api",
    method: "DELETE",
    middlewares: [],
    modules: [onRequestDelete]
  },
  {
    routePath: "/api/:path*",
    mountPath: "/api",
    method: "GET",
    middlewares: [],
    modules: [onRequestGet]
  },
  {
    routePath: "/api/:path*",
    mountPath: "/api",
    method: "POST",
    middlewares: [],
    modules: [onRequestPost]
  },
  {
    routePath: "/api/:path*",
    mountPath: "/api",
    method: "PUT",
    middlewares: [],
    modules: [onRequestPut]
  }
];

// ../../../.nvm/versions/node/v24.14.1/lib/node_modules/wrangler/node_modules/path-to-regexp/dist.es2015/index.js
function lexer(str) {
  var tokens = [];
  var i = 0;
  while (i < str.length) {
    var char = str[i];
    if (char === "*" || char === "+" || char === "?") {
      tokens.push({ type: "MODIFIER", index: i, value: str[i++] });
      continue;
    }
    if (char === "\\") {
      tokens.push({ type: "ESCAPED_CHAR", index: i++, value: str[i++] });
      continue;
    }
    if (char === "{") {
      tokens.push({ type: "OPEN", index: i, value: str[i++] });
      continue;
    }
    if (char === "}") {
      tokens.push({ type: "CLOSE", index: i, value: str[i++] });
      continue;
    }
    if (char === ":") {
      var name = "";
      var j = i + 1;
      while (j < str.length) {
        var code = str.charCodeAt(j);
        if (
          // `0-9`
          code >= 48 && code <= 57 || // `A-Z`
          code >= 65 && code <= 90 || // `a-z`
          code >= 97 && code <= 122 || // `_`
          code === 95
        ) {
          name += str[j++];
          continue;
        }
        break;
      }
      if (!name)
        throw new TypeError("Missing parameter name at ".concat(i));
      tokens.push({ type: "NAME", index: i, value: name });
      i = j;
      continue;
    }
    if (char === "(") {
      var count = 1;
      var pattern = "";
      var j = i + 1;
      if (str[j] === "?") {
        throw new TypeError('Pattern cannot start with "?" at '.concat(j));
      }
      while (j < str.length) {
        if (str[j] === "\\") {
          pattern += str[j++] + str[j++];
          continue;
        }
        if (str[j] === ")") {
          count--;
          if (count === 0) {
            j++;
            break;
          }
        } else if (str[j] === "(") {
          count++;
          if (str[j + 1] !== "?") {
            throw new TypeError("Capturing groups are not allowed at ".concat(j));
          }
        }
        pattern += str[j++];
      }
      if (count)
        throw new TypeError("Unbalanced pattern at ".concat(i));
      if (!pattern)
        throw new TypeError("Missing pattern at ".concat(i));
      tokens.push({ type: "PATTERN", index: i, value: pattern });
      i = j;
      continue;
    }
    tokens.push({ type: "CHAR", index: i, value: str[i++] });
  }
  tokens.push({ type: "END", index: i, value: "" });
  return tokens;
}
__name(lexer, "lexer");
function parse(str, options) {
  if (options === void 0) {
    options = {};
  }
  var tokens = lexer(str);
  var _a = options.prefixes, prefixes = _a === void 0 ? "./" : _a, _b = options.delimiter, delimiter = _b === void 0 ? "/#?" : _b;
  var result = [];
  var key = 0;
  var i = 0;
  var path = "";
  var tryConsume = /* @__PURE__ */ __name(function(type) {
    if (i < tokens.length && tokens[i].type === type)
      return tokens[i++].value;
  }, "tryConsume");
  var mustConsume = /* @__PURE__ */ __name(function(type) {
    var value2 = tryConsume(type);
    if (value2 !== void 0)
      return value2;
    var _a2 = tokens[i], nextType = _a2.type, index = _a2.index;
    throw new TypeError("Unexpected ".concat(nextType, " at ").concat(index, ", expected ").concat(type));
  }, "mustConsume");
  var consumeText = /* @__PURE__ */ __name(function() {
    var result2 = "";
    var value2;
    while (value2 = tryConsume("CHAR") || tryConsume("ESCAPED_CHAR")) {
      result2 += value2;
    }
    return result2;
  }, "consumeText");
  var isSafe = /* @__PURE__ */ __name(function(value2) {
    for (var _i = 0, delimiter_1 = delimiter; _i < delimiter_1.length; _i++) {
      var char2 = delimiter_1[_i];
      if (value2.indexOf(char2) > -1)
        return true;
    }
    return false;
  }, "isSafe");
  var safePattern = /* @__PURE__ */ __name(function(prefix2) {
    var prev = result[result.length - 1];
    var prevText = prefix2 || (prev && typeof prev === "string" ? prev : "");
    if (prev && !prevText) {
      throw new TypeError('Must have text between two parameters, missing text after "'.concat(prev.name, '"'));
    }
    if (!prevText || isSafe(prevText))
      return "[^".concat(escapeString(delimiter), "]+?");
    return "(?:(?!".concat(escapeString(prevText), ")[^").concat(escapeString(delimiter), "])+?");
  }, "safePattern");
  while (i < tokens.length) {
    var char = tryConsume("CHAR");
    var name = tryConsume("NAME");
    var pattern = tryConsume("PATTERN");
    if (name || pattern) {
      var prefix = char || "";
      if (prefixes.indexOf(prefix) === -1) {
        path += prefix;
        prefix = "";
      }
      if (path) {
        result.push(path);
        path = "";
      }
      result.push({
        name: name || key++,
        prefix,
        suffix: "",
        pattern: pattern || safePattern(prefix),
        modifier: tryConsume("MODIFIER") || ""
      });
      continue;
    }
    var value = char || tryConsume("ESCAPED_CHAR");
    if (value) {
      path += value;
      continue;
    }
    if (path) {
      result.push(path);
      path = "";
    }
    var open = tryConsume("OPEN");
    if (open) {
      var prefix = consumeText();
      var name_1 = tryConsume("NAME") || "";
      var pattern_1 = tryConsume("PATTERN") || "";
      var suffix = consumeText();
      mustConsume("CLOSE");
      result.push({
        name: name_1 || (pattern_1 ? key++ : ""),
        pattern: name_1 && !pattern_1 ? safePattern(prefix) : pattern_1,
        prefix,
        suffix,
        modifier: tryConsume("MODIFIER") || ""
      });
      continue;
    }
    mustConsume("END");
  }
  return result;
}
__name(parse, "parse");
function match(str, options) {
  var keys = [];
  var re = pathToRegexp(str, keys, options);
  return regexpToFunction(re, keys, options);
}
__name(match, "match");
function regexpToFunction(re, keys, options) {
  if (options === void 0) {
    options = {};
  }
  var _a = options.decode, decode = _a === void 0 ? function(x) {
    return x;
  } : _a;
  return function(pathname) {
    var m = re.exec(pathname);
    if (!m)
      return false;
    var path = m[0], index = m.index;
    var params = /* @__PURE__ */ Object.create(null);
    var _loop_1 = /* @__PURE__ */ __name(function(i2) {
      if (m[i2] === void 0)
        return "continue";
      var key = keys[i2 - 1];
      if (key.modifier === "*" || key.modifier === "+") {
        params[key.name] = m[i2].split(key.prefix + key.suffix).map(function(value) {
          return decode(value, key);
        });
      } else {
        params[key.name] = decode(m[i2], key);
      }
    }, "_loop_1");
    for (var i = 1; i < m.length; i++) {
      _loop_1(i);
    }
    return { path, index, params };
  };
}
__name(regexpToFunction, "regexpToFunction");
function escapeString(str) {
  return str.replace(/([.+*?=^!:${}()[\]|/\\])/g, "\\$1");
}
__name(escapeString, "escapeString");
function flags(options) {
  return options && options.sensitive ? "" : "i";
}
__name(flags, "flags");
function regexpToRegexp(path, keys) {
  if (!keys)
    return path;
  var groupsRegex = /\((?:\?<(.*?)>)?(?!\?)/g;
  var index = 0;
  var execResult = groupsRegex.exec(path.source);
  while (execResult) {
    keys.push({
      // Use parenthesized substring match if available, index otherwise
      name: execResult[1] || index++,
      prefix: "",
      suffix: "",
      modifier: "",
      pattern: ""
    });
    execResult = groupsRegex.exec(path.source);
  }
  return path;
}
__name(regexpToRegexp, "regexpToRegexp");
function arrayToRegexp(paths, keys, options) {
  var parts = paths.map(function(path) {
    return pathToRegexp(path, keys, options).source;
  });
  return new RegExp("(?:".concat(parts.join("|"), ")"), flags(options));
}
__name(arrayToRegexp, "arrayToRegexp");
function stringToRegexp(path, keys, options) {
  return tokensToRegexp(parse(path, options), keys, options);
}
__name(stringToRegexp, "stringToRegexp");
function tokensToRegexp(tokens, keys, options) {
  if (options === void 0) {
    options = {};
  }
  var _a = options.strict, strict = _a === void 0 ? false : _a, _b = options.start, start = _b === void 0 ? true : _b, _c = options.end, end = _c === void 0 ? true : _c, _d = options.encode, encode = _d === void 0 ? function(x) {
    return x;
  } : _d, _e = options.delimiter, delimiter = _e === void 0 ? "/#?" : _e, _f = options.endsWith, endsWith = _f === void 0 ? "" : _f;
  var endsWithRe = "[".concat(escapeString(endsWith), "]|$");
  var delimiterRe = "[".concat(escapeString(delimiter), "]");
  var route = start ? "^" : "";
  for (var _i = 0, tokens_1 = tokens; _i < tokens_1.length; _i++) {
    var token = tokens_1[_i];
    if (typeof token === "string") {
      route += escapeString(encode(token));
    } else {
      var prefix = escapeString(encode(token.prefix));
      var suffix = escapeString(encode(token.suffix));
      if (token.pattern) {
        if (keys)
          keys.push(token);
        if (prefix || suffix) {
          if (token.modifier === "+" || token.modifier === "*") {
            var mod = token.modifier === "*" ? "?" : "";
            route += "(?:".concat(prefix, "((?:").concat(token.pattern, ")(?:").concat(suffix).concat(prefix, "(?:").concat(token.pattern, "))*)").concat(suffix, ")").concat(mod);
          } else {
            route += "(?:".concat(prefix, "(").concat(token.pattern, ")").concat(suffix, ")").concat(token.modifier);
          }
        } else {
          if (token.modifier === "+" || token.modifier === "*") {
            throw new TypeError('Can not repeat "'.concat(token.name, '" without a prefix and suffix'));
          }
          route += "(".concat(token.pattern, ")").concat(token.modifier);
        }
      } else {
        route += "(?:".concat(prefix).concat(suffix, ")").concat(token.modifier);
      }
    }
  }
  if (end) {
    if (!strict)
      route += "".concat(delimiterRe, "?");
    route += !options.endsWith ? "$" : "(?=".concat(endsWithRe, ")");
  } else {
    var endToken = tokens[tokens.length - 1];
    var isEndDelimited = typeof endToken === "string" ? delimiterRe.indexOf(endToken[endToken.length - 1]) > -1 : endToken === void 0;
    if (!strict) {
      route += "(?:".concat(delimiterRe, "(?=").concat(endsWithRe, "))?");
    }
    if (!isEndDelimited) {
      route += "(?=".concat(delimiterRe, "|").concat(endsWithRe, ")");
    }
  }
  return new RegExp(route, flags(options));
}
__name(tokensToRegexp, "tokensToRegexp");
function pathToRegexp(path, keys, options) {
  if (path instanceof RegExp)
    return regexpToRegexp(path, keys);
  if (Array.isArray(path))
    return arrayToRegexp(path, keys, options);
  return stringToRegexp(path, keys, options);
}
__name(pathToRegexp, "pathToRegexp");

// ../../../.nvm/versions/node/v24.14.1/lib/node_modules/wrangler/templates/pages-template-worker.ts
var escapeRegex = /[.+?^${}()|[\]\\]/g;
function* executeRequest(request) {
  const requestPath = new URL(request.url).pathname;
  for (const route of [...routes].reverse()) {
    if (route.method && route.method !== request.method) {
      continue;
    }
    const routeMatcher = match(route.routePath.replace(escapeRegex, "\\$&"), {
      end: false
    });
    const mountMatcher = match(route.mountPath.replace(escapeRegex, "\\$&"), {
      end: false
    });
    const matchResult = routeMatcher(requestPath);
    const mountMatchResult = mountMatcher(requestPath);
    if (matchResult && mountMatchResult) {
      for (const handler of route.middlewares.flat()) {
        yield {
          handler,
          params: matchResult.params,
          path: mountMatchResult.path
        };
      }
    }
  }
  for (const route of routes) {
    if (route.method && route.method !== request.method) {
      continue;
    }
    const routeMatcher = match(route.routePath.replace(escapeRegex, "\\$&"), {
      end: true
    });
    const mountMatcher = match(route.mountPath.replace(escapeRegex, "\\$&"), {
      end: false
    });
    const matchResult = routeMatcher(requestPath);
    const mountMatchResult = mountMatcher(requestPath);
    if (matchResult && mountMatchResult && route.modules.length) {
      for (const handler of route.modules.flat()) {
        yield {
          handler,
          params: matchResult.params,
          path: matchResult.path
        };
      }
      break;
    }
  }
}
__name(executeRequest, "executeRequest");
var pages_template_worker_default = {
  async fetch(originalRequest, env, workerContext) {
    let request = originalRequest;
    const handlerIterator = executeRequest(request);
    let data = {};
    let isFailOpen = false;
    const next = /* @__PURE__ */ __name(async (input, init) => {
      if (input !== void 0) {
        let url = input;
        if (typeof input === "string") {
          url = new URL(input, request.url).toString();
        }
        request = new Request(url, init);
      }
      const result = handlerIterator.next();
      if (result.done === false) {
        const { handler, params, path } = result.value;
        const context = {
          request: new Request(request.clone()),
          functionPath: path,
          next,
          params,
          get data() {
            return data;
          },
          set data(value) {
            if (typeof value !== "object" || value === null) {
              throw new Error("context.data must be an object");
            }
            data = value;
          },
          env,
          waitUntil: workerContext.waitUntil.bind(workerContext),
          passThroughOnException: /* @__PURE__ */ __name(() => {
            isFailOpen = true;
          }, "passThroughOnException")
        };
        const response = await handler(context);
        if (!(response instanceof Response)) {
          throw new Error("Your Pages function should return a Response");
        }
        return cloneResponse(response);
      } else if ("ASSETS") {
        const response = await env["ASSETS"].fetch(request);
        return cloneResponse(response);
      } else {
        const response = await fetch(request);
        return cloneResponse(response);
      }
    }, "next");
    try {
      return await next();
    } catch (error) {
      if (isFailOpen) {
        const response = await env["ASSETS"].fetch(request);
        return cloneResponse(response);
      }
      throw error;
    }
  }
};
var cloneResponse = /* @__PURE__ */ __name((response) => (
  // https://fetch.spec.whatwg.org/#null-body-status
  new Response(
    [101, 204, 205, 304].includes(response.status) ? null : response.body,
    response
  )
), "cloneResponse");

// ../../../.nvm/versions/node/v24.14.1/lib/node_modules/wrangler/templates/middleware/middleware-ensure-req-body-drained.ts
var drainBody = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } finally {
    try {
      if (request.body !== null && !request.bodyUsed) {
        const reader = request.body.getReader();
        while (!(await reader.read()).done) {
        }
      }
    } catch (e) {
      console.error("Failed to drain the unused request body.", e);
    }
  }
}, "drainBody");
var middleware_ensure_req_body_drained_default = drainBody;

// ../../../.nvm/versions/node/v24.14.1/lib/node_modules/wrangler/templates/middleware/middleware-miniflare3-json-error.ts
function reduceError(e) {
  return {
    name: e?.name,
    message: e?.message ?? String(e),
    stack: e?.stack,
    cause: e?.cause === void 0 ? void 0 : reduceError(e.cause)
  };
}
__name(reduceError, "reduceError");
var jsonError = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } catch (e) {
    const error = reduceError(e);
    return Response.json(error, {
      status: 500,
      headers: { "MF-Experimental-Error-Stack": "true" }
    });
  }
}, "jsonError");
var middleware_miniflare3_json_error_default = jsonError;

// ../.wrangler/tmp/bundle-a5t0Ud/middleware-insertion-facade.js
var __INTERNAL_WRANGLER_MIDDLEWARE__ = [
  middleware_ensure_req_body_drained_default,
  middleware_miniflare3_json_error_default
];
var middleware_insertion_facade_default = pages_template_worker_default;

// ../../../.nvm/versions/node/v24.14.1/lib/node_modules/wrangler/templates/middleware/common.ts
var __facade_middleware__ = [];
function __facade_register__(...args) {
  __facade_middleware__.push(...args.flat());
}
__name(__facade_register__, "__facade_register__");
function __facade_invokeChain__(request, env, ctx, dispatch, middlewareChain) {
  const [head, ...tail] = middlewareChain;
  const middlewareCtx = {
    dispatch,
    next(newRequest, newEnv) {
      return __facade_invokeChain__(newRequest, newEnv, ctx, dispatch, tail);
    }
  };
  return head(request, env, ctx, middlewareCtx);
}
__name(__facade_invokeChain__, "__facade_invokeChain__");
function __facade_invoke__(request, env, ctx, dispatch, finalMiddleware) {
  return __facade_invokeChain__(request, env, ctx, dispatch, [
    ...__facade_middleware__,
    finalMiddleware
  ]);
}
__name(__facade_invoke__, "__facade_invoke__");

// ../.wrangler/tmp/bundle-a5t0Ud/middleware-loader.entry.ts
var __Facade_ScheduledController__ = class ___Facade_ScheduledController__ {
  constructor(scheduledTime, cron, noRetry) {
    this.scheduledTime = scheduledTime;
    this.cron = cron;
    this.#noRetry = noRetry;
  }
  static {
    __name(this, "__Facade_ScheduledController__");
  }
  #noRetry;
  noRetry() {
    if (!(this instanceof ___Facade_ScheduledController__)) {
      throw new TypeError("Illegal invocation");
    }
    this.#noRetry();
  }
};
function wrapExportedHandler(worker) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return worker;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  const fetchDispatcher = /* @__PURE__ */ __name(function(request, env, ctx) {
    if (worker.fetch === void 0) {
      throw new Error("Handler does not export a fetch() function.");
    }
    return worker.fetch(request, env, ctx);
  }, "fetchDispatcher");
  return {
    ...worker,
    fetch(request, env, ctx) {
      const dispatcher = /* @__PURE__ */ __name(function(type, init) {
        if (type === "scheduled" && worker.scheduled !== void 0) {
          const controller = new __Facade_ScheduledController__(
            Date.now(),
            init.cron ?? "",
            () => {
            }
          );
          return worker.scheduled(controller, env, ctx);
        }
      }, "dispatcher");
      return __facade_invoke__(request, env, ctx, dispatcher, fetchDispatcher);
    }
  };
}
__name(wrapExportedHandler, "wrapExportedHandler");
function wrapWorkerEntrypoint(klass) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return klass;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  return class extends klass {
    #fetchDispatcher = /* @__PURE__ */ __name((request, env, ctx) => {
      this.env = env;
      this.ctx = ctx;
      if (super.fetch === void 0) {
        throw new Error("Entrypoint class does not define a fetch() function.");
      }
      return super.fetch(request);
    }, "#fetchDispatcher");
    #dispatcher = /* @__PURE__ */ __name((type, init) => {
      if (type === "scheduled" && super.scheduled !== void 0) {
        const controller = new __Facade_ScheduledController__(
          Date.now(),
          init.cron ?? "",
          () => {
          }
        );
        return super.scheduled(controller);
      }
    }, "#dispatcher");
    fetch(request) {
      return __facade_invoke__(
        request,
        this.env,
        this.ctx,
        this.#dispatcher,
        this.#fetchDispatcher
      );
    }
  };
}
__name(wrapWorkerEntrypoint, "wrapWorkerEntrypoint");
var WRAPPED_ENTRY;
if (typeof middleware_insertion_facade_default === "object") {
  WRAPPED_ENTRY = wrapExportedHandler(middleware_insertion_facade_default);
} else if (typeof middleware_insertion_facade_default === "function") {
  WRAPPED_ENTRY = wrapWorkerEntrypoint(middleware_insertion_facade_default);
}
var middleware_loader_entry_default = WRAPPED_ENTRY;
export {
  __INTERNAL_WRANGLER_MIDDLEWARE__,
  middleware_loader_entry_default as default
};
//# sourceMappingURL=functionsWorker-0.56747608409441.mjs.map
