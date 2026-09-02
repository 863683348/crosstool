'use client';

import { useState } from 'react';
import { useT } from '@/lib/i18n';
import { Download } from 'lucide-react';

interface Item {
  file: File;
  url: string;
}

export default function ImageBorderClient() {
  const { t } = useT();
  const [items, setItems] = useState<Item[]>([]);
  const [border, setBorder] = useState(40);
  const [radius, setRadius] = useState(24);
  const [bg, setBg] = useState('#ffffff');

  function onFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []).filter((f) => f.type.startsWith('image/'));
    setItems(files.map((f) => ({ file: f, url: URL.createObjectURL(f) })));
  }

  async function process(src: Item): Promise<Blob | null> {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    await new Promise<void>((res, rej) => {
      img.onload = () => res();
      img.onerror = () => rej();
      img.src = src.url;
    });
    const W = img.width + border * 2;
    const H = img.height + border * 2;
    const c = document.createElement('canvas');
    c.width = W;
    c.height = H;
    const ctx = c.getContext('2d')!;
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);
    ctx.drawImage(img, border, border, img.width, img.height);
    const out = document.createElement('canvas');
    out.width = W;
    out.height = H;
    const octx = out.getContext('2d')!;
    octx.fillStyle = bg;
    octx.fillRect(0, 0, W, H);
    octx.beginPath();
    const r = Math.min(radius, W / 2, H / 2);
    octx.moveTo(r, 0);
    octx.arcTo(W, 0, W, H, r);
    octx.arcTo(W, H, 0, H, r);
    octx.arcTo(0, H, 0, 0, r);
    octx.arcTo(0, 0, W, 0, r);
    octx.closePath();
    octx.save();
    octx.clip();
    octx.drawImage(c, 0, 0);
    octx.restore();
    return await new Promise<Blob | null>((res) => out.toBlob(res, 'image/png'));
  }

  async function downloadOne(it: Item) {
    const blob = await process(it);
    if (!blob) return;
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = it.file.name.replace(/(\.[^.]+)$/, '-bordered$1');
    a.click();
    URL.revokeObjectURL(a.href);
  }

  return (
    <div>
      <h1 className="text-xl font-bold">{t('imgBorderTitle')}</h1>
      <p className="mt-1 text-sm text-muted">{t('imgBorderDesc')}</p>

      <label className="mt-4 inline-block cursor-pointer rounded-lg border border-border bg-panel px-4 py-2 text-sm hover:border-primary">
        {t('dropBig')}
        <input type="file" accept="image/*" multiple className="hidden" onChange={onFiles} />
      </label>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-1 text-sm">边框 px
          <input type="number" className="w-16 rounded-card border border-border bg-bg p-1 text-sm" value={border} onChange={(e) => setBorder(Number(e.target.value))} />
        </label>
        <label className="flex items-center gap-1 text-sm">圆角 px
          <input type="number" className="w-16 rounded-card border border-border bg-bg p-1 text-sm" value={radius} onChange={(e) => setRadius(Number(e.target.value))} />
        </label>
        <label className="flex items-center gap-1 text-sm">背景
          <input type="color" className="h-8 w-10 rounded border border-border bg-bg" value={bg} onChange={(e) => setBg(e.target.value)} />
        </label>
      </div>

      {items.length > 0 && (
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {items.map((it, i) => (
            <div key={i} className="rounded-card border border-border bg-panel p-2 text-center">
              <img src={it.url} alt="" className="mx-auto max-h-32 rounded" />
              <button className="mt-2 flex w-full items-center justify-center gap-1 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-text hover:opacity-90" onClick={() => downloadOne(it)}>
                <Download size={12} /> {t('download')}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
