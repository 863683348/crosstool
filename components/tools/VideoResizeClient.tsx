'use client';

import { useState } from 'react';
import { useT } from '@/lib/i18n';
import { withFFmpeg, writeAll, downloadBytes, extOf } from '@/lib/ffmpeg';
import { RunBar, FilePicker, FileList, Field, inputCls } from './_mediaShared';

export default function VideoResizeClient() {
  const { t } = useT();
  const [file, setFile] = useState<File | null>(null);
  const [width, setWidth] = useState('1280');
  const [height, setHeight] = useState('720');
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
        const w = width.trim() || '-1';
        const h = height.trim() || '-1';
        await ff.exec(['-i', inName, '-vf', `scale=${w}:${h}`, '-c:a', 'copy', `out.${ext}`]);
        const data = await ff.readFile(`out.${ext}`);
        downloadBytes(data, file.name.replace(/(\.[^.]+)$/, '-resized$1'), 'video/*');
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
      <h1 className="text-xl font-bold">{t('videoResizeTitle')}</h1>
      <p className="mt-1 text-sm text-muted">{t('videoResizeDesc')}</p>
      <FilePicker label="选择视频" accept="video/*" onPick={(f) => setFile(f[0])} />
      <FileList files={file ? [file] : []} />
      <Field label="目标宽度（像素，留空或 -1 = 按高度自动）">
        <input className={inputCls} value={width} onChange={(e) => setWidth(e.target.value)} inputMode="numeric" />
      </Field>
      <Field label="目标高度（像素，留空或 -1 = 按宽度自动）">
        <input className={inputCls} value={height} onChange={(e) => setHeight(e.target.value)} inputMode="numeric" />
      </Field>
      <RunBar running={running} progress={progress} status={status} onRun={run} disabled={!file} label="调整尺寸" />
    </div>
  );
}
