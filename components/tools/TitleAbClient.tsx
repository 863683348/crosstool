'use client';

import { useState } from 'react';
import { useT } from '@/lib/i18n';

function stats(s: string) {
  const chars = s.length;
  const charsNoSpace = s.replace(/\s/g, '').length;
  const words = s.trim() === '' ? 0 : s.trim().split(/\s+/).length;
  return { chars, charsNoSpace, words };
}

function Line({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between gap-2">
      <span className="text-muted">{k}</span>
      <span className="text-right">{v}</span>
    </div>
  );
}

export default function TitleAbClient() {
  const { t } = useT();
  const [a, setA] = useState('');
  const [b, setB] = useState('');
  const [kw, setKw] = useState('');

  const sa = stats(a);
  const sb = stats(b);
  const kws = kw.split(/[,，]/).map((x) => x.trim().toLowerCase()).filter(Boolean);
  const inA = kws.filter((k) => a.toLowerCase().includes(k));
  const inB = kws.filter((k) => b.toLowerCase().includes(k));

  const tokensA = new Set(a.toLowerCase().match(/[a-z0-9]+/gi) || []);
  const tokensB = new Set(b.toLowerCase().match(/[a-z0-9]+/gi) || []);
  const onlyA = [...tokensA].filter((x) => !tokensB.has(x));
  const onlyB = [...tokensB].filter((x) => !tokensA.has(x));

  return (
    <div>
      <h1 className="text-xl font-bold">{t('titleAbTitle')}</h1>
      <p className="mt-1 text-sm text-muted">{t('titleAbDesc')}</p>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <textarea
          className="h-28 w-full rounded-card border border-border bg-bg p-3 text-sm text-text outline-none focus:border-primary"
          placeholder="标题 A"
          value={a}
          onChange={(e) => setA(e.target.value)}
        />
        <textarea
          className="h-28 w-full rounded-card border border-border bg-bg p-3 text-sm text-text outline-none focus:border-primary"
          placeholder="标题 B"
          value={b}
          onChange={(e) => setB(e.target.value)}
        />
      </div>

      <input
        className="mt-3 w-full rounded-card border border-border bg-bg p-2 text-sm text-text outline-none focus:border-primary"
        placeholder="关键词（逗号分隔，用于命中检测）"
        value={kw}
        onChange={(e) => setKw(e.target.value)}
      />

      <div className="mt-4 grid gap-3 sm:grid-cols-2 text-sm">
        <div className="rounded-card border border-border bg-panel p-3 space-y-1">
          <div className="font-semibold">标题 A</div>
          <Line k="字符数" v={`${sa.chars}（不含空格 ${sa.charsNoSpace}）`} />
          <Line k="单词数" v={`${sa.words}`} />
          <Line k="关键词命中" v={kws.length ? `${inA.length}/${kws.length}：${inA.join(', ') || '无'}` : '—'} />
          <Line k="独有词" v={onlyA.length ? onlyA.join(', ') : '—'} />
        </div>
        <div className="rounded-card border border-border bg-panel p-3 space-y-1">
          <div className="font-semibold">标题 B</div>
          <Line k="字符数" v={`${sb.chars}（不含空格 ${sb.charsNoSpace}）`} />
          <Line k="单词数" v={`${sb.words}`} />
          <Line k="关键词命中" v={kws.length ? `${inB.length}/${kws.length}：${inB.join(', ') || '无'}` : '—'} />
          <Line k="独有词" v={onlyB.length ? onlyB.join(', ') : '—'} />
        </div>
      </div>

      {a.length > 200 && <p className="mt-2 text-xs text-red-500">⚠ 标题 A 超过 Amazon 建议 200 字符上限</p>}
      {b.length > 200 && <p className="mt-2 text-xs text-red-500">⚠ 标题 B 超过 Amazon 建议 200 字符上限</p>}
    </div>
  );
}
