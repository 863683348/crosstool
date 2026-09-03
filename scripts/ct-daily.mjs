#!/usr/bin/env node
/**
 * crosstool 百日 SEO 每日发稿器（自包含，零 npm 依赖）
 *
 * 设计目标：
 *  - 正文由 02:10 automation 的助手生成（外部 LLM key 已欠费不可用），本脚本只做
 *    「选稿 + 校验 + 追加」，保证数据层不被破坏。
 *  - 完全独立于 scripts/fetch-content-daily.mjs：该文件会被外部进程反复覆盖为
 *    LLM 版本（缺 key 必挂），故本脚本用独立文件名，外部 reset 也会从已提交版本还原。
 *
 * 选稿规则（按 Day 推进，避免重发）：
 *  - Day N = (今天 Asia/Shanghai - 2026-08-04) 天数 + 1
 *  - 从 day N 起逐天检查 publish-plan.json 中该天的计划 slug 是否已发布
 *    （已发布 = slug 在 content/blog.ts 种子层 或 content/blog.daily.json 日更层）
 *  - 已发则跳到下一天，直到找到第一个未发当天 → 输出该选题 JSON
 *
 * 用法：
 *   node scripts/ct-daily.mjs --auto --print
 *        → 输出今天起第一条未发选题（含 day/slug/title/category/keywords/tools/type
 *          以及 tools 解析后的 {slug,title} 中文标题），供助手写正文。
 *   node scripts/ct-daily.mjs <post.json> [--dry-run]
 *        → 校验助手帖子（字段/type 合法/slug 唯一/date 格式/body≥300字/
 *          relatedTools slug 真实非 soon），通过则追加到 content/blog.daily.json。
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
const DAY1 = '2026-08-04';
const TYPES = new Set(['tutorial', 'review', 'compare', 'listicle']);

const args = process.argv.slice(2);
const auto = args.includes('--auto');
const dryRun = args.includes('--dry-run');
const postArg = args.find((a) => a.endsWith('.json') && a !== '--dry-run');
const fail = (m) => { console.error('❌ ' + m); process.exit(1); };

// ---------- 活工具 slug + 中文标题（非 soon） ----------
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
  const ts = readFileSync(BLOG_TS, 'utf-8');
  let m; const re = /slug:\s*'([^']+)'/g;
  while ((m = re.exec(ts)) !== null) seen.add(m[1]);
  try {
    const daily = JSON.parse(readFileSync(DAILY, 'utf-8'));
    if (Array.isArray(daily)) for (const p of daily) if (p?.slug) seen.add(p.slug);
  } catch { /* 空/坏文件按空 */ }
  return seen;
}

function dayNumberOfToday() {
  const tz = 'Asia/Shanghai';
  const today = new Intl.DateTimeFormat('sv-SE', { timeZone: tz }).format(new Date());
  const t = new Date(today + 'T00:00:00+08:00');
  const d1 = new Date(DAY1 + 'T00:00:00+08:00');
  const diff = Math.round((t - d1) / 86400000);
  return diff + 1; // Day 1 = 2026-08-04
}

function main() {
  const out = (s) => { const gh = process.env.GITHUB_OUTPUT; if (gh) appendFileSync(gh, s + '\n'); };
  const plan = JSON.parse(readFileSync(PLAN, 'utf-8'));

  if (auto) {
    const published = existingSlugs();
    const dayN = dayNumberOfToday();
    for (let d = dayN; d <= 100; d++) {
      const entry = plan.find((e) => e.day === d);
      if (!entry) continue;
      if (published.has(entry.slug)) continue; // 当天已发，跳下一天
      const live = loadLiveTools();
      const tools = (entry.tools || []).map((s) => ({ slug: s, title: live.get(s) || s }));
      const bad = tools.filter((t) => !live.has(t.slug));
      if (bad.length) { console.error(`⚠️ day ${d} 引用非活工具: ${bad.join(',')}（跳过该天）`); continue; }
      const sel = { ...entry, tools };
      console.log('SELECTED ' + JSON.stringify(sel));
      out('day=' + d);
      out('slug=' + entry.slug);
      out('type=' + entry.type);
      out('category=' + entry.category);
      return;
    }
    console.log('✅ 计划 100 天已全部发布');
    out('pushed=0');
    return;
  }

  if (!postArg) fail('未指定帖子 JSON 文件（用法见文件头）');
  const post = JSON.parse(readFileSync(postArg, 'utf-8'));
  const published = existingSlugs();

  for (const f of ['slug', 'title', 'date', 'type', 'category', 'excerpt', 'body', 'relatedTools']) {
    if (post[f] === undefined || post[f] === null || post[f] === '') fail(`缺少字段: ${f}`);
  }
  if (!TYPES.has(post.type)) fail(`type 非法: ${post.type}（须为 tutorial/review/compare/listicle）`);
  if (published.has(post.slug)) { console.log('slug 已存在，跳过'); out('pushed=0'); return; }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(post.date)) fail(`date 格式非法: ${post.date}（须 YYYY-MM-DD）`);
  if (!Array.isArray(post.body) || post.body.length < 3) fail('body 须为 ≥3 段数组');
  const bodyLen = post.body.map(String).join('').length;
  if (bodyLen < 300) fail(`body 总字数不足 300（当前 ${bodyLen}）`);
  if (!Array.isArray(post.relatedTools) || !post.relatedTools.length) fail('relatedTools 须为非空数组');

  const live = loadLiveTools();
  for (const t of post.relatedTools) {
    if (!t.slug || !live.has(t.slug)) fail(`relatedTools 含非活工具 slug: ${t.slug}（会死链）`);
  }

  console.log(`✅ 校验通过: ${post.slug} [${post.type}] body=${bodyLen}字 tools=${post.relatedTools.map((t) => t.slug).join(',')}`);
  if (dryRun) { console.log('（dry-run，未写盘）'); out('pushed=0'); return; }

  let daily = [];
  try { daily = JSON.parse(readFileSync(DAILY, 'utf-8')); } catch { daily = []; }
  if (!Array.isArray(daily)) daily = [];
  if (daily.some((p) => p.slug === post.slug)) { console.log('slug 已存在，跳过'); out('pushed=0'); return; }
  daily.push(post);
  writeFileSync(DAILY, JSON.stringify(daily, null, 2) + '\n', 'utf-8');
  console.log(`✅ 已追加 → content/blog.daily.json（日更累计 ${daily.length} 篇）`);
  out('pushed=1');
  out('new_url=https://crosstool.online/blog/' + post.slug);
  out('slug=' + post.slug);
}

try {
  main();
} catch (e) {
  console.error('fatal:', e && e.message ? e.message : e);
  process.exit(2);
}
