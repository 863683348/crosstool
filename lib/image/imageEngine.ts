'use client';

// 图片压缩引擎（复用自 image-compressor，纯前端零依赖）
// 用 OffscreenCanvas + convertToBlob 在 Worker 内压缩；不支持时回退主线程 canvas。

const workerCode = `
self.onmessage = async (e) => {
  const { id, file, type, quality, targetBytes } = e.data;
  try {
    const bmp = await createImageBitmap(file);
    const canvas = new OffscreenCanvas(bmp.width, bmp.height);
    const ctx = canvas.getContext('2d');
    ctx.drawImage(bmp, 0, 0);
    let q = quality;
    if (targetBytes && (type === 'image/jpeg' || type === 'image/webp')) {
      let lo = 0.1, hi = 1.0, best = lo;
      for (let i = 0; i < 8; i++) {
        const mid = (lo + hi) / 2;
        const blob = await canvas.convertToBlob({ type, quality: mid });
        if (blob.size <= targetBytes) { best = mid; lo = mid; } else { hi = mid; }
      }
      q = best;
    }
    const blob = await canvas.convertToBlob({ type, quality: q });
    self.postMessage({ id, status: 'done', blob, size: blob.size, width: bmp.width, height: bmp.height });
  } catch (err) {
    self.postMessage({ id, status: 'fail', reason: String((err && err.message) || err) });
  }
};
`;

const supportsWorker =
  typeof Worker !== 'undefined' &&
  typeof OffscreenCanvas !== 'undefined' &&
  'convertToBlob' in OffscreenCanvas.prototype &&
  typeof createImageBitmap !== 'undefined';

let worker: Worker | null = null;
const pending = new Map<number, (d: any) => void>();
if (supportsWorker) {
  worker = new Worker(URL.createObjectURL(new Blob([workerCode], { type: 'application/javascript' })));
  worker.onmessage = (e) => {
    const { id } = e.data;
    const r = pending.get(id);
    if (r) {
      pending.delete(id);
      r(e.data);
    }
  };
}

let idSeq = 0;

export function extOf(mime: string): string {
  return (
    { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/avif': 'avif' }[mime] ||
    'img'
  );
}

export interface CompressResult {
  blob: Blob;
  width: number;
  height: number;
  size: number;
}

export async function compressImage(
  file: File,
  outType: string,
  quality: number,
  targetBytes: number | null
): Promise<CompressResult> {
  const id = ++idSeq;
  if (supportsWorker && worker) {
    return new Promise<CompressResult>((resolve, reject) => {
      pending.set(id, (d) => {
        if (d.status === 'done') resolve({ blob: d.blob, width: d.width, height: d.height, size: d.size });
        else reject(new Error(d.reason || '压缩失败'));
      });
      worker!.postMessage({ id, file, type: outType, quality, targetBytes });
    });
  }
  // 主线程回退
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((res, rej) => {
      const im = new Image();
      im.onload = () => res(im);
      im.onerror = rej;
      im.src = url;
    });
    const canvas = document.createElement('canvas');
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    canvas.getContext('2d')!.drawImage(img, 0, 0);
    let q = quality;
    if (targetBytes && (outType === 'image/jpeg' || outType === 'image/webp')) {
      let lo = 0.1,
        hi = 1.0,
        best = lo;
      for (let i = 0; i < 8; i++) {
        const mid = (lo + hi) / 2;
        const b = await new Promise<Blob | null>((r) => canvas.toBlob(r, outType, mid));
        if (b && b.size <= targetBytes) {
          best = mid;
          lo = mid;
        } else hi = mid;
      }
      q = best;
    }
    const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, outType, q));
    if (!blob) throw new Error('编码失败');
    return { blob, width: img.naturalWidth, height: img.naturalHeight, size: blob.size };
  } finally {
    URL.revokeObjectURL(url);
  }
}

/* ---------- 极简 ZIP（store 模式，UTF-8 文件名，零依赖） ---------- */
const crcTable = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

function crc32(buf: Uint8Array): number {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

export function buildZip(files: { name: string; data: Uint8Array }[]): Blob {
  const enc = new TextEncoder();
  const chunks: any[] = [];
  const central: { header: Uint8Array; name: Uint8Array }[] = [];
  let offset = 0;
  const DOS = 0x21;
  const FLAG = 0x0800;
  for (const f of files) {
    const name = enc.encode(f.name);
    const data = f.data;
    const crc = crc32(data);
    const size = data.length;
    const lh = new DataView(new ArrayBuffer(30));
    lh.setUint32(0, 0x04034b50, true);
    lh.setUint16(4, 20, true);
    lh.setUint16(6, FLAG, true);
    lh.setUint16(8, 0, true);
    lh.setUint16(10, 0, true);
    lh.setUint16(12, DOS, true);
    lh.setUint32(14, crc, true);
    lh.setUint32(18, size, true);
    lh.setUint32(22, size, true);
    lh.setUint16(26, name.length, true);
    lh.setUint16(28, 0, true);
    chunks.push(new Uint8Array(lh.buffer), name, data);
    const ch = new DataView(new ArrayBuffer(46));
    ch.setUint32(0, 0x02014b50, true);
    ch.setUint16(4, 20, true);
    ch.setUint16(6, 20, true);
    ch.setUint16(8, FLAG, true);
    ch.setUint16(10, 0, true);
    ch.setUint16(12, 0, true);
    ch.setUint16(14, DOS, true);
    ch.setUint32(16, crc, true);
    ch.setUint32(20, size, true);
    ch.setUint32(24, size, true);
    ch.setUint16(28, name.length, true);
    ch.setUint16(30, 0, true);
    ch.setUint16(32, 0, true);
    ch.setUint16(34, 0, true);
    ch.setUint16(36, 0, true);
    ch.setUint32(38, 0, true);
    ch.setUint32(42, offset, true);
    central.push({ header: new Uint8Array(ch.buffer), name });
    offset += 30 + name.length + size;
  }
  const cdChunks: any[] = [];
  let centralSize = 0;
  for (const c of central) {
    cdChunks.push(c.header, c.name);
    centralSize += c.header.length + c.name.length;
  }
  const eocd = new DataView(new ArrayBuffer(22));
  eocd.setUint32(0, 0x06054b50, true);
  eocd.setUint16(4, 0, true);
  eocd.setUint16(6, 0, true);
  eocd.setUint16(8, files.length, true);
  eocd.setUint16(10, files.length, true);
  eocd.setUint32(12, centralSize, true);
  eocd.setUint32(16, offset, true);
  eocd.setUint16(20, 0, true);
  return new Blob([...chunks, ...cdChunks, new Uint8Array(eocd.buffer as ArrayBuffer)], {
    type: 'application/zip',
  });
}
