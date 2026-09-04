#!/usr/bin/env node
/**
 * crosstool 白天时段定时发布器（零 npm 依赖）
 *
 * 机制：02:10 automation 每日把 5 篇写稿存为 content/queue/{日期}-slot-{0..4}.json 并推送到仓库；
 *       GitHub Actions 5 个白天 cron（北京 09/11/14/16/18）各自调用本脚本发布 1 篇对应时段的队列稿。
 *       发布 = 校验通过 → 追加 content/blog.daily.json → 队列文件标记 consumed（Layer 2 一起推回仓库）。
 *       兜底：北京 20:00（UTC 12:00）cron 无参调用本脚本 → 自动进入 catchup 模式，
 *             把当天 5 个 slot 中尚未发布的队列稿全部补发（白天 cron 偶发漏发时兜底）。
 *
 * 用法：
 *   node scripts/publish-queued.mjs                          # 自动：UTC 12→catchup，其余→当前时段 slot
 *   node scripts/publish-queued.mjs --catchup [--date 2026-09-04]   # 显式补发当天全部未发布 slot
 *   node scripts/publish-queued.mjs --date 2026-09-04        # 指定日期（默认今天）
 *   node scripts/publish-queued.mjs --date 2026-09-04 --slot 2
 *   node scripts/publish-queued.mjs --dry-run                # 只读不写盘
 *
 * slot 由当前 UTC 小时推导（与 workflow cron 对齐）：
 *   UTC 01→slot0(北京09)  03→slot1(11)  06→slot2(14)  08→slot3(16)  10→slot4(18)  12→catchup(20:00)
 *
 * 输出 GITHUB_OUTPUT：pushed=1/0, new_url/new_urls, slug, day, slot, queue_file/queue_files, label
 * 退出码：0=成功/无队列稿/跳过  1=校验失败或 catchup 有失败  2=其他错误
 */
import { readFileSync, writeFileSync, existsSync, appendFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const QUEUE_DIR = path.join(ROOT, 'content', 'queue');
const BLOG_TS = path.join(ROOT, 'content', 'blog.ts');
const DAILY = path.join(ROOT, 'content', 'blog.daily.json');
const TOOLS_TS = path.join(ROOT, 'lib', 'tools.ts');
const I18N_TS = path.join(ROOT, 'lib', 'i18n.tsx');

const args = process.argv.slice(2);
const argVal = (name) => { const i = args.indexOf('--' + name); return i >= 0 ? args[i + 1] : null; };
const dryRun = args.includes('--dry-run');

const fail = (msg) => { console.error('❌ ' + msg); process.exit(1); };
const ghOut = (s) => { const gh = process.env.GITHUB_OUTPUT; if (gh) appendFileSync(gh, s + '\n'); };
const now = () => new Date().toTimeString().slice(0, 8);
const rel = (p) => p.replace(ROOT + path.sep, '').replace(/\\/g, '/');

// ---------- 今天日期（Asia/Shanghai） ----------
function todayCN() {
  return new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Shanghai' }).format(new Date());
}

// ---------- 当前 slot（按 UTC 小时推导，与 cron 对齐） ----------
function slotFromNow() {
  const h = new Date().getUTCHours();
  const map = [[1, 0], [3, 1], [6, 2], [8, 3], [10, 4]];
  let best = map[0], bestDist = Infinity;
  for (const [uh, s] of map) { const d = Math.abs(h - uh); if (d < bestDist) { bestDist = d; best = [uh, s]; } }
  return best[1];
}

// 北京 20:00（UTC 12:00）= 当天全部白天时段已过，进入 catchup 兜底
const isCatchupHour = () => new Date().getUTCHours() === 12;

// ---------- 活工具 slug + 中文标题 ----------
function loadLiveTools() {
  const slugs = new Map();
  for (const line of readFileSync(TOOLS_TS, 'utf-8').split('\n')) {
    const s = line.match(/slug: '([a-z0-9-]+)'/);
    const k = line.match(/titleKey: '([A-Za-z]+)'/);
    if (s && k && !/soon: true/.test(line)) slugs.set(s[1], k[1]);
  }
  const keyTitle = new Map();
  for (const line of readFileSync(I18N_TS, 'utf-8').split('\n')) {
    const m = line.match(/^\s{2,}([A-Za-z]+Title):\s*'([^']+)'/);
    if (m && !keyTitle.has(m[1])) keyTitle.set(m[1], m[2]);
  }
  const out = new Map();
  for (const [slug, key] of slugs) if (keyTitle.has(key)) out.set(slug, keyTitle.get(key));
  return out;
}

