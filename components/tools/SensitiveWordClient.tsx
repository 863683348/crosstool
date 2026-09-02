'use client';

import { useState } from 'react';
import { useT } from '@/lib/i18n';

const BANK: Record<string, string[]> = {
  绝对化用语: ['100%', 'best', 'top', 'no.1', 'first', '最', '第一', '极致', '完美', '唯一', '顶级'],
  虚假承诺: ['guaranteed', '免费', 'free shipping', '终身', '永久', '保证', '包过', '无效退款'],
  医疗宣称: ['cure', '治疗', '治愈', '医疗', '抗炎', '抗菌', '防晒', '减肥'],
  侵权风险: ['original', 'genuine', 'authentic', '正品', 'brand', 'replica', 'copy', 'fake'],
};

export default function SensitiveWordClient() {
  const { t } = useT();
  const [extra, setExtra] = useState('');
  const [text, setText] = useState('');

  const extraList = extra.split(/[,，\s]/).map((x) => x.trim().toLowerCase()).filter(Boolean);
  const lower = text.toLowerCase();

  const hits: { word: string; cat: string }[] = [];
  for (const [cat, words] of Object.entries(BANK)) {
    for (const w of words) {
      if (lower.includes(w.toLowerCase())) hits.push({ word: w, cat });
    }
  }
  for (const w of extraList) {
    if (lower.includes(w)) hits.push({ word: w, cat: '自定义' });
  }

  return (
    <div>
      <h1 className="text-xl font-bold">{t('sensitiveWordTitle')}</h1>
      <p className="mt-1 text-sm text-muted">{t('sensitiveWordDesc')}</p>

      <textarea
        className="mt-4 h-40 w-full rounded-card border border-border bg-bg p-3 text-sm text-text outline-none focus:border-primary"
        placeholder="粘贴 Listing 标题 / 五点 / 描述…"
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
      <input
        className="mt-3 w-full rounded-card border border-border bg-bg p-2 text-sm text-text outline-none focus:border-primary"
        placeholder="自定义敏感词（逗号分隔，可选）"
        value={extra}
        onChange={(e) => setExtra(e.target.value)}
      />

      <div className="mt-4 rounded-card border border-border bg-panel p-4 text-sm">
        {hits.length === 0 ? (
          <p className="text-primary">✓ 未发现内置敏感词（仅供参考，请以平台规则为准）</p>
        ) : (
          <>
            <p className="mb-2 font-semibold text-red-500">发现 {hits.length} 处疑似敏感词</p>
            <ul className="space-y-1">
              {hits.map((h, i) => (
                <li key={i} className="flex justify-between">
                  <span>{h.word}</span>
                  <span className="text-muted">{h.cat}</span>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </div>
  );
}
