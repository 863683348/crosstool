'use client';

import { useState } from 'react';
import { useT } from '@/lib/i18n';
import { withFFmpeg, writeAll, downloadBytes } from '@/lib/ffmpeg';
import { RunBar, FilePicker, FileList, Field, inputCls } from './_mediaShared';

const RES: Record<string, string> = { '1080p': '1920', '720p': '1280', '480p': '854', '360p': '640' };
const CRF: Record<string, string> = { high: '23', medium: '28', low: '34' };

export default function VideoCompressClient() {
  const { t } = useT();
  const [file, setFile] = useState<File | null>(null);
  const [res, setRes] = useState('720p');
  const [quality, setQuality] = useState('medium');
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
        const args = ['-i', inName, '-c:v', 'libx264', '-crf', CRF[quality], '-preset', 'veryfast'];
        if (res !== 'orig') args.push('-vf', `scale=${RES[res]}:-2`);
        args.push('-c:a', 'aac', '-movflags', '+faststart', 'out.mp4');
        await ff.exec(args);
        const data = await ff.readFile('out.mp4');
        downloadBytes(data, file.name.replace(/(\.[^.]+)$/, '-compressed$1'), 'video/mp4');
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
      <h1 className="text-xl font-bold">{t('videoCompressTitle')}</h1>
      <p className="mt-1 text-sm text-muted">{t('videoCompressDesc')}</p>
      <FilePicker label="选择视频" accept="video/*" onPick={(f) => setFile(f[0])} />
      <FileList files={file ? [file] : []} />
      <Field label="目标分辨率">
        <select className={inputCls} value={res} onChange={(e) => setRes(e.target.value)}>
          <option value="orig">原始比例</option>
          <option value="1080p">1080p (1920)</option>
          <option value="720p">720p (1280)</option>
          <option value="480p">480p (854)</option>
          <option value="360p">360p (640)</option>
        </select>
      </Field>
      <Field label="画质">
        <select className={inputCls} value={quality} onChange={(e) => setQuality(e.target.value)}>
          <option value="high">高（压得少）</option>
          <option value="medium">中</option>
          <option value="low">低（压得多）</option>
        </select>
      </Field>
      <RunBar running={running} progress={progress} status={status} onRun={run} disabled={!file} label="开始处理" />
    </div>
  );
}