// ---------- 既有 slug ----------
function existingSlugs() {
  const seen = new Set();
  const ts = readFileSync(BLOG_TS, 'utf-8');
  let m; const re = /slug:\s*'([^']+)'/g;
  while ((m = re.exec(ts)) !== null) seen.add(m[1]);
  try {
    const daily = JSON.parse(readFileSync(DAILY, 'utf-8'));
    if (Array.isArray(daily)) for (const p of daily) if (p?.slug) seen.add(p.slug);
  } catch { /* ignore */ }
  return seen;
}

// ---------- 校验 ----------
function validatePost(post) {
  const errs = [];
  if (!post.slug || !/^[a-z0-9-]+$/.test(post.slug)) errs.push('slug 非法（需 kebab-case 小写）');
  if (!post.title || typeof post.title !== 'string') errs.push('title 缺失');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(post.date || '')) errs.push('date 格式需 YYYY-MM-DD');
  if (!post.category || typeof post.category !== 'string') errs.push('category 缺失');
  if (!post.excerpt || typeof post.excerpt !== 'string' || post.excerpt.length < 20) errs.push('excerpt 过短（≥20字）');
  if (!Array.isArray(post.body) || post.body.length < 3) errs.push('body 至少 3 段');
  else {
    const flat = post.body.map(String).join('');
    if (flat.length < 300) errs.push(`body 正文过短（${flat.length}字，需≥300）`);
  }
  if (!Array.isArray(post.relatedTools) || post.relatedTools.length < 1) errs.push('relatedTools 至少 1 个');
  else {
    const live = loadLiveTools();
    for (const t of post.relatedTools) {
      if (!t || !t.slug || !live.has(t.slug)) errs.push(`relatedTools 含非活工具 slug: ${t?.slug}`);
    }
  }
  return errs;
}

// ---------- 发布单个 slot（返回结果对象，不写 GITHUB_OUTPUT） ----------
function publishOne(date, slot) {
  const qFile = path.join(QUEUE_DIR, `${date}-slot-${slot}.json`);
  if (!existsSync(qFile)) return { status: 'noop', reason: '无队列稿' };
  let q;
  try { q = JSON.parse(readFileSync(qFile, 'utf-8')); }
  catch (e) { return { status: 'error', msg: `队列文件解析失败 ${qFile}: ${e.message}` }; }
  if (q && q.consumed) return { status: 'noop', reason: '已被消费', slug: q.slug };
  if (!q || !q.slug) return { status: 'error', msg: `队列文件缺少 slug: ${qFile}` };
  const has = existingSlugs();
  if (has.has(q.slug)) return { status: 'noop', reason: 'slug 已发布', slug: q.slug };
  const errs = validatePost(q);
  if (errs.length) return { status: 'invalid', errs, slug: q.slug };
  if (dryRun) { console.log(`✅ [dry-run] 校验通过：${q.slug}，未写盘`); return { status: 'dry', slug: q.slug, qFile }; }

  let daily = [];
  try { daily = JSON.parse(readFileSync(DAILY, 'utf-8')); } catch { daily = []; }
  if (!Array.isArray(daily)) daily = [];
  daily.push(q);
  writeFileSync(DAILY, JSON.stringify(daily, null, 2) + '\n', 'utf-8');
  writeFileSync(qFile, JSON.stringify({ consumed: true, slug: q.slug, date, slot }, null, 2) + '\n', 'utf-8');

  return { status: 'published', slug: q.slug, qFile, day: q.day, dailyLen: daily.length, slot };
}

