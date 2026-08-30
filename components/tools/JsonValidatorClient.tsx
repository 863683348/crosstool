'use client';

import { useState } from 'react';
import { useT } from '@/lib/i18n';

function findErrorLine(text: string, msg: string): number {
  const m = /position\s+(\d+)/i.exec(msg) || /line\s+(\d+)/i.exec(msg);
  if (m) {
    const pos = parseInt(m[1], 10);
    if (!isNaN(pos)) return text.slice(0, pos).split('\n').length;
  }
  return -1;
}

export default function JsonValidatorClient() {
  const { t } = useT();
  const [input, setInput] = useState('');
  const [msg, setMsg] = useState<{ ok: boolean; line: number } | null>(null);

  function validate() {
    if (!input.trim()) {
      setMsg(null);
      return;
    }
    try {
      JSON.parse(input);
      setMsg({ ok: true, line: -1 });
    } catch (e) {
      const line = findErrorLine(input, (e as Error).message);
      setMsg({ ok: false, line });
    }
  }

  return (
    <div>
      <h1 className="text-xl font-bold">{t('jsonValTitle')}</h1>
      <p className="mt-1 text-sm text-muted">{t('jsonValDesc')}</p>

      <textarea
        className="mt-4 h-56 w-full rounded-card border border-border bg-bg p-3 text-sm text-text outline-none focus:border-primary"
        placeholder="{}"
        value={input}
        onChange={(e) => setInput(e.target.value)}
      />
      <button className="mt-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-text hover:opacity-90" onClick={validate}>
        {t('jsonValBtn')}
      </button>

      {msg && (
        <div className={`mt-3 rounded-card border p-3 text-sm ${msg.ok ? 'border-ok/40 bg-ok/10 text-ok' : 'border-warn/40 bg-warn/10 text-warn'}`}>
          {msg.ok ? t('jsonValOk') : t('jsonValFail') + (msg.line > 0 ? ` (${t('jsonValLine')} ${msg.line})` : '')}
        </div>
      )}
    </div>
  );
}
