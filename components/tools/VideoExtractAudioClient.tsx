'use client';

import { useState } from 'react';
import { useT } from '@/lib/i18n';
import { withFFmpeg, writeAll, downloadBytes } from '@/lib/ffmpeg';
import { RunBar, FilePicker, FileList } from './_mediaShared';

export default function VideoExtractAudioClient() {
  const { t } = useT();
  const [file, setFile] = useState<File | null>(null);
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
        await ff.exec(['-i', inName, '-vn', '-c:a', 'libmp3lame', '-q:a', '2', 'out.mp3']);
        const data = await ff.readFile('out.mp3');
        downloadBytes(data, file.name.replace(/(\.[^.]+)$/, '-audio.mp3'), 'audio/mpeg');
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
      <h1 className="text-xl font-bold">{t('videoExtractAudioTitle')}</h1>
      <p className="mt-1 text-sm text-muted">{t('videoExtractAudioDesc')}</p>
      <FilePicker label="选择视频" accept="video/*" onPick={(f) => setFile(f[0])} />
      <FileList files={file ? [file] : []} />
      <RunBar running={running} progress={progress} status={status} onRun={run} disabled={!file} label="开始提取" />
    </div>
  );
}
