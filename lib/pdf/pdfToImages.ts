// PDF 转图片引擎（纯前端，零上传）：pdf.js 逐页渲染到 canvas，导出 JPG/PNG
// 仅在 /tools/pdf-to-images 路由懒加载 pdfjs-dist，不影响其他路由 FOT。

export async function pdfToImages(
  file: File,
  fmt: 'image/jpeg' | 'image/png',
  scale: number
): Promise<{ blob: Blob; width: number; height: number }[]> {
  const pdfjs: any = await import('pdfjs-dist');
  pdfjs.GlobalWorkerOptions.workerSrc = '/pdf-worker/pdf.worker.min.mjs';
  const buf = await file.arrayBuffer();
  const doc = await pdfjs.getDocument({ data: buf }).promise;
  const out: { blob: Blob; width: number; height: number }[] = [];
  for (let p = 1; p <= doc.numPages; p++) {
    const page = await doc.getPage(p);
    const viewport = page.getViewport({ scale });
    const canvas = document.createElement('canvas');
    canvas.width = Math.ceil(viewport.width);
    canvas.height = Math.ceil(viewport.height);
    const ctx = canvas.getContext('2d')!;
    if (fmt === 'image/jpeg') {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    await page.render({ canvasContext: ctx, viewport }).promise;
    const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, fmt, 0.92));
    if (blob) out.push({ blob, width: canvas.width, height: canvas.height });
  }
  return out;
}
