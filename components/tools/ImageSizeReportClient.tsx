'use client';

import { useState } from 'react';
import { useT } from '@/lib/i18n';
import { Download } from 'lucide-react';

interface Row {
  name: string;
  w: number;
  h: number;
  kb: number;
}

export default function ImageSizeReportClient() {
  const { t } = useT();
  const [rows, setRows] = useState<Row[]>([]);

  async function onFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    const out: Row[] = [];
    for (const f of files) {
      const bmp = await createImageBitmap(f);
      out.push({ name: f.name, w: bmp.width, h: bmp.height, kb: Math.round(f.size / 1024) });
    }
    setRows(out);
  }

  function exportCsv() {
    if (!rows.length) return;
    const header = 'filename,width,height,size_kb\n';
    const body = rows.map((r) => `${r.name},${r.w},${r.h},${r.kb}`).join('\n');
    const blob = new Blob([header + body], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'image-size-report.csv';
    a.click();
    URL.revokeObjectURL(a.href);
  }

  return (
    <div>
      <h1 className="text-xl font-bold">{t('imgSizeTitle')}</h1>
      <p className="mt-1 text-sm text-muted">{t('imgSizeDesc')}</p>

      <label className="mt-4 inline-block cursor-pointer rounded-lg border border-border bg-panel px-4 py-2 text-sm hover:border-primary">
        {t('dropBig')}
        <input type="file" accept="image/*" multiple className="hidden" onChange={onFiles} />
      </label>

      {rows.length > 0 && (
        <div className="mt-4 overflow-x-auto rounded-card border border-border bg-panel p-3 text-sm">
          <table className="w-full text-left">
            <thead>
              <tr className="text-muted">
                <th className="pr-4">filename</th>
                <th className="pr-4">width</th>
                <th className="pr-4">height</th>
                <th>size_kb</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.name}>
                  <td className="pr-4">{r.name}</td>
                  <td className="pr-4">{r.w}</td>
                  <td className="pr-4">{r.h}</td>
                  <td>{r.kb}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <button className="mt-3 flex items-center gap-1 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-text hover:opacity-90" onClick={exportCsv}>
            <Download size={14} /> CSV
          </button>
        </div>
      )}
    </div>
  );
}
