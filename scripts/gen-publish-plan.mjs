#!/usr/bin/env node
/**
 * 从 500 条日历（每天 5 slot）生成「每天 1 篇」发稿计划 publish-plan.json。
 * 轮转目标：非教程类（review/compare/listicle）尽量分散到不同天，避免连发同类型；
 * 教程类填充剩余天。固化后脚本/automation 共用，运行时确定性。
 */
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const cal = JSON.parse(readFileSync(path.join(ROOT, 'scripts', 'content-calendar.json'), 'utf-8'));

const byDay = {};
for (const e of cal) (byDay[e.day] = byDay[e.day] || []).push(e);

// 非教程类尽量均匀分散（总和 = 多类型天数 39）。按「稀缺度」优先填：
// compare 只出现在 20 天（最稀缺）→ 先填；listicle 23 天；review 31 天。各 13 篇。
const caps = { compare: 13, listicle: 13, review: 13 };
const scarcityRank = { compare: 0, listicle: 1, review: 2 }; // 越小越优先
const used = { compare: 0, listicle: 0, review: 0 };
const plan = [];
let prevType = null;

for (let d = 1; d <= 100; d++) {
  const slots = byDay[d];
  if (!slots) { console.error('❌ 缺 day', d); process.exit(1); }
  const avail = [...new Set(slots.map((s) => s.type))];
  let pick;
  const nt = avail.filter((t) => caps[t] !== undefined && used[t] < caps[t]);
  if (nt.length) {
    let choices = nt.filter((t) => t !== prevType);
    if (!choices.length) choices = nt;
    choices.sort((a, b) => (scarcityRank[a] - scarcityRank[b]) || (caps[b] - used[b]) - (caps[a] - used[a]));
    const t = choices[0];
    used[t]++;
    pick = slots.find((s) => s.type === t);
  } else {
    pick = slots.find((s) => s.type === 'tutorial') || slots[0];
  }
  prevType = pick.type;
  const { day, slot, slug, title, category, keywords, tools, type } = pick;
  plan.push({ day, slot, slug, title, category, keywords, tools, type });
}

writeFileSync(path.join(ROOT, 'scripts', 'publish-plan.json'), JSON.stringify(plan, null, 2) + '\n', 'utf-8');

const dist = {};
for (const p of plan) dist[p.type] = (dist[p.type] || 0) + 1;
let same = 0;
for (let i = 1; i < plan.length; i++) if (plan[i].type === plan[i - 1].type) same++;
console.log('✅ publish-plan.json 生成:', plan.length, '条');
console.log('   type 分布:', JSON.stringify(dist));
console.log('   相邻同类型天数:', same, '/ 99');
console.log('   day32 ->', JSON.stringify(plan[31]));
