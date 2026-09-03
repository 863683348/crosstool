'use client';

import { useState } from 'react';
import { useT } from '@/lib/i18n';
import { withFFmpeg, writeAll, downloadBytes } from '@/lib/ffmpeg';
import { RunBar, FilePicker, FileList, Field, inputCls } from './_mediaShared';

export default function VideoTrimClient() {
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
        const args = ['-ss', start];
        if (end.trim()) args.push('-to', end);
        args.push('-i', inName, '-c', 'copy', 'out.mp4');
        await ff.exec(args);
        const data = await ff.readFile('out.mp4');
        downloadBytes(data, file.name.replace(/(\.[^.]+)$/, '-trim.mp4'), 'video/mp4');
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
      <h1 className="text-xl font-bold">{t('videoTrimTitle')}</h1>
      <p className="mt-1 text-sm text-muted">{t('videoTrimDesc')}</p>
      <FilePicker label="选择视频" accept="video/*" onPick={(f) => setFile(f[0])} />
      <FileList files={file ? [file] : []} />
      <Field label="起始时间（秒，如 1.5 或 0:03）"><input className={inputCls} value={start} onChange={(e) => setStart(e.target.value)} /></Field>
      <Field label="结束时间（留空=到结尾）"><input className={inputCls} value={end} onChange={(e) => setEnd(e.target.value)} /></Field>
      <RunBar running={running} progress={progress} status={status} onRun={run} disabled={!file} label="开始处理" />
    </div>
  );
}
