#!/usr/bin/env node
/**
 * crosstool 百日 SEO 每日内容生成（Layer 1，零 npm 依赖）
 * 流程：读日历 → 找下一个未发布 Day → 调 LLM(qwen-plus) 生成正文 → 校验 → 追加 content/blog.daily.json
 * blog.ts 为种子层（人工维护），日更层纯 JSON，互不污染；/blog 与 sitemap 自动合并两层数据。
 *
 * 用法：
 *   node scripts/fetch-content-daily.mjs                 # 自动找下一个未发布 day
 *   node scripts/fetch-content-daily.mjs --day 5         # 指定 day（重复发布会被 slug 去重拦下）
 *   node scripts/fetch-content-daily.mjs --dry-run       # 只检查日历/工具链路，不调 LLM 不写盘
 *
 * 环境变量：DASHSCOPE_API_KEY（必填）
 * 退出码：0=成功/跳过  1=校验失败  2=其他错误
 */
import { readFileSync, writeFileSync, existsSync, appendFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CALENDAR = path.join(ROOT, 'scripts', 'content-calendar.json');
const BLOG_TS = path.join(ROOT, 'content', 'blog.ts');
const DAILY = path.join(ROOT, 'content', 'blog.daily.json');
const TOOLS_TS = path.join(ROOT, 'lib', 'tools.ts');
const I18N_TS = path.join(ROOT, 'lib', 'i18n.tsx');

const args = process.argv.slice(2);
const dayArg = (() => { const i = args.indexOf('--day'); return i >= 0 ? parseInt(args[i + 1], 10) : null; })();
const dryRun = args.includes('--dry-run');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const fail = (msg) => { console.error('❌ ' + msg); process.exit(1); };

// ---------- 活工具 slug + 中文标题 ----------
function loadLiveTools() {
  const slugs = new Map(); // slug -> titleKey
  for (const line of readFileSync(TOOLS_TS, 'utf-8').split('\n')) {
    const s = line.match(/slug: '([a-z0-9-]+)'/);
    const k = line.match(/titleKey: '([A-Za-z]+)'/);
    if (s && k && !/soon: true/.test(line)) slugs.set(s[1], k[1]);
  }
  const keyTitle = new Map();
  for (const line of readFileSync(I18N_TS, 'utf-8').split('\n')) {
    const m = line.match(/^\s{2,}([A-Za-z]+Title):\s*'([^']+)'/);
    if (m && !keyTitle.has(m[1])) keyTitle.set(m[1], m[2]); // zh 块在前
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
  } catch { /* 无文件/坏文件按空处理 */ }
  return seen;
}

function todayCN() {
  return new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Shanghai' }).format(new Date());
}

