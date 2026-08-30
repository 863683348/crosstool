'use client';

import { useRef, useState } from 'react';
import { useT } from '@/lib/i18n';
import { compressImage, buildZip, extOf } from '@/lib/image/imageEngine';
import { Download, Loader2, X, Copy, Eye } from 'lucide-react';

const WHITE = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'];
const MAX = 50 * 1024 * 1024;

interface Item {
  id: string;
  file: File;
  name: string;
  originalType: string;
  originalSize: number;
  status: 'pending' | 'processing' | 'done' | 'fail';
  compressedBlob: Blob | null;
  compressedSize: number;
  ratio: number;
  error: string;
  origUrl: string;
  compUrl: string | null;
  _outType: string;
  _quality: number;
  _targetBytes: number | null;
}

function fmtSize(b: number) {
  if (b < 1024) return b + ' B';
  if (b < 1024 * 1024) return (b / 1024).toFixed(1) + ' KB';
  return (b / 1024 / 1024).toFixed(2) + ' MB';
}

export default function ImageCompressClient() {
  const { t } = useT();
  const [items, setItems] = useState<Item[]>([]);
  const [quality, setQuality] = useState(75);
  const [format, setFormat] = useState('keep');
  const [targetOn, setTargetOn] = useState(false);
  const [targetKb, setTargetKb] = useState<number | null>(null);
  const [avifWarned, setAvifWarned] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function outName(it: Item) {
    const base = it.name.replace(/\.[^.]+$/, '');
    return `${base}_compressed.${extOf(it._outType || it.originalType)}`;
  }

  async function compressItem(it: Item) {
    setItems((p) => p.map((x) => (x.id === it.id ? { ...x, status: 'processing', error: '' } : x)));
    let outType = format === 'keep' ? it.originalType : format;
    if (outType === 'image/avif') {
      outType = 'image/webp';
      if (!avifWarned) {
        setAvifWarned(true);
        alert(t('avifFallback'));
      }
    }
    const q = quality / 100;
    const target = targetOn && targetKb ? targetKb * 1024 : null;
    try {
      const res = await compressImage(it.file, outType, q, target);
      setItems((p) =>
        p.map((x) =>
          x.id === it.id
            ? {
                ...x,
                status: 'done',
                compressedBlob: res.blob,
                compressedSize: res.size,
                ratio: Math.round((1 - res.size / x.originalSize) * 100),
                compUrl: URL.createObjectURL(res.blob),
                _outType: outType,
                _quality: q,
                _targetBytes: target,
              }
            : x
        )
      );
    } catch (e) {
      setItems((p) =>
        p.map((x) => (x.id === it.id ? { ...x, status: 'fail', error: String((e as Error)?.message || e) } : x))
      );
    }
  }

  function recompressAll() {
    items.forEach((it) => compressItem(it));
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
        compressedBlob: null,
        compressedSize: 0,
        ratio: 0,
        error: '',
        origUrl: URL.createObjectURL(file),
        compUrl: null,
        _outType: file.type,
        _quality: quality / 100,
        _targetBytes: null,
      };
      setItems((p) => [...p, it]);
      await compressItem(it);
    }
  }

  function remove(id: string) {
    setItems((p) => {
      const it = p.find((x) => x.id === id);
      if (it) {
        URL.revokeObjectURL(it.origUrl);
        if (it.compUrl) URL.revokeObjectURL(it.compUrl);
      }
      return p.filter((x) => x.id !== id);
    });
  }

  function downloadSingle(it: Item) {
    if (it.status !== 'done' || !it.compressedBlob) return;
    const a = document.createElement('a');
    a.href = URL.createObjectURL(it.compressedBlob);
    a.download = outName(it);
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }

  async function downloadZipAsync() {
    const done = items.filter((i) => i.status === 'done' && i.compressedBlob);
    if (!done.length) return;
    const counter: Record<string, number> = {};
    const files = await Promise.all(
      done.map(async (it) => {
        let name = outName(it);
        if (counter[name] == null) counter[name] = 0;
        else {
          counter[name] += 1;
          name = name.replace(/(\.[^.]+)$/, `_${counter[name]}$1`);
        }
        const buf = new Uint8Array(await it.compressedBlob!.arrayBuffer());
        return { name, data: buf };
      })
    );
    const zip = buildZip(files);
    const a = document.createElement('a');
    a.href = URL.createObjectURL(zip);
    a.download = `compressed_${Date.now()}.zip`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }

  function copyToClipboard(it: Item) {
    if (it.status !== 'done' || !it.compressedBlob) return;
    navigator.clipboard
      .write([new ClipboardItem({ [it._outType]: it.compressedBlob })])
      .then(() => alert(t('copied')))
      .catch(() => alert(t('copyFail')));
  }

  const doneItems = items.filter((i) => i.status === 'done');
  const totalOrig = doneItems.reduce((a, i) => a + i.originalSize, 0);
  const totalComp = doneItems.reduce((a, i) => a + i.compressedSize, 0);
  const saved = totalOrig > 0 ? Math.round((1 - totalComp / totalOrig) * 100) : 0;

  return (
    <div>
      <h1 className="text-xl font-bold">{t('imgCompressTitle')}</h1>
      <p className="mt-1 text-sm text-muted">{t('imgCompressDesc')}</p>

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
          <label className="text-xs font-semibold text-muted">{t('quality')}</label>
          <div className="flex items-center gap-2">
            <input
              type="range"
              min={1}
              max={100}
              value={quality}
              onChange={(e) => {
                setQuality(+e.target.value);
                clearTimeout((recompressAll as any)._t);
                (recompressAll as any)._t = setTimeout(recompressAll, 250);
              }}
              className="w-44 accent-[var(--primary)]"
            />
            <span className="w-10 font-bold tabular-nums">{quality}%</span>
          </div>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-muted">{t('format')}</label>
          <select
            value={format}
            onChange={(e) => {
              setFormat(e.target.value);
              recompressAll();
            }}
            className="rounded-lg border border-border bg-bg px-2 py-1.5 text-text outline-none focus:border-primary"
          >
            <option value="keep">{t('fmtKeep')}</option>
            <option value="image/jpeg">{t('fmtJpg')}</option>
            <option value="image/png">{t('fmtPng')}</option>
            <option value="image/webp">{t('fmtWebp')}</option>
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-muted">{t('target')}</label>
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-1 text-sm">
              <input
                type="checkbox"
                checked={targetOn}
                onChange={(e) => {
                  setTargetOn(e.target.checked);
                  setTimeout(recompressAll, 50);
                }}
              />
              {t('targetTo')}
            </label>
            <input
              type="number"
              min={10}
              max={10240}
              placeholder="KB"
              disabled={!targetOn}
              onChange={(e) => {
                setTargetKb(parseInt(e.target.value, 10) || null);
                clearTimeout((recompressAll as any)._t2);
                (recompressAll as any)._t2 = setTimeout(recompressAll, 300);
              }}
              className="w-20 rounded-lg border border-border bg-bg px-2 py-1.5 text-text outline-none focus:border-primary disabled:opacity-50"
            />
          </div>
        </div>
      </div>

      {doneItems.length > 0 && (
        <div className="mt-3 flex flex-wrap items-center gap-3 rounded-card border border-primary/30 bg-primary-soft px-4 py-3 text-sm">
          <span>
            {t('original')}: <b>{fmtSize(totalOrig)}</b>
          </span>
          <span>
            {t('result')}: <b>{fmtSize(totalComp)}</b>
          </span>
          <span className="font-bold text-ok">
            {t('saved')} {saved}%
          </span>
          <span className="flex-1" />
          <button className="rounded-lg border border-border bg-panel px-3 py-1.5 text-sm font-semibold hover:border-primary" onClick={downloadZipAsync}>
            <Download size={14} className="mr-1 inline" /> {t('downloadZip')}
          </button>
        </div>
      )}

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
                    {fmtSize(it.compressedSize)}{' '}
                    <span className="font-semibold text-ok">↓{it.ratio}%</span>
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
              {it.compUrl && (
                <a className="p-1.5 text-muted hover:text-text" href={it.compUrl} target="_blank" rel="noreferrer" title={t('preview')}>
                  <Eye size={16} />
                </a>
              )}
              <button className="p-1.5 text-muted hover:text-text disabled:opacity-40" disabled={it.status !== 'done'} onClick={() => downloadSingle(it)} title={t('download')}>
                <Download size={16} />
              </button>
              <button className="p-1.5 text-muted hover:text-text disabled:opacity-40" disabled={it.status !== 'done'} onClick={() => copyToClipboard(it)} title={t('copied')}>
                <Copy size={16} />
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
