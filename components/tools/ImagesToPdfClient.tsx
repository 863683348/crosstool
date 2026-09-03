'use client';

import { useState } from 'react';
import { useT } from '@/lib/i18n';
import { RunBar, FilePicker, FileList, inputCls } from './_mediaShared';
import { imageToPng } from './_mediaShared';

export default function ImagesToPdfClient() {
  const { t } = useT();
  const [files, setFiles] = useState<File[]>([]);
  const [running, setRunning] = useState(false);
  const [status, setStatus] = useState('');

  async function run() {
    if (!files.length) return;
    setRunning(true);
    setStatus('生成 PDF…');
    try {
      const { jsPDF } = await import('jspdf');
      const doc = new jsPDF({ unit: 'pt', format: 'a4' });
      const pageW = doc.internal.pageSize.getWidth();
      const pageH = doc.internal.pageSize.getHeight();
      for (let i = 0; i < files.length; i++) {
        const { dataUrl, w, h } = await imageToPng(files[i]);
        const ratio = Math.min(pageW / w, pageH / h);
        const pw = w * ratio;
        const ph = h * ratio;
        if (i > 0) doc.addPage();
        doc.addImage(dataUrl, 'PNG', (pageW - pw) / 2, (pageH - ph) / 2, pw, ph);
      }
      doc.save('images-to-pdf.pdf');
      setStatus('完成 ✓');
    } catch (e) {
      setStatus('处理失败：' + (e as Error).message);
    } finally {
      setRunning(false);
    }
  }

  return (
    <div>
      <h1 className="text-xl font-bold">{t('imagesToPdfTitle')}</h1>
      <p className="mt-1 text-sm text-muted">{t('imagesToPdfDesc')}</p>
      <FilePicker multiple label="选择多张图片（按顺序合为一本 PDF）" accept="image/*" onPick={(f) => setFiles(f)} />
      <FileList files={files} />
      <RunBar running={running} progress={0} status={status} onRun={run} disabled={!files.length} label="生成 PDF" />
    </div>
  );
}
