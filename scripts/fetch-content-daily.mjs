#!/usr/bin/env node
/**
 * crosstool 百日 SEO 每日内容「校验 + 追加」器（Layer 1，零 npm 依赖）
 *
 * 设计：正文由 02:10 automation 的助手生成（外部 LLM key 已欠费不可用），
 *       本脚本只负责「选稿 + 校验 + 追加」，保证数据层不被破坏。
 *
 * 用法：
 *   node scripts/fetch-content-daily.mjs --auto --print
 *        → 计算今天 Day N（基于 2026-08-04），从 scripts/publish-plan.json
 *          取「今天起第一条尚未发布的选题」并打印为 JSON（供助手据此写正文）。
 *          已发布判断 = slug 已存在于 blog.ts 种子层或 blog.daily.json 日更层。
 *
 *   node scripts/fetch-content-daily.mjs <post.json> [--dry-run]
 *        → 校验助手生成的帖子（字段/type 合法/slug 唯一/date 格式/body≥300字/
 *          relatedTools slug 真实存在），通过后追加到 content/blog.daily.json。
 *        --dry-run 只校验不写盘。
 *
 * 退出码：0=成功/跳过  1=校验失败  2=其他错误
 */

import { readFileSync, writeFileSync, existsSync, appendFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PLAN = path.join(ROOT, 'scripts', 'publish-plan.json');
const BLOG_TS = path.join(ROOT, 'content', 'blog.ts');
const DAILY = path.join(ROOT, 'content', 'blog.daily.json');
const TOOLS_TS = path.join(ROOT, 'lib', 'tools.ts');
const I18N_TS = path.join(ROOT, 'lib', 'i18n.tsx');

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const autoPrint = args.includes('--auto') && args.includes('--print');
const postFile = args.find((a) => a.endsWith('.json') && !a.startsWith('--'));

const START_DATE = '2026-08-04'; // Day 1
const TYPES = new Set(['tutorial', 'review', 'compare', 'listicle']);
const fail = (msg) => { console.error('❌ ' + msg); process.exit(1); };

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

// ---------- 既有 slug（种子层 + 日更层） ----------
function existingSlugs() {
  const seen = new Set();
  try {
    const ts = readFileSync(BLOG_TS, 'utf-8');
    let m; const re = /slug:\s*'([^']+)'/g;
    while ((m = re.exec(ts)) !== null) seen.add(m[1]);
  } catch { /* ignore */ }
  try {
    const daily = JSON.parse(readFileSync(DAILY, 'utf-8'));
    if (Array.isArray(daily)) for (const p of daily) if (p?.slug) seen.add(p.slug);
  } catch { /* ignore */ }
  return seen;
}

function dayFromDate() {
  const start = new Date(START_DATE + 'T00:00:00+08:00');
  const now = new Date(new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Shanghai' }).format(new Date()) + 'T00:00:00+08:00');
  const days = Math.floor((now - start) / 86400000) + 1;
  return days;
}

// ---------- 模式 1：--auto --print（选出今天该发的选题） ----------
function autoPrintTarget() {
  const plan = JSON.parse(readFileSync(PLAN, 'utf-8'));
  const has = existingSlugs();
  const startDay = dayFromDate();
  if (startDay < 1 || startDay > 100) { console.log(`⚠️ 今天 Day ${startDay} 不在 1~100 范围，无需发布`); process.exit(0); }
  let target = null;
  for (let i = startDay - 1; i < plan.length; i++) {
    if (!has.has(plan[i].slug)) { target = plan[i]; break; }
  }
  if (!target) {
    // 今天起到末尾都已发布 → 往前找任何未发布（容错，正常不会触发）
    target = plan.find((p) => !has.has(p.slug)) || null;
  }
  if (!target) { console.log('✅ 100 天选题已全部发布'); process.exit(0); }
  console.log(`今天 Day ${startDay}，选题（未发布第一条）：`);
  console.log(JSON.stringify(target, null, 2));
  const gh = process.env.GITHUB_OUTPUT;
  if (gh) appendFileSync(gh, `day=${target.day}\n slug=${target.slug}\n type=${target.type}\n`);
}

// ---------- 模式 2：校验 + 追加 ----------
function validateAndAppend(file) {
  if (!existsSync(file)) fail(`帖子文件不存在: ${file}`);
  let post;
  try { post = JSON.parse(readFileSync(file, 'utf-8')); }
  catch (e) { fail('帖子 JSON 解析失败: ' + e.message); }

  const errs = [];
  if (!post.slug || !/^[a-z0-9-]+$/.test(post.slug)) errs.push('slug 非法（需 kebab-case 小写）');
  if (!post.title || typeof post.title !== 'string') errs.push('title 缺失');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(post.date || '')) errs.push('date 格式需 YYYY-MM-DD');
  if (!TYPES.has(post.type)) errs.push(`type 必须是 ${[...TYPES].join('/')}，收到: ${post.type}`);
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

  const has = existingSlugs();
  if (has.has(post.slug)) errs.push(`slug 已存在（死链/重复）: ${post.slug}`);

  if (errs.length) {
    console.error('❌ 校验失败：');
    for (const e of errs) console.error('   - ' + e);
    process.exit(1);
  }

  if (dryRun) {
    console.log(`✅ [dry-run] 校验通过：${post.slug}（${post.type}/${post.category}），未写盘`);
    process.exit(0);
  }

  let daily = [];
  try { daily = JSON.parse(readFileSync(DAILY, 'utf-8')); } catch { daily = []; }
  if (!Array.isArray(daily)) daily = [];
  if (daily.some((p) => p.slug === post.slug)) { console.log('slug 已存在，跳过'); process.exit(0); }
  daily.push(post);
  writeFileSync(DAILY, JSON.stringify(daily, null, 2) + '\n', 'utf-8');
  console.log(`✅ 已追加：${post.slug} → content/blog.daily.json（日更累计 ${daily.length} 篇）`);
  const gh = process.env.GITHUB_OUTPUT;
  if (gh) appendFileSync(gh, `pushed=1\n new_url=https://crosstool.online/blog/${post.slug}\n slug=${post.slug}\n day=${post.day || ''}\n`);
}

// ---------- 入口 ----------
if (autoPrint) { autoPrintTarget(); }
else if (postFile) { validateAndAppend(postFile); }
else { console.error('用法:\n  node scripts/fetch-content-daily.mjs --auto --print\n  node scripts/fetch-content-daily.mjs <post.json> [--dry-run]'); process.exit(2); }
