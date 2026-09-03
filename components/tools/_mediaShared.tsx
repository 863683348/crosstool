'use client';

import { ReactNode } from 'react';
import { Loader2 } from 'lucide-react';

export const inputCls =
  'w-full rounded-lg border border-border bg-panel px-3 py-2 text-sm outline-none focus:border-primary';

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="mt-3 block text-sm">
      <span className="mb-1 block text-muted">{label}</span>
      {children}
    </label>
  );
}

export function RunBar({
  running,
  progress,
  status,
  onRun,
  disabled,
  label,
}: {
  running: boolean;
  progress: number;
  status: string;
  onRun: () => void;
  disabled: boolean;
  label: string;
}) {
  return (
    <div className="mt-4">
      <button
        onClick={onRun}
        disabled={disabled || running}
        className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-text hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {running && <Loader2 size={14} className="animate-spin" />}
        {running ? '处理中…' : label}
      </button>
      {running && (
        <div className="mt-3">
          <div className="h-2 w-full overflow-hidden rounded bg-border">
            <div className="h-full bg-primary transition-all" style={{ width: `${Math.round(progress * 100)}%` }} />
          </div>
          <p className="mt-1 text-xs text-muted">{status || `进度 ${Math.round(progress * 100)}%`}</p>
        </div>
      )}
    </div>
  );
}

export function FilePicker({
  multiple,
  accept,
  onPick,
  label,
}: {
  multiple?: boolean;
  accept?: string;
  onPick: (files: File[]) => void;
  label: string;
}) {
  return (
    <label className="mt-4 inline-block cursor-pointer rounded-lg border border-border bg-panel px-4 py-2 text-sm hover:border-primary">
      {label}
      <input
        type="file"
        accept={accept}
        multiple={multiple}
        className="hidden"
        onChange={(e) => {
          const f = Array.from(e.target.files ?? []);
          if (f.length) onPick(f);
        }}
      />
    </label>
  );
}

export function FileList({ files }: { files: File[] }) {
  if (!files.length) return null;
  return (
    <ul className="mt-2 space-y-1 text-xs text-muted">
      {files.map((f, i) => (
        <li key={i}>
          {i + 1}. {f.name} · {(f.size / 1024).toFixed(1)} KB
        </li>
      ))}
    </ul>
  );
}

// 把任意图片文件重绘为 PNG（统一格式，便于 ffmpeg 串联 / jsPDF 合入）
export async function imageToPng(file: File): Promise<{ dataUrl: string; w: number; h: number }> {
  const bmp = await createImageBitmap(file);
  const c = document.createElement('canvas');
  c.width = bmp.width;
  c.height = bmp.height;
  c.getContext('2d')!.drawImage(bmp, 0, 0);
  return { dataUrl: c.toDataURL('image/png'), w: bmp.width, h: bmp.height };
}

export async function imageToPngBytes(file: File): Promise<Uint8Array> {
  const { dataUrl } = await imageToPng(file);
  const bin = atob(dataUrl.split(',')[1]);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}
