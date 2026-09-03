#!/usr/bin/env node
/**
 * Layer 2: 用 GitHub Git Data API 推送变更文件（绕开 git CLI，路径安全、幂等）。
 * 用法:
 *   node scripts/sync-github.mjs --owner X --repo Y --branch main --token T \
 *     --message "auto: daily content" [--files "content/blog.daily.json app/sitemap.ts"]
 * 默认只推 content/blog.daily.json。
 * 输出: GITHUB_OUTPUT pushed=1/0
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const API = 'https://api.github.com';

function arg(name, def) {
  const i = process.argv.indexOf('--' + name);
  return i >= 0 ? process.argv[i + 1] : def;
}

const owner = arg('owner'), repo = arg('repo'), branch = arg('branch', 'main');
const token = arg('token') || process.env.GH_TOKEN;
const message = arg('message', 'auto: daily content');
const files = (arg('files', 'content/blog.daily.json')).split(/\s+/).filter(Boolean);

if (!owner || !repo || !token) {
  console.error('usage: --owner --repo --branch --token [--message] [--files]');
  process.exit(2);
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function req(method, p, body, attempt = 1) {
  try {
    const res = await fetch(API + p, {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github+json',
        'Content-Type': 'application/json',
        'User-Agent': 'crosstool-pipeline',
        Connection: 'close',
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    const txt = await res.text();
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${txt.slice(0, 200)}`);
    return txt ? JSON.parse(txt) : {};
  } catch (e) {
    if (attempt < 5) { console.error(`  retry(${attempt}) ${method} ${p}: ${e.message}`); await sleep(3000 * attempt); return req(method, p, body, attempt + 1); }
    throw e;
  }
}

async function main() {
  const ref = await req('GET', `/repos/${owner}/${repo}/git/ref/heads/${branch}`);
  const parent = ref.object.sha;
  const commit = await req('GET', `/repos/${owner}/${repo}/git/commits/${parent}`);
  const baseTree = commit.tree.sha;

  const tree = [];
  for (const f of files) {
    const content = readFileSync(path.join(ROOT, f), 'utf8');
    const blob = await req('POST', `/repos/${owner}/${repo}/git/blobs`, {
      content: Buffer.from(content, 'utf8').toString('base64'),
      encoding: 'base64',
    });
    tree.push({ path: f, mode: '100644', type: 'blob', sha: blob.sha });
    console.log('blob ok:', f);
  }

  const t = await req('POST', `/repos/${owner}/${repo}/git/trees`, { base_tree: baseTree, tree });
  const cm = await req('POST', `/repos/${owner}/${repo}/git/commits`, {
    message,
    tree: t.sha,
    parents: [parent],
    author: { name: 'crosstool-pipeline', email: '863683348@users.noreply.github.com' },
  });
  await req('PATCH', `/repos/${owner}/${repo}/git/refs/heads/${branch}`, { sha: cm.sha });
  console.log('✅ pushed ->', cm.sha);
  const gh = process.env.GITHUB_OUTPUT;
  if (gh) (await import('node:fs')).appendFileSync(gh, 'pushed=1\n');
}

main().catch((e) => { console.error('sync failed:', e.message); process.exit(1); });
