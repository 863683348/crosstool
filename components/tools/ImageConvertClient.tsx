'use client';

import { useRef, useState } from 'react';
import { useT } from '@/lib/i18n';
import { compressImage, buildZip, extOf } from '@/lib/image/imageEngine';
import { Download, Loader2, X } from 'lucide-react';

const WHITE = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'];
const MAX = 50 * 1024 * 1024;

interface Item {
  id: string;
  file: File;
  name: string;
  originalType: string;
  originalSize: number;
  status: 'pending' | 'processing' | 'done' | 'fail';
  blob: Blob | null;
  size: number;
  ratio: number;
  error: string;
  origUrl: string;
  outUrl: string | null;
  outType: string;
}

function fmtSize(b: number) {
  if (b < 1024) return b + ' B';
  if (b < 1024 * 1024) return (b / 1024).toFixed(1) + ' KB';
  return (b / 1024 / 1024).toFixed(2) + ' MB';
}

export default function ImageConvertClient() {
  const { t } = useT();
  const [items, setItems] = useState<Item[]>([]);
  const [format, setFormat] = useState('image/png');
  const inputRef = useRef<HTMLInputElement>(null);

  function outName(it: Item) {
    const base = it.name.replace(/\.[^.]+$/, '');
    return `${base}_converted.${extOf(it.outType)}`;
  }

  async function convert(it: Item) {
    setItems((p) => p.map((x) => (x.id === it.id ? { ...x, status: 'processing', error: '' } : x)));
    try {
      const res = await compressImage(it.file, format, 0.95, null);
      setItems((p) =>
        p.map((x) =>
          x.id === it.id
            ? {
                ...x,
                status: 'done',
                blob: res.blob,
                size: res.size,
                ratio: Math.round((1 - res.size / x.originalSize) * 100),
                outUrl: URL.createObjectURL(res.blob),
                outType: format,
              }
            : x
        )
      );
    } catch (e) {
      setItems((p) => p.map((x) => (x.id === it.id ? { ...x, status: 'fail', error: String((e as Error)?.message || e) } : x)));
    }
  }

  async function addFiles(files: FileList | File[]) {
    for (const file of Array.from(files)) {
      if (!WHITE.includes(file.type)) {
        alert(t('dropFmtImg') + ' · ' + file.name);
        continue;
      }
      if (file.size > MAX) {
        alert('≤ 50MB · ' + file.name);
        continue;
      }
      const id = 'f' + Math.random().toString(36).slice(2) + Date.now().toString(36);
      const it: Item = {
        id,
        file,
        name: file.name,
        originalType: file.type,
        originalSize: file.size,
        status: 'pending',
        blob: null,
        size: 0,
        ratio: 0,
        error: '',
        origUrl: URL.createObjectURL(file),
        outUrl: null,
        outType: format,
      };
      setItems((p) => [...p, it]);
      await convert(it);
    }
  }

  function remove(id: string) {
    setItems((p) => {
      const it = p.find((x) => x.id === id);
      if (it) {
        URL.revokeObjectURL(it.origUrl);
        if (it.outUrl) URL.revokeObjectURL(it.outUrl);
      }
      return p.filter((x) => x.id !== id);
    });
  }

  function downloadSingle(it: Item) {
    if (it.status !== 'done' || !it.blob) return;
    const a = document.createElement('a');
    a.href = URL.createObjectURL(it.blob);
    a.download = outName(it);
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }

  async function downloadZip() {
    const done = items.filter((i) => i.status === 'done' && i.blob);
    if (!done.length) return;
    const counter: Record<string, number> = {};
    const files = await Promise.all(
      done.map(async (it) => {
        let name = outName(it);
        if (counter[name] != null) {
          counter[name] += 1;
          name = name.replace(/(\.[^.]+)$/, `_${counter[name]}$1`);
        } else counter[name] = 0;
        return { name, data: new Uint8Array(await it.blob!.arrayBuffer()) };
      })
    );
    const zip = buildZip(files);
    const a = document.createElement('a');
    a.href = URL.createObjectURL(zip);
    a.download = `converted_${Date.now()}.zip`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }

  const done = items.filter((i) => i.status === 'done');

  return (
    <div>
      <h1 className="text-xl font-bold">{t('imgConvertTitle')}</h1>
      <p className="mt-1 text-sm text-muted">{t('imgConvertDesc')}</p>

      <div
        className="mt-4 cursor-pointer rounded-card border-2 border-dashed border-border bg-panel p-10 text-center shadow-card transition hover:border-primary"
        onClick={() => inputRef.current?.click()}
      >
        <div className="font-semibold">{t('dropBig')}</div>
        <div className="text-sm text-muted">{t('dropFmtImg')}</div>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/avif"
          multiple
          hidden
          onChange={(e) => e.target.files && addFiles(e.target.files)}
        />
      </div>

      <div className="mt-4 flex flex-wrap items-end gap-4 rounded-card border border-border bg-panel p-4 shadow-card">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-muted">{t('format')}</label>
          <select
            value={format}
            onChange={(e) => {
              setFormat(e.target.value);
              items.forEach((it) => convert(it));
            }}
            className="rounded-lg border border-border bg-bg px-2 py-1.5 text-text outline-none focus:border-primary"
          >
            <option value="image/jpeg">{t('fmtJpg')}</option>
            <option value="image/png">{t('fmtPng')}</option>
            <option value="image/webp">{t('fmtWebp')}</option>
          </select>
        </div>
        {done.length > 0 && (
          <button className="rounded-lg border border-border bg-panel px-3 py-1.5 text-sm font-semibold hover:border-primary" onClick={downloadZip}>
            <Download size={14} className="mr-1 inline" /> {t('downloadZip')}
          </button>
        )}
      </div>

      <div className="mt-4 space-y-2">
        {items.length === 0 && <p className="text-center text-sm text-muted">{t('empty')}</p>}
        {items.map((it) => (
          <div key={it.id} className="flex items-center gap-3 rounded-card border border-border bg-panel p-3 shadow-card">
            <img src={it.origUrl} alt={it.name} className="h-12 w-12 rounded-lg border border-border object-cover" />
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-medium">{it.name}</div>
              <div className="text-xs text-muted">
                {fmtSize(it.originalSize)}
                {it.status === 'done' ? (
                  <>
                    {' → '}
                    {fmtSize(it.size)} <span className="font-semibold text-ok">↓{it.ratio}%</span>
                  </>
                ) : it.status === 'processing' ? (
                  <span className="inline-flex items-center gap-1">
                    <Loader2 size={12} className="animate-spin" /> {t('processing')}
                  </span>
                ) : it.status === 'fail' ? (
                  <span className="text-warn">{it.error}</span>
                ) : (
                  ''
                )}
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button className="p-1.5 text-muted hover:text-text disabled:opacity-40" disabled={it.status !== 'done'} onClick={() => downloadSingle(it)} title={t('download')}>
                <Download size={16} />
              </button>
              <button className="p-1.5 text-muted hover:text-warn" onClick={() => remove(it.id)}>
                <X size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
