#!/usr/bin/env node
/**
 * Layer 3: IndexNow 提交（Bing/Yandex 秒级收录，非阻塞——失败不阻断流水线）。
 * 用法:
 *   node scripts/indexnow-submit.mjs --host crosstool.online --key KEY --urls "u1 u2"
 *   node scripts/indexnow-submit.mjs --host crosstool.online --key KEY --urls "u1" --quiet
 * 前置：把 KEY 存为 <host>/<KEY>.txt（public/indexnow/<KEY>.txt 或 public/<KEY>.txt，内容=KEY）。
 * 未提供 --key 时静默跳过（未配置 secrets 不报错）。
 */
const args = process.argv.slice(2);
const arg = (n) => { const i = args.indexOf('--' + n); return i >= 0 ? args[i + 1] : undefined; };

const host = arg('host');
const key = arg('key') || process.env.INDEXNOW_KEY;
const urls = (arg('urls') || '').split(/\s+/).filter(Boolean);
const quiet = args.includes('--quiet');

if (!host) { console.error('usage: --host --key --urls'); process.exit(2); }
if (!key || !urls.length) { if (!quiet) console.log('indexnow skipped (no key or urls)'); process.exit(0); }

try {
  const res = await fetch('https://api.indexnow.org/IndexNow', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify({ host, key: key.trim(), urlList: urls }),
  });
  console.log(`indexnow: ${res.status} ${res.status === 200 || res.status === 202 ? '✅' : '(non-blocking)'}`);
} catch (e) {
  if (!quiet) console.error('indexnow failed (non-blocking):', e.message);
}
process.exit(0);
