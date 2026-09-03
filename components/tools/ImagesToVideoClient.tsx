'use client';

import { useState } from 'react';
import { useT } from '@/lib/i18n';
import { withFFmpeg, downloadBytes } from '@/lib/ffmpeg';
import { RunBar, FilePicker, FileList, Field, inputCls, imageToPngBytes } from './_mediaShared';

export default function ImagesToVideoClient() {
  const { t } = useT();
  const [files, setFiles] = useState<File[]>([]);
  const [fps, setFps] = useState('1');
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('');

  async function run() {
    if (!files.length) return;
    setRunning(true);
    setProgress(0);
    setStatus('加载处理引擎…');
    try {
      await withFFmpeg(async (ff) => {
        // 每张图重绘为 PNG，按序命名 img000.png / img001.png …
        for (let i = 0; i < files.length; i++) {
          const png = await imageToPngBytes(files[i]);
          await ff.writeFile(`img${String(i).padStart(3, '0')}.png`, png);
        }
        setStatus('合成视频…');
        await ff.exec([
          '-framerate', fps,
          '-start_number', '0',
          '-i', 'img%03d.png',
          '-vf', 'scale=trunc(iw/2)*2:trunc(ih/2)*2',
          '-c:v', 'libx264',
          '-pix_fmt', 'yuv420p',
          'out.mp4',
        ]);
        const data = await ff.readFile('out.mp4');
        downloadBytes(data, 'images-to-video.mp4', 'video/mp4');
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
      <h1 className="text-xl font-bold">{t('imagesToVideoTitle')}</h1>
      <p className="mt-1 text-sm text-muted">{t('imagesToVideoDesc')}</p>
      <FilePicker multiple label="选择多张图片（按选择顺序拼接）" accept="image/*" onPick={(f) => setFiles(f)} />
      <FileList files={files} />
      <Field label="帧率（每张图停留秒数 = 1 ÷ 帧率，如 1 = 每张 1 秒）">
        <input className={inputCls} value={fps} onChange={(e) => setFps(e.target.value)} inputMode="decimal" />
      </Field>
      <RunBar running={running} progress={progress} status={status} onRun={run} disabled={!files.length} label="生成视频" />
    </div>
  );
}
