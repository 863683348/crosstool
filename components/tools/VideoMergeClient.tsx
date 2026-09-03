'use client';

import { useState } from 'react';
import { useT } from '@/lib/i18n';
import { withFFmpeg, writeAll, downloadBytes } from '@/lib/ffmpeg';
import { RunBar, FilePicker, FileList } from './_mediaShared';

export default function VideoMergeClient() {
  const { t } = useT();
  const [files, setFiles] = useState<File[]>([]);
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('');

  async function run() {
    if (files.length < 2) return;
    setRunning(true);
    setProgress(0);
    setStatus('加载处理引擎…');
    try {
      await withFFmpeg(async (ff) => {
        const names = await writeAll(ff, files);
        const list = names.map((n) => `file '${n}'`).join('\n');
        await ff.writeFile('list.txt', list);
        await ff.exec(['-f', 'concat', '-safe', '0', '-i', 'list.txt', '-c:v', 'libx264', '-c:a', 'aac', '-movflags', '+faststart', 'out.mp4']);
        const data = await ff.readFile('out.mp4');
        downloadBytes(data, 'merged.mp4', 'video/mp4');
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
      <h1 className="text-xl font-bold">{t('videoMergeTitle')}</h1>
      <p className="mt-1 text-sm text-muted">{t('videoMergeDesc')}</p>
      <FilePicker label="选择多个视频（按选择顺序合并）" accept="video/*" multiple onPick={setFiles} />
      <FileList files={files} />
      <RunBar running={running} progress={progress} status={status} onRun={run} disabled={files.length < 2} label="开始合并" />
    </div>
  );
}
