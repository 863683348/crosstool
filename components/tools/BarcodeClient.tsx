'use client';

import { useRef, useState } from 'react';
import { useT } from '@/lib/i18n';
import JsBarcode from 'jsbarcode';
import { Download } from 'lucide-react';

const FORMATS = ['CODE128', 'CODE39', 'EAN13', 'UPC', 'EAN8', 'ITF14'];

export default function BarcodeClient() {
  const { t } = useT();
  const svgRef = useRef<SVGSVGElement>(null);
  const [value, setValue] = useState('');
  const [format, setFormat] = useState('CODE128');
  const [err, setErr] = useState('');

  function render() {
    if (!svgRef.current) return;
    if (!value) {
      setErr('请输入内容');
      return;
    }
    try {
      JsBarcode(svgRef.current, value, {
        format,
        lineColor: '#111827',
        width: 2,
        height: 90,
        displayValue: true,
        fontSize: 14,
        margin: 10,
      });
      setErr('');
    } catch {
      setErr('内容与该格式不兼容，请检查输入');
    }
  }

  function download() {
    const svg = svgRef.current;
    if (!svg) return;
    const xml = new XMLSerializer().serializeToString(svg);
    const blob = new Blob([xml], { type: 'image/svg+xml' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `barcode-${format}.svg`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  return (
    <div>
      <h1 className="text-xl font-bold">{t('barcodeTitle')}</h1>
      <p className="mt-1 text-sm text-muted">{t('barcodeDesc')}</p>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <input
          className="w-56 rounded-card border border-border bg-bg p-2 text-sm text-text outline-none focus:border-primary"
          placeholder="123456789012"
          value={value}
          onChange={(e) => setValue(e.target.value)}
        />
        <select
          className="rounded-card border border-border bg-bg p-2 text-sm text-text"
          value={format}
          onChange={(e) => setFormat(e.target.value)}
        >
          {FORMATS.map((f) => (
            <option key={f} value={f}>{f}</option>
          ))}
        </select>
        <button className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-text hover:opacity-90" onClick={render}>
          {t('jsonConvBtn')}
        </button>
      </div>

      {err && <p className="mt-3 text-sm text-warn">{err}</p>}

      <div className="mt-4 flex items-center gap-3 rounded-card border border-border bg-panel p-4">
        <svg ref={svgRef} className="h-auto w-full max-w-xs" />
        <button className="flex items-center gap-1 rounded-lg border border-border bg-bg px-3 py-1.5 text-sm hover:border-primary" onClick={download}>
          <Download size={14} /> {t('download')}
        </button>
      </div>
    </div>
  );
}
