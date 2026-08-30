// 图片工具引擎（纯前端，零上传）：格式转换 / 缩放 / 可见水印 / 隐形水印(LSB)
// 全部基于 canvas，复用 image-compressor 的零依赖思路。

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('图片解码失败'));
    };
    img.src = url;
  });
}

export async function convertImage(file: File, outType: string, quality = 0.92): Promise<Blob> {
  const img = await loadImage(file);
  const canvas = document.createElement('canvas');
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  canvas.getContext('2d')!.drawImage(img, 0, 0);
  const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, outType, quality));
  if (!blob) throw new Error('编码失败');
  return blob;
}

export async function resizeImage(file: File, mode: 'max' | 'scale', value: number): Promise<Blob> {
  const img = await loadImage(file);
  let w = img.naturalWidth;
  let h = img.naturalHeight;
  if (mode === 'max') {
    const r = Math.min(value / w, value / h, 1);
    w = Math.round(w * r);
    h = Math.round(h * r);
  } else {
    const s = value / 100;
    w = Math.max(1, Math.round(w * s));
    h = Math.max(1, Math.round(h * s));
  }
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  canvas.getContext('2d')!.drawImage(img, 0, 0, w, h);
  const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, file.type || 'image/png', 0.92));
  if (!blob) throw new Error('编码失败');
  return blob;
}

export async function addVisibleWatermark(file: File, text: string, opts: { opacity: number; size: number }): Promise<Blob> {
  const img = await loadImage(file);
  const canvas = document.createElement('canvas');
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(img, 0, 0);
  ctx.globalAlpha = opts.opacity;
  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = 'rgba(0,0,0,0.45)';
  ctx.lineWidth = Math.max(1, opts.size / 12);
  ctx.font = `bold ${opts.size}px sans-serif`;
  ctx.textBaseline = 'top';
  const stepX = opts.size * 9;
  const stepY = opts.size * 5;
  for (let y = -stepY; y < canvas.height + stepY; y += stepY) {
    for (let x = -stepX; x < canvas.width + stepX; x += stepX) {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(-Math.PI / 6);
      ctx.fillText(text, 0, 0);
      ctx.strokeText(text, 0, 0);
      ctx.restore();
    }
  }
  const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, 'image/png', 0.95));
  if (!blob) throw new Error('编码失败');
  return blob;
}

const WM_PREFIX = 'CTWM1:';

export async function embedBlindWatermark(file: File, payload: string): Promise<Blob> {
  const img = await loadImage(file);
  const canvas = document.createElement('canvas');
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(img, 0, 0);
  const data = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const bytes = data.data;
  const msg = WM_PREFIX + payload;
  const enc = new TextEncoder();
  const arr = enc.encode(msg);
  const bits: number[] = [];
  for (let i = 0; i < 32; i++) bits.push((arr.length >> i) & 1);
  for (const b of arr) for (let i = 0; i < 8; i++) bits.push((b >> i) & 1);
  if (bits.length > Math.floor(bytes.length / 4)) throw new Error('图片像素不足，水印太长');
  let bi = 0;
  for (let p = 0; p < bytes.length && bi < bits.length; p += 4) {
    bytes[p] = (bytes[p] & 0xfe) | bits[bi++];
  }
  ctx.putImageData(data, 0, 0);
  const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, 'image/png', 1));
  if (!blob) throw new Error('编码失败');
  return blob;
}

export async function extractBlindWatermark(file: File): Promise<string> {
  const img = await loadImage(file);
  const canvas = document.createElement('canvas');
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(img, 0, 0);
  const data = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const bytes = data.data;
  const bits: number[] = [];
  for (let p = 0; p < bytes.length; p += 4) {
    bits.push(bytes[p] & 1);
    if (bits.length >= 32 + 8 * 4096) break;
  }
  let len = 0;
  for (let i = 0; i < 32; i++) len |= (bits[i] << i);
  if (len <= 0 || len > 4096) throw new Error('未检测到有效水印');
  const total = 32 + len * 8;
  const all: number[] = [];
  for (let p = 0; p < bytes.length && all.length < total; p += 4) all.push(bytes[p] & 1);
  const out = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    let b = 0;
    for (let j = 0; j < 8; j++) b |= ((all[32 + i * 8 + j] || 0) << j);
    out[i] = b;
  }
  const msg = new TextDecoder().decode(out);
  if (!msg.startsWith(WM_PREFIX)) throw new Error('未检测到有效水印');
  return msg.slice(WM_PREFIX.length);
}
