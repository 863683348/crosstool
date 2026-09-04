'use client';

import { useState, useRef } from 'react';
import { useT } from '@/lib/i18n';
import { TOOLS } from '@/lib/tools';
import { getImpl, type ToolResult, type FileResult } from '@/lib/toolImpl';

function toCsv(rows: string[][]): string {
  return rows
    .map((r) => r.map((c) => {
      const s = String(c ?? '');
      return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
    }).join(','))
    .join('\n');
}
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  let h = hex.trim().replace('#', '');
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  if (h.length !== 6) return null;
  return { r: parseInt(h.slice(0, 2), 16), g: parseInt(h.slice(2, 4), 16), b: parseInt(h.slice(4, 6), 16) };
}
function rgbToHex(r: number, g: number, b: number): string {
  const f = (n: number) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, '0');
  return '#' + f(r) + f(g) + f(b);
}
function rgbToHsl(r: number, g: number, b: number) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  const l = (max + min) / 2;
  const d = max - min;
  const s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1));
  if (d) {
    if (max === r) h = ((g - b) / d) % 6;
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h *= 60;
    if (h < 0) h += 360;
  }
  return { h, s: s * 100, l: l * 100 };
}
function hslToRgb(h: number, s: number, l: number) {
  s /= 100; l /= 100;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  let r = 0, g = 0, b = 0;
  if (h < 60) [r, g, b] = [c, x, 0];
  else if (h < 120) [r, g, b] = [x, c, 0];
  else if (h < 180) [r, g, b] = [0, c, x];
  else if (h < 240) [r, g, b] = [0, x, c];
  else if (h < 300) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];
  return { r: Math.round((r + m) * 255), g: Math.round((g + m) * 255), b: Math.round((b + m) * 255) };
}
function computePalette(hex: string): { name: string; hex: string }[] {
  const c = hexToRgb(hex);
  if (!c) return [];
  const { h, s, l } = rgbToHsl(c.r, c.g, c.b);
  const mk = (hh: number, ss: number, ll: number) => ({ hex: rgbToHex(...Object.values(hslToRgb(((hh % 360) + 360) % 360, ss, ll)) as [number, number, number]) });
  return [
    { name: '主色', hex: rgbToHex(c.r, c.g, c.b) },
    { name: '互补', hex: mk(h + 180, s, l).hex },
    { name: '类似+', hex: mk(h + 30, s, l).hex },
    { name: '类似-', hex: mk(h - 30, s, l).hex },
    { name: '浅', hex: mk(h, s, Math.min(95, l + 20)).hex },
    { name: '深', hex: mk(h, s, Math.max(8, l - 20)).hex },
  ];
}