// ---------- LLM（双 provider：优先 DashScope/qwen-plus，回退 DeepSeek/deepseek-chat） ----------
function llmConfig() {
  if (process.env.DASHSCOPE_API_KEY) {
    return { key: process.env.DASHSCOPE_API_KEY, base: 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions', model: 'qwen-plus' };
  }
  if (process.env.DEEPSEEK_API_KEY) {
    return { key: process.env.DEEPSEEK_API_KEY, base: 'https://api.deepseek.com/chat/completions', model: 'deepseek-chat' };
  }
  return null;
}

async function llm(prompt, attempt = 1) {
  const cfg = llmConfig();
  if (!cfg) fail('需要 DASHSCOPE_API_KEY 或 DEEPSEEK_API_KEY 环境变量');
  try {
    const res = await fetch(cfg.base, {
      method: 'POST',
      headers: { Authorization: `Bearer ${cfg.key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: cfg.model,
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
        temperature: 0.7,
      }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${(await res.text()).slice(0, 200)}`);
    const j = await res.json();
    return JSON.parse(j.choices[0].message.content);
  } catch (e) {
    if (attempt < 3) { console.error(`  llm retry(${attempt}): ${e.message}`); await sleep(3000 * attempt); return llm(prompt, attempt + 1); }
    fail('LLM 调用失败: ' + e.message);
  }
}

async function main() {
  const out = (s) => { const gh = process.env.GITHUB_OUTPUT; if (gh) appendFileSync(gh, s + '\n'); };
  const cal = JSON.parse(readFileSync(CALENDAR, 'utf-8'));
  const has = existingSlugs();
  const entry = dayArg ? cal.find((e) => e.day === dayArg) : cal.find((e) => !has.has(e.slug));
  if (!entry) { console.log(dayArg ? `❌ 日历中无 day ${dayArg}` : '✅ 日历 100 天已全部生成'); process.exit(dayArg ? 1 : 0); }
  if (has.has(entry.slug)) { console.log(`day ${entry.day}（${entry.slug}）已发布，跳过`); out('pushed=0'); return; }

  const live = loadLiveTools();
  const tools = entry.tools.map((s) => ({ slug: s, title: live.get(s) })).filter((t) => t.title);
  if (tools.length !== entry.tools.length) {
    const bad = entry.tools.filter((s) => !live.has(s));
    fail(`day ${entry.day} 引用了非活工具: ${bad.join(',')}（会死链，先修日历）`);
  }

  console.log(`day ${entry.day}: ${entry.title} [${entry.category}] tools=${tools.map((t) => t.slug).join(',')}`);
  if (dryRun) { console.log('✅ [dry-run] 日历/工具链路校验通过（未调 LLM、未写盘）'); out('pushed=0'); return; }

  const toolList = tools.map((t) => `「${t.title}」（/tools/${t.slug}）`).join('、');
  const prompt = `你是跨境电商内容编辑。为工具站 crosstool.online 写一篇中文博客文章。

标题：${entry.title}
栏目：${entry.category}
目标关键词：${entry.keywords.join('、')}
文中要自然用到的站内工具：${toolList}

硬性规则：
1. 输出 JSON：{"excerpt": "...", "body": ["段1","段2",...]}
2. excerpt 不超过 60 字，概括痛点与解法。
3. body 为 3-6 个段落的字符串数组，全文不少于 300 字。
4. 纯中文段落，禁用 Markdown 语法符号。
5. 内容具体可操作，自然提及上面列出的工具名 1-2 次（不生硬堆砌）。
6. 不写"A vs B"纯对比文，要落在一个具体场景/问题上。
7. 不编造数据、不夸大承诺。`;

  const gen = await llm(prompt);
  if (!Array.isArray(gen.body) || gen.body.length < 3 || gen.body.map(String).join('').length < 300) {
    fail(`生成正文过短或非法（${Array.isArray(gen.body) ? gen.body.length + ' 段' : 'body 非数组'}）`);
  }
  const post = {
    slug: entry.slug,
    title: entry.title,
    date: todayCN(),
    type: 'tutorial',
    category: entry.category,
    excerpt: String(gen.excerpt || '').replace(/\s+/g, ' ').trim().slice(0, 80),
    body: gen.body.map((x) => String(x).trim()).filter(Boolean),
    relatedTools: tools,
  };

  let daily = [];
  try { daily = JSON.parse(readFileSync(DAILY, 'utf-8')); } catch { daily = []; }
  if (!Array.isArray(daily)) daily = [];
  if (daily.some((p) => p.slug === post.slug)) { console.log('slug 已存在，跳过'); return; }
  daily.push(post);
  writeFileSync(DAILY, JSON.stringify(daily, null, 2) + '\n', 'utf-8');

  console.log(`✅ 已追加 day ${entry.day}: ${post.slug} → content/blog.daily.json（日更累计 ${daily.length} 篇）`);
  out('pushed=1');
  out(`new_url=https://crosstool.online/blog/${post.slug}`);
  out(`slug=${post.slug}`);
}

main().catch((e) => { console.error('fatal:', e.message); process.exit(2); });
