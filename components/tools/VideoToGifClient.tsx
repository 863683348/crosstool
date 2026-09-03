'use client';

import { useState } from 'react';
import { useT } from '@/lib/i18n';
import { withFFmpeg, writeAll, downloadBytes } from '@/lib/ffmpeg';
import { RunBar, FilePicker, FileList, Field, inputCls } from './_mediaShared';

export default function VideoToGifClient() {
  const { t } = useT();
  const [file, setFile] = useState<File | null>(null);
  const [start, setStart] = useState('0');
  const [dur, setDur] = useState('3');
  const [fps, setFps] = useState('12');
  const [width, setWidth] = useState('480');
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
        const filter = `fps=${fps},scale=${width}:-1:flags=lanczos,split[s0][s1];[s0]palettegen[p];[s1][p]paletteuse`;
        await ff.exec(['-ss', start, '-t', dur, '-i', inName, '-vf', filter, '-loop', '0', 'out.gif']);
        const data = await ff.readFile('out.gif');
        downloadBytes(data, file.name.replace(/(\.[^.]+)$/, '-anim.gif'), 'image/gif');
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
      <h1 className="text-xl font-bold">{t('videoToGifTitle')}</h1>
      <p className="mt-1 text-sm text-muted">{t('videoToGifDesc')}</p>
      <FilePicker label="选择视频" accept="video/*" onPick={(f) => setFile(f[0])} />
      <FileList files={file ? [file] : []} />
      <Field label="起始时间（秒，如 1.5 或 0:03）"><input className={inputCls} value={start} onChange={(e) => setStart(e.target.value)} /></Field>
      <Field label="时长（秒）"><input className={inputCls} value={dur} onChange={(e) => setDur(e.target.value)} /></Field>
      <Field label="帧率 FPS"><input className={inputCls} value={fps} onChange={(e) => setFps(e.target.value)} /></Field>
      <Field label="宽度（像素）"><input className={inputCls} value={width} onChange={(e) => setWidth(e.target.value)} /></Field>
      <RunBar running={running} progress={progress} status={status} onRun={run} disabled={!file} label="开始处理" />
    </div>
  );
}
