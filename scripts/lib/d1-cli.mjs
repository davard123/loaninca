// 用本机已登录的 wrangler 直接查线上 D1（ndf-lending-db），给周报用。
//
// 做成和 Cloudflare 的 D1 绑定一样的接口（prepare → bind → all / first），
// 这样周报可以直接复用 functions/api/geo-utils.mjs 里的 loadGeoReportData：
// SQL、字段、脱敏规则都和 /api/geo-report 一模一样。
//
// 只读：除 SELECT 以外的语句一律拒绝，不会发出去。

import path from 'node:path';
import fs from 'node:fs';
import { execFile } from 'node:child_process';

export const DEFAULT_DATABASE = 'ndf-lending-db';

// 只放行单条 SELECT（可带 WITH）。注释、分号后再跟语句、写入关键字都拒绝。
export function assertReadOnly(sql) {
  const text = String(sql ?? '').trim();
  if (!/^(select|with)\b/i.test(text)) throw new Error('只允许 SELECT 查询。');
  if (/--|\/\*/.test(text)) throw new Error('查询里不允许带注释。');
  if (/;\s*\S/.test(text.replace(/'(?:[^']|'')*'/g, "''"))) throw new Error('一次只允许一条查询。');
  const bare = text.replace(/'(?:[^']|'')*'/g, "''");
  if (/\b(insert|update|delete|replace|drop|alter|create|attach|detach|pragma|vacuum|reindex)\b/i.test(bare)) {
    throw new Error('查询里出现了写入类关键字，已拒绝。');
  }
  return text;
}

// wrangler d1 execute --command 不支持参数绑定，只能把值写进 SQL 里。
// 这里的值都是脚本自己算出来的日期和固定的事件名，仍然按 SQL 规则转义。
export function sqlLiteral(value) {
  if (value === null || value === undefined) return 'NULL';
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) throw new Error('数字参数不合法。');
    return String(value);
  }
  if (typeof value === 'boolean') return value ? '1' : '0';
  return `'${String(value).replace(/'/g, "''")}'`;
}

export function inlineParams(sql, params = []) {
  let index = 0;
  const out = String(sql).replace(/'(?:[^']|'')*'|\?/g, (match) => {
    if (match !== '?') return match;
    if (index >= params.length) throw new Error('SQL 参数个数不够。');
    return sqlLiteral(params[index++]);
  });
  if (index !== params.length) throw new Error('SQL 参数个数多了。');
  return out;
}

// 把 wrangler --json 的输出解析成结果行；出错时给出一句人能看懂的原因。
export function parseWranglerOutput(stdout) {
  const text = String(stdout ?? '').trim();
  const start = text.search(/^[[{]/m);
  if (start < 0) throw new Error('wrangler 没有返回 JSON。');
  let parsed;
  try { parsed = JSON.parse(text.slice(start)); } catch { throw new Error('wrangler 返回的 JSON 读不了。'); }
  if (parsed && !Array.isArray(parsed) && parsed.error) {
    const notes = (parsed.error.notes || []).map((note) => note?.text).filter(Boolean).join('；');
    throw new Error(notes || parsed.error.text || 'wrangler 报错。');
  }
  const block = Array.isArray(parsed) ? parsed[0] : parsed;
  if (!block || block.success === false) throw new Error('D1 查询没有成功。');
  return Array.isArray(block.results) ? block.results : [];
}

// 找 npx：Windows 上不能直接 spawn npx.cmd，改用 node 自带的 npx-cli.js。
function npxCommand() {
  const cli = path.join(path.dirname(process.execPath), 'node_modules', 'npm', 'bin', 'npx-cli.js');
  if (fs.existsSync(cli)) return { file: process.execPath, prefix: [cli] };
  return { file: 'npx', prefix: [] };
}

export function runWrangler(database, sql, { cwd = process.cwd() } = {}) {
  const { file, prefix } = npxCommand();
  const args = [...prefix, '--yes', 'wrangler', 'd1', 'execute', database, '--remote', '--json', '--command', sql];
  return new Promise((resolve, reject) => {
    execFile(file, args, { cwd, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, windowsHide: true }, (error, stdout) => {
      if (!error) return resolve(stdout);
      // 失败时 wrangler 也会把错误写成 JSON 放在 stdout，交给 parseWranglerOutput 解读。
      if (stdout && /^[[{]/m.test(stdout)) return resolve(stdout);
      reject(new Error(`调用 wrangler 失败（${error.code ?? '未知错误'}）。请确认本机 wrangler 已登录。`));
    });
  });
}

// 一个只读的“D1 绑定”。run 参数可替换，测试时不用真的调 wrangler。
export function createWranglerDb({ database = DEFAULT_DATABASE, run = runWrangler, cwd } = {}) {
  const query = async (sql, params) => {
    const finalSql = assertReadOnly(inlineParams(sql, params));
    return parseWranglerOutput(await run(database, finalSql, { cwd }));
  };
  return {
    prepare(sql) {
      let params = [];
      const statement = {
        bind(...values) { params = values; return statement; },
        async all() { return { results: await query(sql, params), success: true }; },
        async first() { return (await query(sql, params))[0] ?? null; },
        async run() { throw new Error('只读：不允许执行写入。'); },
      };
      return statement;
    },
    async batch() { throw new Error('只读：不支持 batch。'); },
    async exec() { throw new Error('只读：不支持 exec。'); },
  };
}
