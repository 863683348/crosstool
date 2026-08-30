'use client';

import { useRef, useState } from 'react';
import { useT } from '@/lib/i18n';
import { Loader2, Download, X } from 'lucide-react';

export default function ImageRemoveBgClient() {
  const { t } = useT();
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState('');
  const [origUrl, setOrigUrl] = useState('');
  const [outUrl, setOutUrl] = useState('');
  const [outBlob, setOutBlob] = useState<Blob | null>(null);
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  async function add(f: File) {
    if (!f.type.startsWith('image/')) {
      alert('image only');
      return;
    }
    if (origUrl) URL.revokeObjectURL(origUrl);
    if (outUrl) URL.revokeObjectURL(outUrl);
    setOutUrl('');
    setOutBlob(null);
    setError('');
    setFile(f);
    setOrigUrl(URL.createObjectURL(f));
  }

  async function run() {
    if (!file) return;
    setBusy(true);
    setProgress(t('imgRemoveBgLoading'));
    setError('');
    try {
      const mod: any = await import('@imgly/background-removal');
      const blob: Blob = await mod.removeBackground(file, (key: string, current: number, total: number) => {
        if (key === 'compute:inference') setProgress(`${t('imgRemoveBgRun')} ${Math.round((current / total) * 100)}%`);
        else setProgress(t('imgRemoveBgLoading'));
      });
      const url = URL.createObjectURL(blob);
      setOutUrl(url);
      setOutBlob(blob);
    } catch (e) {
      setError(String((e as Error)?.message || e));
    } finally {
      setBusy(false);
    }
  }

  function download() {
    if (!outBlob) return;
    const a = document.createElement('a');
    a.href = URL.createObjectURL(outBlob);
    a.download = (file?.name || 'image').replace(/\.[^.]+$/, '') + '_nobg.png';
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }

  function clearAll() {
    if (origUrl) URL.revokeObjectURL(origUrl);
    if (outUrl) URL.revokeObjectURL(outUrl);
    setFile(null);
    setOrigUrl('');
    setOutUrl('');
    setOutBlob(null);
    setProgress('');
    setError('');
  }

  return (
    <div>
      <h1 className="text-xl font-bold">{t('imgRemoveBgTitle')}</h1>
      <p className="mt-1 text-sm text-muted">{t('imgRemoveBgDesc')}</p>
      <p className="mt-2 rounded-card border border-border bg-panel px-3 py-2 text-xs text-muted">{t('imgRemoveBgNote')}</p>

      {!file && (
        <div
          className="mt-4 cursor-pointer rounded-card border-2 border-dashed border-border bg-panel p-10 text-center shadow-card transition hover:border-primary"
          onClick={() => inputRef.current?.click()}
        >
          <div className="font-semibold">{t('dropBig')}</div>
          <div className="text-sm text-muted">{t('dropFmtImg')}</div>
          <input ref={inputRef} type="file" accept="image/*" hidden onChange={(e) => e.target.files && e.target.files[0] && add(e.target.files[0])} />
        </div>
      )}

      {file && (
        <div className="mt-4 space-y-3">
          <div className="flex flex-wrap items-center gap-3 rounded-card border border-border bg-panel p-3 shadow-card">
            <span className="text-sm font-medium">{file.name}</span>
            <span className="flex-1" />
            <button className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-text hover:opacity-90 disabled:opacity-50" onClick={run} disabled={busy}>
              {busy ? <Loader2 size={14} className="mr-1 inline animate-spin" /> : null}
              {t('imgRemoveBgRun')}
            </button>
            <button className="rounded-lg border border-border bg-panel px-3 py-2 text-sm hover:border-primary" onClick={clearAll}>
              {t('clear')}
            </button>
          </div>

          {busy && <p className="text-sm text-primary">{progress}</p>}
          {error && <p className="text-sm text-warn">{error}</p>}

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {origUrl && (
              <div className="rounded-card border border-border bg-panel p-2 shadow-card">
                <div className="mb-1 text-xs font-semibold text-muted">{t('original')}</div>
                <img src={origUrl} alt="orig" className="w-full rounded-lg border border-border object-contain" style={{ maxHeight: 320 }} />
              </div>
            )}
            {outUrl && (
              <div className="rounded-card border border-border bg-panel p-2 shadow-card">
                <div className="mb-1 flex items-center justify-between text-xs font-semibold text-muted">
                  {t('result')}
                  <button className="text-primary hover:underline" onClick={download}>
                    <Download size={14} className="mr-1 inline" /> {t('download')}
                  </button>
                </div>
                <img src={outUrl} alt="result" className="w-full rounded-lg border border-border object-contain" style={{ maxHeight: 320, background: 'repeating-conic-gradient(#eee 0% 25%, #fff 0% 50%) 50% / 16px 16px' }} />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