export default function ToolRunnerClient({ slug }: { slug: string }) {
  const { t } = useT();
  const meta = TOOLS.find((x) => x.slug === slug);
  const impl = getImpl(slug);
  const [input, setInput] = useState('');
  const [left, setLeft] = useState('');
  const [right, setRight] = useState('');
  const [fields, setFields] = useState<Record<string, string>>({});
  const [files, setFiles] = useState<File[]>([]);
  const [result, setResult] = useState<ToolResult | null>(null);
  const [fileResult, setFileResult] = useState<FileResult | null>(null);
  const [canvasOut, setCanvasOut] = useState<{ name: string; url: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!impl || !meta) {
    return <div className="rounded-card border border-warn-border bg-warn-soft p-4 text-warn">工具未找到。</div>;
  }

  const tool = impl;
  const setF = (name: string, val: string) => setFields((p) => ({ ...p, [name]: val }));

  function downloadText(text: string, name: string, type: string) {
    const blob = new Blob([text], { type: type || 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  }

  async function handleRun() {
    setLoading(true);
    setError('');
    setResult(null);
    setFileResult(null);
    setCanvasOut([]);
    try {
      if (tool.kind === 'file') {
        const fr = await tool.runFile!(files, fields);
        setFileResult(fr);
      } else if (tool.kind === 'canvas') {
        await renderCanvas();
      } else if (tool.kind === 'compare') {
        const r = await tool.runCompare!(left, right, fields);
        setResult(r);
      } else {
        const r = await tool.run!(input, fields);
        setResult(r);
      }
    } catch (e) {
      setError((e as Error).message || '处理失败');
    } finally {
      setLoading(false);
    }
  }

  async function renderCanvas() {
    const c = tool.canvas!;
    if (c === 'qr') {
      const { toDataURL } = await import('qrcode');
      const linesArr = input.split(/\r?\n/).map((s) => s.trim()).filter(Boolean);
      if (!linesArr.length) {
        setError('请输入至少一个链接/文本');
        return;
      }
      const out: { name: string; url: string }[] = [];
      for (const ln of linesArr) {
        const url = await toDataURL(ln, { width: 240, margin: 1 });
        out.push({ name: (ln.slice(0, 24) || 'qr') + '.png', url });
      }
      setCanvasOut(out);
    } else if (c === 'barcode') {
      const JsBarcode = (await import('jsbarcode')).default;
      const text = input.trim();
      const fmt = fields.fmt || 'CODE128';
      const canvas = document.createElement('canvas');
      try {
        JsBarcode(canvas, text, { format: fmt, width: 2, height: 80, displayValue: true, lineColor: '#111', background: '#fff' });
      } catch (e) {
        setError('条码生成失败：' + (e as Error).message + '（确认格式与内容匹配，如 UPC 需 12 位数字）');
        return;
      }
      setCanvasOut([{ name: 'barcode.png', url: canvas.toDataURL('image/png') }]);
    } else if (c === 'placeholder') {
      const w = parseInt(fields.w) || 600;
      const h = parseInt(fields.h) || 400;
      const color = fields.color || '#e2e8f0';
      const txt = fields.text || `${w} × ${h}`;
      const canvas = document.createElement('canvas');
      canvas.width = Math.min(w, 1200);
      canvas.height = Math.min(h, 1200);
      const ctx = canvas.getContext('2d')!;
      ctx.fillStyle = color;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#475569';
      ctx.font = `${Math.floor(Math.min(canvas.width, canvas.height) / 12)}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(txt, canvas.width / 2, canvas.height / 2);
      setCanvasOut([{ name: 'placeholder.png', url: canvas.toDataURL('image/png') }]);
    } else if (c === 'color') {
      const pal = computePalette(fields.hex || '#2e7d32');
      if (!pal.length) {
        setError('无法解析颜色');
        return;
      }
      setResult({
        html: `<div class="ct-palette">${pal
          .map((p) => `<div class="ct-swatch" style="background:${p.hex}"><span>${p.name}<br/>${p.hex}</span></div>`)
          .join('')}</div>`,
      });
    }
  }

  const btnClass = 'mt-3 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-text hover:opacity-90 disabled:opacity-50';
  const taClass = 'mt-3 h-48 w-full rounded-card border border-border bg-bg p-3 text-sm text-text outline-none focus:border-primary';
  const showMainInput = !!impl.placeholder;

  return (
    <div>
      <h1 className="text-xl font-bold">{t(meta.titleKey)}</h1>
      <p className="mt-1 text-sm text-muted">{t(meta.descKey)}</p>

      {/* 文件输入 */}
      {impl.kind === 'file' && (
        <div className="mt-4">
          <input
            type="file"
            multiple
            accept={impl.fileKind === 'pdf' ? 'application/pdf' : impl.fileKind === 'image' ? 'image/*' : '*/*'}
            onChange={(e) => setFiles(Array.from(e.target.files || []))}
            className="block w-full text-sm"
          />
          {files.length > 0 && <p className="mt-1 text-xs text-muted">已选 {files.length} 个文件</p>}
        </div>
      )}

      {/* 双输入对比 */}
      {impl.kind === 'compare' && (
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <textarea className={taClass} placeholder={impl.inputLabel || 'A'} value={left} onChange={(e) => setLeft(e.target.value)} />
          <textarea className={taClass} placeholder={impl.outputLabel ? 'B' : 'B'} value={right} onChange={(e) => setRight(e.target.value)} />
        </div>
      )}

      {/* 主文本输入（text/csv/form/generator 有 placeholder 时） */}
      {(impl.kind === 'text' || impl.kind === 'csv' || (impl.kind === 'form' && showMainInput) || (impl.kind === 'generator' && showMainInput)) && (
        <textarea className={taClass} placeholder={impl.placeholder} value={input} onChange={(e) => setInput(e.target.value)} />
      )}

      {/* 字段 */}
      {impl.fields && impl.fields.length > 0 && (
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {impl.fields.map((f) => (
            <label key={f.name} className="flex flex-col gap-1 text-sm">
              <span className="text-muted">{f.label}</span>
              {f.type === 'textarea' ? (
                <textarea
                  className="h-24 rounded-card border border-border bg-bg p-2 text-sm text-text outline-none focus:border-primary"
                  placeholder={f.placeholder}
                  defaultValue={f.defaultVal}
                  onChange={(e) => setF(f.name, e.target.value)}
                />
              ) : f.type === 'select' ? (
                <select
                  className="rounded-card border border-border bg-bg p-2 text-sm text-text outline-none focus:border-primary"
                  defaultValue={f.defaultVal}
                  onChange={(e) => setF(f.name, e.target.value)}
                >
                  {f.options?.map((o) => (
                    <option key={o} value={o}>
                      {o}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type={f.type === 'number' ? 'number' : 'text'}
                  className="rounded-card border border-border bg-bg p-2 text-sm text-text outline-none focus:border-primary"
                  placeholder={f.placeholder}
                  defaultValue={f.defaultVal}
                  onChange={(e) => setF(f.name, e.target.value)}
                />
              )}
            </label>
          ))}
        </div>
      )}

      <button className={btnClass} onClick={handleRun} disabled={loading || (impl.kind === 'file' && files.length === 0)}>
        {loading ? t('processing') : impl.action || '运行'}
      </button>

      {error && <div className="mt-3 rounded-card border border-warn-border bg-warn-soft p-3 text-sm text-warn">{error}</div>}

      {/* canvas 输出 */}
      {canvasOut.length > 0 && (
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {canvasOut.map((o, i) => (
            <div key={i} className="rounded-card border border-border bg-panel p-2 text-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={o.url} alt={o.name} className="mx-auto max-h-48" />
              <a href={o.url} download={o.name} className="mt-1 inline-block text-xs font-semibold text-primary">
                {t('download')} {o.name}
              </a>
            </div>
          ))}
        </div>
      )}

      {/* file 输出 */}
      {fileResult && (
        <div className="mt-4">
          {fileResult.files && fileResult.files.length > 0 && (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {fileResult.files.map((o, i) => (
                <div key={i} className="rounded-card border border-border bg-panel p-2 text-center">
                  {o.url.startsWith('data:image') || o.url.startsWith('blob:') ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={o.url} alt={o.name} className="mx-auto max-h-40" />
                  ) : null}
                  <a href={o.url} download={o.name} className="mt-1 inline-block text-xs font-semibold text-primary">
                    {t('download')} {o.name}
                  </a>
                </div>
              ))}
            </div>
          )}
          {fileResult.text && <OutputBlock res={{ text: fileResult.text }} onDownload={downloadText} />}
          {fileResult.table && <TableBlock rows={fileResult.table} onDownload={downloadText} />}
        </div>
      )}

      {/* 普通输出 */}
      {result && <OutputBlock res={result} onDownload={downloadText} />}
    </div>
  );
}

function OutputBlock({ res, onDownload }: { res: ToolResult; onDownload: (t: string, n: string, ty: string) => void }) {
  const { t } = useT();
  if (res.html) {
    return <div className="mt-4 rounded-card border border-border bg-panel p-4 text-sm" dangerouslySetInnerHTML={{ __html: res.html }} />;
  }
  if (res.table) {
    return <TableBlock rows={res.table} onDownload={onDownload} downloadName={res.downloadName} downloadType={res.downloadType} />;
  }
  if (res.text) {
    return (
      <div className="mt-4">
        <pre className="max-h-96 overflow-auto whitespace-pre-wrap rounded-card border border-border bg-bg p-3 text-sm text-text">{res.text}</pre>
        {res.downloadName && (
          <button className="mt-2 rounded-lg border border-primary px-3 py-1 text-xs font-semibold text-primary hover:bg-primary-soft" onClick={() => onDownload(res.text!, res.downloadName!, res.downloadType || 'text/plain')}>
            {t('download')} {res.downloadName}
          </button>
        )}
      </div>
    );
  }
  return null;
}

function TableBlock({ rows, onDownload, downloadName, downloadType }: { rows: string[][]; onDownload: (t: string, n: string, ty: string) => void; downloadName?: string; downloadType?: string }) {
  const { t } = useT();
  return (
    <div className="mt-4">
      <div className="overflow-auto rounded-card border border-border bg-panel">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="bg-primary-soft">
              {rows[0]?.map((c, i) => (
                <th key={i} className="p-2 font-semibold text-primary">
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.slice(1).map((r, i) => (
              <tr key={i} className="border-t border-border">
                {r.map((c, j) => (
                  <td key={j} className="p-2 text-text">
                    {c}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {downloadName && (
        <button className="mt-2 rounded-lg border border-primary px-3 py-1 text-xs font-semibold text-primary hover:bg-primary-soft" onClick={() => onDownload(toCsv(rows), downloadName, downloadType || 'text/csv')}>
          {t('download')} {downloadName}
        </button>
      )}
    </div>
  );
}
