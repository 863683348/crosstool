'use client';

import { useState } from 'react';
import { useT } from '@/lib/i18n';
import { withFFmpeg, writeAll, downloadBytes, extOf } from '@/lib/ffmpeg';
import { RunBar, FilePicker, FileList, Field, inputCls } from './_mediaShared';

export default function AudioTrimClient() {
  const { t } = useT();
  const [file, setFile] = useState<File | null>(null);
  const [start, setStart] = useState('0');
  const [end, setEnd] = useState('');
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('');

  async function run() {
    if (!file) return;
    setRunning(true);
    setProgress(0);
    setStatus('加载处理引擎…');
    try {
      await withFFmpeg(async (ff) => {
        const [inName] = await writeAll(ff, [file]);
        const ext = extOf(file.name);
        const args = ['-ss', start];
        if (end.trim()) args.push('-to', end);
        args.push('-i', inName, '-c', 'copy', `out.${ext}`);
        await ff.exec(args);
        const data = await ff.readFile(`out.${ext}`);
        downloadBytes(data, file.name.replace(/(\.[^.]+)$/, '-trim$1'), 'audio/*');
      }, { onProgress: setProgress });
      setStatus('完成 ✓');
    } catch (e) {
      setStatus('处理失败：' + (e as Error).message);
    } finally {
      setRunning(false);
    }
  }

  return (
    <div>
      <h1 className="text-xl font-bold">{t('audioTrimTitle')}</h1>
      <p className="mt-1 text-sm text-muted">{t('audioTrimDesc')}</p>
      <FilePicker label="选择音频" accept="audio/*" onPick={(f) => setFile(f[0])} />
      <FileList files={file ? [file] : []} />
      <Field label="起始时间（秒）"><input className={inputCls} value={start} onChange={(e) => setStart(e.target.value)} /></Field>
      <Field label="结束时间（留空=到结尾）"><input className={inputCls} value={end} onChange={(e) => setEnd(e.target.value)} /></Field>
      <RunBar running={running} progress={progress} status={status} onRun={run} disabled={!file} label="开始裁剪" />
    </div>
  );
}
