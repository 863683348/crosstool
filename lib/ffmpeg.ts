// lib/ffmpeg.ts
// 单例 ffmpeg.wasm（单线程 core，运行时从 CDN 拉取，零上传）。
// 仅在浏览器端、用户触发处理时才加载，避免 SSR / 构建期执行。
import type { FFmpeg } from '@ffmpeg/ffmpeg';

let instance: FFmpeg | null = null;
let loading: Promise<FFmpeg> | null = null;

// 单线程 core：无需 SharedArrayBuffer，无需 COOP/COEP 响应头。
const CORE_BASE = 'https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.6/dist/esm';

export async function getFFmpeg(): Promise<FFmpeg> {
  if (instance) return instance;
  if (loading) return loading;
  loading = (async () => {
    const { FFmpeg } = await import('@ffmpeg/ffmpeg');
    const { toBlobURL } = await import('@ffmpeg/util');
    const ff = new FFmpeg();
    await ff.load({
      coreURL: await toBlobURL(`${CORE_BASE}/ffmpeg-core.js`, 'text/javascript'),
      wasmURL: await toBlobURL(`${CORE_BASE}/ffmpeg-core.wasm`, 'application/wasm'),
    });
    instance = ff;
    return ff;
  })();
  return loading;
}

export interface RunOptions {
  onProgress?: (ratio: number) => void;
  onLog?: (msg: string) => void;
}

// 包装一次 ffmpeg 调用：自动管理 progress/log 监听器，避免重复叠加。
export async function withFFmpeg(cb: (ff: FFmpeg) => Promise<void>, opts: RunOptions = {}): Promise<void> {
  const ff = await getFFmpeg();
  const p = opts.onProgress ? (e: { progress: number }) => opts.onProgress!(Math.min(1, Math.max(0, e.progress))) : null;
  const l = opts.onLog ? (e: { message: string }) => opts.onLog!(e.message) : null;
  if (p) ff.on('progress', p);
  if (l) ff.on('log', l);
  try {
    await cb(ff);
  } finally {
    if (p) ff.off('progress', p);
    if (l) ff.off('log', l);
  }
}

export async function readInput(file: File): Promise<Uint8Array> {
  const { fetchFile } = await import('@ffmpeg/util');
  return (await fetchFile(file)) as Uint8Array;
}

// 按顺序写入多个输入文件，返回写入后的内部文件名（f0.ext, f1.ext, ...）
export async function writeAll(ff: FFmpeg, files: File[]): Promise<string[]> {
  const names: string[] = [];
  for (let i = 0; i < files.length; i++) {
    const name = `f${i}.${extOf(files[i].name)}`;
    await ff.writeFile(name, await readInput(files[i]));
    names.push(name);
  }
  return names;
}

export function downloadBytes(data: Uint8Array | string, filename: string, mime: string) {
  const blob = new Blob([data as BlobPart], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function extOf(name: string): string {
  const m = name.toLowerCase().match(/\.([a-z0-9]+)$/);
  return m ? m[1] : 'bin';
}

// 解析 "ss" 或 "mm:ss" 为秒数
export function parseTime(s: string): number {
  s = (s || '').trim();
  if (!s) return 0;
  if (s.includes(':')) {
    const p = s.split(':').map(Number);
    if (p.length === 2) return p[0] * 60 + p[1];
    if (p.length === 3) return p[0] * 3600 + p[1] * 60 + p[2];
  }
  return Number(s) || 0;
}
