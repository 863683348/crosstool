'use client';

import { useRef, useState } from 'react';
import { useT } from '@/lib/i18n';
import { embedBlindWatermark, extractBlindWatermark } from '@/lib/image/imageOps';
import { Download, Loader2 } from 'lucide-react';

type Mode = 'embed' | 'extract';

export default function ImageBlindWatermarkClient() {
  const { t } = useT();
  const [mode, setMode] = useState<Mode>('embed');
  const [file, setFile] = useState<File | null>(null);
  const [payload, setPayload] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [outUrl, setOutUrl] = useState('');
  const [outBlob, setOutBlob] = useState<Blob | null>(null);
  const [extracted, setExtracted] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  async function add(f: File) {
    if (!f.type.startsWith('image/')) {
      alert('image only');
      return;
    }
    if (outUrl) URL.revokeObjectURL(outUrl);
    setOutUrl('');
    setOutBlob(null);
    setExtracted('');
    setError('');
    setFile(f);
  }

  async function run() {
    if (!file) return;
    setBusy(true);
    setError('');
    try {
      if (mode === 'embed') {
        if (!payload.trim()) {
          setError(t('imgBlindEmpty'));
          setBusy(false);
          return;
        }
        const blob = await embedBlindWatermark(file, payload);
        setOutUrl(URL.createObjectURL(blob));
        setOutBlob(blob);
      } else {
        const txt = await extractBlindWatermark(file);
        setExtracted(txt);
      }
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
    a.download = (file?.name || 'image').replace(/\.[^.]+$/, '') + '_wm.png';
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }

  return (
    <div>
      <h1 className="text-xl font-bold">{t('imgBlindTitle')}</h1>
      <p className="mt-1 text-sm text-muted">{t('imgBlindDesc')}</p>

      <div className="mt-4 flex gap-2">
        <button
          className={`rounded-lg px-3 py-1.5 text-sm font-semibold ${mode === 'embed' ? 'bg-primary text-primary-text' : 'border border-border bg-panel'}`}
          onClick={() => setMode('embed')}
        >
          {t('imgBlindEmbed')}
        </button>
        <button
          className={`rounded-lg px-3 py-1.5 text-sm font-semibold ${mode === 'extract' ? 'bg-primary text-primary-text' : 'border border-border bg-panel'}`}
          onClick={() => setMode('extract')}
        >
          {t('imgBlindExtract')}
        </button>
      </div>

      <div
        className="mt-4 cursor-pointer rounded-card border-2 border-dashed border-border bg-panel p-10 text-center shadow-card transition hover:border-primary"
        onClick={() => inputRef.current?.click()}
      >
        <div className="font-semibold">{t('dropBig')}</div>
        <div className="text-sm text-muted">{t('dropFmtImg')}</div>
        <input ref={inputRef} type="file" accept="image/*" hidden onChange={(e) => e.target.files && e.target.files[0] && add(e.target.files[0])} />
      </div>

      {file && (
        <div className="mt-4 space-y-3 rounded-card border border-border bg-panel p-4 shadow-card">
          <div className="text-sm font-medium">{file.name}</div>
          {mode === 'embed' && (
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-muted">{t('imgBlindPayload')}</label>
              <input
                className="rounded-lg border border-border bg-bg px-3 py-2 text-text outline-none focus:border-primary"
                placeholder={t('imgBlindPayloadPh')}
                value={payload}
                onChange={(e) => setPayload(e.target.value)}
              />
            </div>
          )}
          <button
            className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-text hover:opacity-90 disabled:opacity-50"
            onClick={run}
            disabled={busy}
          >
            {busy ? <Loader2 size={14} className="mr-1 inline animate-spin" /> : null}
            {mode === 'embed' ? t('imgBlindEmbed') : t('imgBlindExtract')}
          </button>
          {error && <p className="text-sm text-warn">{error}</p>}
          {outUrl && (
            <div className="flex items-center gap-3">
              <span className="text-sm text-ok">{t('done')}</span>
              <button className="flex items-center gap-1 rounded-lg border border-border bg-panel px-3 py-1.5 text-sm hover:border-primary" onClick={download}>
                <Download size={14} className="mr-1 inline" /> {t('download')}
              </button>
              <a className="text-sm text-primary hover:underline" href={outUrl} target="_blank" rel="noreferrer">
                {t('preview')}
              </a>
            </div>
          )}
          {extracted && (
            <div className="rounded-card border border-ok/30 bg-ok/10 p-3 text-sm">
              <div className="mb-1 font-semibold text-muted">{t('imgBlindResult')}</div>
              <div className="break-all font-mono">{extracted}</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
