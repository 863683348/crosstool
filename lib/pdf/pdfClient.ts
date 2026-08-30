'use client';

import { PDFDocument } from 'pdf-lib';
import { saveAs } from 'file-saver';

let worker: Worker | null = null;
function getWorker(): Worker {
  if (!worker) {
    worker = new Worker(new URL('./engine.worker.ts', import.meta.url), { type: 'module' });
  }
  return worker;
}

export interface PdfPart {
  name: string;
  bytes: Uint8Array;
}

export async function getPageCount(file: File): Promise<number> {
  const bytes = await file.arrayBuffer();
  const doc = await PDFDocument.load(bytes, { updateMetadata: false, ignoreEncryption: true });
  return doc.getPageCount();
}

function run<T>(
  post: (w: Worker) => void,
  onMsg: (d: any, resolve: (v: T) => void) => boolean // 返回 true 表示已完成
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const w = getWorker();
    const handler = (e: MessageEvent) => {
      const d = e.data;
      if (d.type === 'error') {
        w.removeEventListener('message', handler);
        reject(new Error(decodeError(d.message)));
        return;
      }
      if (onMsg(d, resolve)) w.removeEventListener('message', handler);
    };
    w.addEventListener('message', handler);
    post(w);
  });
}

function decodeError(msg: string): string {
  if (msg.startsWith('__PDF_ENC__:')) return `加密文件（需密码）：${msg.split(':', 2)[1]}`;
  return msg;
}

export function mergeFiles(files: File[]): Promise<Uint8Array> {
  return run<Uint8Array>((w) => w.postMessage({ type: 'merge', files }), (d, resolve) => {
    if (d.type === 'done') {
      resolve(d.bytes);
      return true;
    }
    return false;
  });
}

export function compressFiles(files: File[]): Promise<PdfPart[]> {
  return run<PdfPart[]>((w) => w.postMessage({ type: 'compress', files }), (d, resolve) => {
    if (d.type === 'batch') {
      resolve(d.parts);
      return true;
    }
    return false;
  });
}

export function splitFile(file: File, parts: { name: string; pages: number[] }[]): Promise<PdfPart[]> {
  return run<PdfPart[]>((w) => w.postMessage({ type: 'split', file, parts }), (d, resolve) => {
    if (d.type === 'batch') {
      resolve(d.parts);
      return true;
    }
    return false;
  });
}

export function downloadBytes(bytes: Uint8Array, name: string) {
  const blob = new Blob([bytes] as BlobPart[], { type: 'application/pdf' });
  saveAs(blob, name);
}

export function downloadBlob(blob: Blob, name: string) {
  saveAs(blob, name);
}
