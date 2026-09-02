'use client';

import { useState } from 'react';
import { useT } from '@/lib/i18n';

const TEMPLATES = [
  '【{name}】{point} — 适合日常{keyword}场景。',
  '升级版 {name}：{point}，{keyword}一步到位。',
  '{point}：{name} 让 {keyword} 更轻松。',
  '精选 {name} — {point}，品质看得见。',
  '{keyword}必备 {name}：{point}。',
];

export default function BulletGenClient() {
  const { t } = useT();
  const [name, setName] = useState('');
  const [kw, setKw] = useState('');
  const [points, setPoints] = useState('');

  const pointList = points.split('\n').map((x) => x.trim()).filter(Boolean);
  const bullets = pointList
    .slice(0, TEMPLATES.length)
    .map((pt, i) =>
      TEMPLATES[i]
        .replace('{name}', name || '产品')
        .replace('{point}', pt)
        .replace('{keyword}', kw || '核心'),
    );

  const copy = () => navigator.clipboard?.writeText(bullets.join('\n'));

  return (
    <div>
      <h1 className="text-xl font-bold">{t('bulletGenTitle')}</h1>
      <p className="mt-1 text-sm text-muted">{t('bulletGenDesc')}</p>

      <div className="mt-4 space-y-3 rounded-card border border-border bg-panel p-4">
        <label className="flex flex-col gap-1 text-xs text-muted">
          产品名
          <input
            className="rounded-card border border-border bg-bg p-2 text-sm text-text outline-none focus:border-primary"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </label>
        <label className="flex flex-col gap-1 text-xs text-muted">
          核心关键词
          <input
            className="rounded-card border border-border bg-bg p-2 text-sm text-text outline-none focus:border-primary"
            value={kw}
            onChange={(e) => setKw(e.target.value)}
          />
        </label>
        <label className="flex flex-col gap-1 text-xs text-muted">
          卖点（每行一条）
          <textarea
            className="h-32 w-full rounded-card border border-border bg-bg p-3 text-sm text-text outline-none focus:border-primary"
            value={points}
            onChange={(e) => setPoints(e.target.value)}
          />
        </label>
      </div>

      {bullets.length > 0 && (
        <div className="mt-4 rounded-card border border-border bg-panel p-4 text-sm">
          <div className="mb-2 flex items-center justify-between">
            <span className="font-semibold">生成 {bullets.length} 条 Bullet</span>
            <button className="rounded-card bg-primary px-3 py-1 text-xs text-primary-text" onClick={copy}>
              复制全部
            </button>
          </div>
          <ol className="list-decimal space-y-1 pl-5">
            {bullets.map((b, i) => (
              <li key={i}>{b}</li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}
