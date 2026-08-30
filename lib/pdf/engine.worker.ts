// PDF 引擎 Worker（纯 pdf-lib，零上传）
// 复用自 pdf-merge-next 的 engine.worker.ts，并扩展 compress / split 两种操作。
// 所有字节仅在 Worker 内物化，done 以 transferable 零拷贝回传。
import { PDFDocument, EncryptedPDFError } from 'pdf-lib';

const ctx = self as unknown as Worker;

export interface MergeMsg {
  type: 'merge';
  files: File[];
}
export interface CompressMsg {
  type: 'compress';
  files: File[];
}
export interface SplitPart {
  name: string;
  pages: number[]; // 1-based 页码
}
export interface SplitMsg {
  type: 'split';
  file: File;
  parts: SplitPart[];
}

type Inbound = MergeMsg | CompressMsg | SplitMsg;

async function loadSafe(file: File): Promise<PDFDocument> {
  const bytes = await file.arrayBuffer();
  try {
    return await PDFDocument.load(bytes, { updateMetadata: false, ignoreEncryption: true });
  } catch (e) {
    if (e instanceof EncryptedPDFError) throw new Error(`__PDF_ENC__:${file.name}`);
    throw e;
  }
}

ctx.onmessage = async (e: MessageEvent) => {
  const msg = e.data as Inbound;
  if (!msg || typeof msg.type !== 'string') return;

  try {
    if (msg.type === 'merge') {
      const out = await PDFDocument.create();
      for (const file of msg.files) {
        const src = await loadSafe(file);
        const copied = await out.copyPages(src, src.getPageIndices());
        copied.forEach((p) => out.addPage(p));
        await new Promise((r) => setTimeout(r, 0));
      }
      const bytes = await out.save();
      ctx.postMessage({ type: 'done', bytes } as const, [bytes.buffer as ArrayBuffer]);
      return;
    }

    if (msg.type === 'compress') {
      const parts: { name: string; bytes: Uint8Array }[] = [];
      for (const file of msg.files) {
        const src = await loadSafe(file);
        const out = await PDFDocument.create();
        // 复刻全部页面 + 元数据，save 默认开启 object streams → 体积更小
        const copied = await out.copyPages(src, src.getPageIndices());
        copied.forEach((p) => out.addPage(p));
        const base = file.name.replace(/\.pdf$/i, '');
        const bytes = await out.save();
        parts.push({ name: `${base}_compressed.pdf`, bytes });
        await new Promise((r) => setTimeout(r, 0));
      }
      ctx.postMessage({ type: 'batch', parts } as const);
      return;
    }

    if (msg.type === 'split') {
      const src = await loadSafe(msg.file);
      const total = src.getPageCount();
      const parts: { name: string; bytes: Uint8Array }[] = [];
      for (const part of msg.parts) {
        const idx = part.pages.filter((p) => p >= 1 && p <= total).map((p) => p - 1);
        if (idx.length === 0) continue;
        const out = await PDFDocument.create();
        const copied = await out.copyPages(src, idx);
        copied.forEach((p) => out.addPage(p));
        const bytes = await out.save();
        parts.push({ name: part.name, bytes });
      }
      ctx.postMessage({ type: 'batch', parts } as const);
      return;
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    ctx.postMessage({ type: 'error', message } as const);
  }
};