// ---------- 单 slot 发布（保持原行为） ----------
function runSingle(date, slot) {
  if (!(slot >= 0 && slot <= 4)) fail(`slot 需 0-4，收到: ${slot}`);
  const qFile = path.join(QUEUE_DIR, `${date}-slot-${slot}.json`);
  console.log(`[${now()}] date=${date} slot=${slot} queue=${qFile}`);
  const r = publishOne(date, slot);
  if (r.status === 'noop') { console.log(`✅ ${date} slot ${slot} ${r.reason}（${r.slug || '无稿'}），跳过`); ghOut('pushed=0'); return; }
  if (r.status === 'dry') { ghOut('pushed=0'); return; }
  if (r.status === 'invalid') { console.error('❌ 校验失败：'); for (const e of r.errs) console.error('   - ' + e); process.exit(1); }
  if (r.status === 'error') { fail(r.msg); }
  if (r.status === 'published') {
    console.log(`✅ 已发布 ${date} slot ${slot}: ${r.slug} → content/blog.daily.json（日更累计 ${r.dailyLen} 篇）`);
    ghOut('pushed=1');
    ghOut(`new_url=https://crosstool.online/blog/${r.slug}`);
    ghOut(`new_urls=https://crosstool.online/blog/${r.slug}`);
    ghOut(`slug=${r.slug}`);
    ghOut(`day=${r.day || ''}`);
    ghOut(`slot=${slot}`);
    ghOut(`queue_file=${rel(r.qFile)}`);
    ghOut(`queue_files=${rel(r.qFile)}`);
    ghOut(`label=slot ${slot}`);
  }
}

// ---------- catchup：补发当天所有未发布 slot ----------
function runCatchup(date) {
  console.log(`[${now()}] CATCHUP date=${date} —— 补发当天未发布的队列稿`);
  const published = [], invalid = [], errors = [];
  for (let s = 0; s <= 4; s++) {
    const r = publishOne(date, s);
    if (r.status === 'published') { published.push(r); console.log(`✅ 补发 slot ${s}: ${r.slug}`); }
    else if (r.status === 'invalid') { invalid.push(s); console.error(`❌ slot ${s} 校验失败（${r.slug}）：`); for (const e of r.errs) console.error('   - ' + e); }
    else if (r.status === 'error') { errors.push(s); console.error(`❌ slot ${s}: ${r.msg}`); }
    else console.log(`- slot ${s}: ${r.reason}${r.slug ? '（' + r.slug + '）' : ''}`);
  }
  if (published.length) {
    ghOut('pushed=1');
    ghOut(`queue_files=${published.map((r) => rel(r.qFile)).join(' ')}`);
    ghOut(`new_urls=${published.map((r) => `https://crosstool.online/blog/${r.slug}`).join(',')}`);
    ghOut(`slots=${published.map((r) => r.slot).join(',')}`);
    ghOut(`label=slots ${published.map((r) => r.slot).join(',')}`);
    console.log(`✅ catchup 完成：补发 ${published.length} 篇`);
  } else {
    ghOut('pushed=0');
    console.log(`✅ catchup 完成：无待补发（当天 5 篇已齐或无需补）`);
  }
  if (invalid.length || errors.length) {
    // 部分失败：成功的照常推送（pushed=1），失败的仅告警、不阻断 Layer 2
    console.error(`⚠️ 部分失败：invalid slots=[${invalid.join(',')}] errors=[${errors.join(',')}]（已成功的仍推送）`);
  }
}

// ---------- 主流程 ----------
function main() {
  const date = argVal('date') || todayCN();
  const catchup = args.includes('--catchup') || (args.length === 0 && isCatchupHour());
  if (catchup) return runCatchup(date);
  const slot = argVal('slot') != null ? parseInt(argVal('slot'), 10) : slotFromNow();
  return runSingle(date, slot);
}

main();
