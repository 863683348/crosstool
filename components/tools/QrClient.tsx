'use client';

import { useRef, useState } from 'react';
import { useT } from '@/lib/i18n';
import QRCode from 'qrcode';
import { Download, Copy } from 'lucide-react';

export default function QrClient() {
  const { t } = useT();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [text, setText] = useState('');
  const [size, setSize] = useState(256);
  const [err, setErr] = useState('');
  const [decoded, setDecoded] = useState('');

  async function generate() {
    if (!canvasRef.current) return;
    if (!text) {
      setErr('请输入内容');
      return;
    }
    try {
      await QRCode.toCanvas(canvasRef.current, text, {
        width: size,
        margin: 2,
        color: { dark: '#111827', light: '#ffffff' },
      });
      setErr('');
    } catch {
      setErr('生成失败');
    }
  }

  function download() {
    const c = canvasRef.current;
    if (!c) return;
    const a = document.createElement('a');
    a.href = c.toDataURL('image/png');
    a.download = 'qrcode.png';
    a.click();
  }

  function copy() {
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => alert(t('copied'))).catch(() => alert(t('copyFail')));
  }

  // 解析粘贴的二维码图片（浏览器本地，不上传）
  async function onImage(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    try {
      const bmp = await createImageBitmap(f);
      const c = document.createElement('canvas');
      c.width = bmp.width;
      c.height = bmp.height;
      const ctx = c.getContext('2d')!;
      ctx.drawImage(bmp, 0, 0);
      const { data, width, height } = ctx.getImageData(0, 0, c.width, c.height);
      // 轻量扫描：逐行查找定位图案过于复杂，使用 jsQR 思路需依赖库；此处采用浏览器原生 BarcodeDetector（如支持）
      const detector = (window as unknown as { BarcodeDetector?: new () => { detect: (i: ImageBitmap) => Promise<{ rawValue: string }[]> } }).BarcodeDetector;
      if (detector) {
        const d = new detector();
        const res = await d.detect(bmp);
        setDecoded(res[0]?.rawValue ?? '未识别到二维码');
      } else {
        setDecoded('当前浏览器不支持扫码解析（可用生成功能）；请尝试 Chrome/Edge');
      }
    } catch {
      setDecoded('解析失败');
    }
  }

  return (
    <div>
      <h1 className="text-xl font-bold">{t('qrTitle')}</h1>
      <p className="mt-1 text-sm text-muted">{t('qrDesc')}</p>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <input
          className="w-64 rounded-card border border-border bg-bg p-2 text-sm text-text outline-none focus:border-primary"
          placeholder="https://crosstool.online"
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <select
          className="rounded-card border border-border bg-bg p-2 text-sm text-text"
          value={size}
          onChange={(e) => setSize(Number(e.target.value))}
        >
          <option value={192}>192</option>
          <option value={256}>256</option>
          <option value={320}>320</option>
          <option value={512}>512</option>
        </select>
        <button className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-text hover:opacity-90" onClick={generate}>
          {t('jsonConvBtn')}
        </button>
        <button className="flex items-center gap-1 rounded-lg border border-border bg-panel px-3 py-1.5 text-sm hover:border-primary" onClick={copy} disabled={!text}>
          <Copy size={14} /> {t('base64Copy')}
        </button>
      </div>

      {err && <p className="mt-3 text-sm text-warn">{err}</p>}

      <div className="mt-4 flex items-center gap-3 rounded-card border border-border bg-panel p-4">
        <canvas ref={canvasRef} className="rounded bg-white" />
        <button className="flex items-center gap-1 rounded-lg border border-border bg-bg px-3 py-1.5 text-sm hover:border-primary" onClick={download}>
          <Download size={14} /> {t('download')}
        </button>
      </div>

      <div className="mt-6 rounded-card border border-border bg-panel p-4">
        <div className="mb-2 text-sm font-semibold">{t('base64Decode')}</div>
        <label className="cursor-pointer rounded-lg border border-border bg-bg px-4 py-2 text-sm hover:border-primary">
          {t('dropBig')}
          <input type="file" accept="image/*" className="hidden" onChange={onImage} />
        </label>
        {decoded && <p className="mt-2 break-all text-sm text-muted">{decoded}</p>}
      </div>
    </div>
  );
}
