'use client';

import { useState } from 'react';
import { useT } from '@/lib/i18n';
import { Download } from 'lucide-react';

export default function ImageRenameClient() {
  const { t } = useT();
  const [files, setFiles] = useState<File[]>([]);
  const [prefix, setPrefix] = useState('SKU_');
  const [start, setStart] = useState(1);
  const [pad, setPad] = useState(3);

  function onFiles(e: React.ChangeEvent<HTMLInputElement>) {
    setFiles(Array.from(e.target.files ?? []));
  }

  function newName(i: number, ext: string): string {
    const n = String(start + i).padStart(pad, '0');
    return `${prefix}${n}${ext}`;
  }

  function downloadOne(i: number) {
    const f = files[i];
    const ext = f.name.slice(f.name.lastIndexOf('.')) || '';
    const a = document.createElement('a');
    a.href = URL.createObjectURL(f);
    a.download = newName(i, ext);
    a.click();
    URL.revokeObjectURL(a.href);
  }

  return (
    <div>
      <h1 className="text-xl font-bold">{t('imgRenameTitle')}</h1>
      <p className="mt-1 text-sm text-muted">{t('imgRenameDesc')}</p>

      <label className="mt-4 inline-block cursor-pointer rounded-lg border border-border bg-panel px-4 py-2 text-sm hover:border-primary">
        {t('dropBig')}
        <input type="file" accept="image/*" multiple className="hidden" onChange={onFiles} />
      </label>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <input
          className="w-40 rounded-card border border-border bg-bg p-2 text-sm text-text outline-none focus:border-primary"
          placeholder="SKU_"
          value={prefix}
          onChange={(e) => setPrefix(e.target.value)}
        />
        <label className="flex items-center gap-1 text-sm">{t('imgRenameTitle')}#
          <input type="number" className="w-16 rounded-card border border-border bg-bg p-1 text-sm" value={start} onChange={(e) => setStart(Number(e.target.value))} />
        </label>
        <label className="flex items-center gap-1 text-sm">位宽
          <input type="number" className="w-14 rounded-card border border-border bg-bg p-1 text-sm" value={pad} onChange={(e) => setPad(Number(e.target.value))} />
        </label>
      </div>

      {files.length > 0 && (
        <ul className="mt-4 space-y-1 text-sm">
          {files.map((f, i) => {
            const ext = f.name.slice(f.name.lastIndexOf('.')) || '';
            return (
              <li key={i} className="flex items-center gap-3 rounded-card border border-border bg-panel px-3 py-2">
                <span className="flex-1 truncate text-muted">{f.name}</span>
                <span className="font-semibold">→ {newName(i, ext)}</span>
                <button className="flex items-center gap-1 rounded-lg border border-border bg-bg px-2 py-1 text-xs hover:border-primary" onClick={() => downloadOne(i)}>
                  <Download size={12} /> {t('download')}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
