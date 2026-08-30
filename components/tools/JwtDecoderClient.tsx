'use client';

import { useState } from 'react';
import { useT } from '@/lib/i18n';
import { Copy } from 'lucide-react';

function b64urlDecode(s: string): string {
  const pad = s.length % 4 === 0 ? '' : '='.repeat(4 - (s.length % 4));
  const b64 = s.replace(/-/g, '+').replace(/_/g, '/') + pad;
  return decodeURIComponent(escape(atob(b64)));
}

interface Part {
  raw: string;
  obj: any;
  error: string;
}

export default function JwtDecoderClient() {
  const { t } = useT();
  const [token, setToken] = useState('');
  const [header, setHeader] = useState<Part | null>(null);
  const [payload, setPayload] = useState<Part | null>(null);
  const [error, setError] = useState('');

  function decode() {
    setHeader(null);
    setPayload(null);
    setError('');
    const tok = token.trim();
    if (!tok) return;
    const parts = tok.split('.');
    if (parts.length !== 3) {
      setError(t('jwtErrorFormat'));
      return;
    }
    try {
      setHeader({ raw: parts[0], obj: JSON.parse(b64urlDecode(parts[0])), error: '' });
    } catch {
      setError(t('jwtErrorHeader'));
      return;
    }
    try {
      setPayload({ raw: parts[1], obj: JSON.parse(b64urlDecode(parts[1])), error: '' });
    } catch {
      setError(t('jwtErrorPayload'));
    }
  }

  function copy(text: string) {
    navigator.clipboard.writeText(text).then(() => alert(t('copied'))).catch(() => alert(t('copyFail')));
  }

  function expStatus(exp?: number): string {
    if (!exp) return '';
    const now = Math.floor(Date.now() / 1000);
    if (exp < now) return ' ⛔ ' + t('jwtExpired');
    const left = exp - now;
    const d = Math.floor(left / 86400);
    const h = Math.floor((left % 86400) / 3600);
    return ' ⏳ ' + t('jwtValidLeft').replace('{d}', String(d)).replace('{h}', String(h));
  }

  return (
    <div>
      <h1 className="text-xl font-bold">{t('jwtTitle')}</h1>
      <p className="mt-1 text-sm text-muted">{t('jwtDesc')}</p>

      <textarea
        className="mt-4 h-28 w-full rounded-card border border-border bg-bg p-3 text-sm text-text outline-none focus:border-primary"
        placeholder={t('jwtInput')}
        value={token}
        onChange={(e) => setToken(e.target.value)}
      />
      <button className="mt-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-text hover:opacity-90" onClick={decode}>
        {t('jwtDecodeBtn')}
      </button>

      {error && <p className="mt-3 text-sm text-warn">{error}</p>}

      {header && (
        <div className="mt-4 rounded-card border border-border bg-panel p-3 shadow-card">
          <div className="mb-1 flex items-center justify-between text-sm font-semibold">
            {t('jwtHeader')}
            <button className="text-primary hover:underline" onClick={() => copy(JSON.stringify(header.obj, null, 2))}>
              <Copy size={14} className="mr-1 inline" /> {t('base64Copy')}
            </button>
          </div>
          <pre className="overflow-auto rounded-lg bg-bg p-3 text-xs">{JSON.stringify(header.obj, null, 2)}</pre>
        </div>
      )}
      {payload && (
        <div className="mt-3 rounded-card border border-border bg-panel p-3 shadow-card">
          <div className="mb-1 flex items-center justify-between text-sm font-semibold">
            {t('jwtPayload')}
            {payload.obj.exp != null && <span className="text-xs font-normal text-muted">{expStatus(payload.obj.exp)}</span>}
            <button className="text-primary hover:underline" onClick={() => copy(JSON.stringify(payload.obj, null, 2))}>
              <Copy size={14} className="mr-1 inline" /> {t('base64Copy')}
            </button>
          </div>
          <pre className="overflow-auto rounded-lg bg-bg p-3 text-xs">{JSON.stringify(payload.obj, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}
