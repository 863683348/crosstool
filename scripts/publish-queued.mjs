#!/usr/bin/env node
/**
 * crosstool 白天时段定时发布器（零 npm 依赖）
 *
 * 机制：02:10 automation 每日把 5 篇写稿存为 content/queue/{日期}-slot-{0..4}.json 并推送到仓库；
 *       GitHub Actions 5 个白天 cron（北京 09/11/14/16/18）各自调用本脚本发布 1 篇对应时段的队列稿。
 *       发布 = 校验通过 → 追加 content/blog.daily.json → 队列文件标记 consumed（Layer 2 一起推回仓库）。
 *
 * 用法：
 *   node scripts/publish-queued.mjs                          # 自动算今天(Asia/Shanghai) + 当前时段 slot
 *   node scripts/publish-queued.mjs --date 2026-09-04        # 指定日期（默认今天）
 *   node scripts/publish-queued.mjs --date 2026-09-04 --slot 2
 *   node scripts/publish-queued.mjs --dry-run                # 只读不写盘
 *
 * slot 由当前 UTC 小时推导（与 workflow cron 对齐）：
 *   UTC 01→slot0(北京09)  03→slot1(11)  06→slot2(14)  08→slot3(16)  10→slot4(18)
 *
 * 输出 GITHUB_OUTPUT：pushed=1/0, new_url, slug, day, slot
 * 退出码：0=成功/无队列稿/跳过  1=校验失败  2=其他错误
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

// ---------- 主流程 ----------
function main() {
  const date = argVal('date') || todayCN();
  const slot = argVal('slot') != null ? parseInt(argVal('slot'), 10) : slotFromNow();
  if (!(slot >= 0 && slot <= 4)) fail(`slot 需 0-4，收到: ${slot}`);

  const qFile = path.join(QUEUE_DIR, `${date}-slot-${slot}.json`);
  console.log(`[${new Date().toTimeString().slice(0, 8)}] date=${date} slot=${slot} queue=${qFile}`);

  if (!existsSync(qFile)) {
    console.log(`✅ 无 ${date} slot ${slot} 队列稿，跳过（no-op）`);
    ghOut('pushed=0');
    return;
  }

  let q;
  try { q = JSON.parse(readFileSync(qFile, 'utf-8')); }
  catch (e) { fail(`队列文件解析失败 ${qFile}: ${e.message}`); }

  if (q && q.consumed) { console.log(`✅ ${date} slot ${slot} 已被消费（${q.slug}），跳过`); ghOut('pushed=0'); return; }
  if (!q || !q.slug) fail(`队列文件缺少 slug: ${qFile}`);

  // 去重：slug 已存在则跳过
  const has = existingSlugs();
  if (has.has(q.slug)) { console.log(`✅ slug 已发布（${q.slug}），跳过`); ghOut('pushed=0'); return; }

  // 校验
  const errs = validatePost(q);
  if (errs.length) {
    console.error('❌ 校验失败：');
    for (const e of errs) console.error('   - ' + e);
    process.exit(1);
  }

  if (dryRun) { console.log(`✅ [dry-run] 校验通过：${q.slug}，未写盘`); ghOut('pushed=0'); return; }

  // 追加
  let daily = [];
  try { daily = JSON.parse(readFileSync(DAILY, 'utf-8')); } catch { daily = []; }
  if (!Array.isArray(daily)) daily = [];
  daily.push(q);
  writeFileSync(DAILY, JSON.stringify(daily, null, 2) + '\n', 'utf-8');

  // 队列文件标记 consumed（Layer 2 推回仓库）
  writeFileSync(qFile, JSON.stringify({ consumed: true, slug: q.slug, date, slot }, null, 2) + '\n', 'utf-8');

  console.log(`✅ 已发布 ${date} slot ${slot}: ${q.slug} → content/blog.daily.json（日更累计 ${daily.length} 篇）`);
  ghOut('pushed=1');
  ghOut(`new_url=https://crosstool.online/blog/${q.slug}`);
  ghOut(`slug=${q.slug}`);
  ghOut(`day=${q.day || ''}`);
  ghOut(`slot=${slot}`);
  ghOut(`queue_file=${qFile.replace(ROOT + path.sep, '').replace(/\\/g, '/')}`);
}

main();
