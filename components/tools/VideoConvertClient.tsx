'use client';

import { useState } from 'react';
import { useT } from '@/lib/i18n';
import { withFFmpeg, writeAll, downloadBytes } from '@/lib/ffmpeg';
import { RunBar, FilePicker, FileList, Field, inputCls } from './_mediaShared';

const MIME: Record<string, string> = { mp4: 'video/mp4', webm: 'video/webm', mov: 'video/quicktime' };

export default function VideoConvertClient() {
  const { t } = useT();
  const [file, setFile] = useState<File | null>(null);
  const [fmt, setFmt] = useState('mp4');
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
        const args = ['-i', inName];
        if (fmt === 'webm') args.push('-c:v', 'libvpx-vp9', '-c:a', 'libopus');
        else args.push('-c:v', 'libx264', '-c:a', 'aac');
        args.push('-movflags', '+faststart', `out.${fmt}`);
        await ff.exec(args);
        const data = await ff.readFile(`out.${fmt}`);
        downloadBytes(data, file.name.replace(/(\.[^.]+)$/, `-conv.${fmt}`), MIME[fmt]);
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
      <h1 className="text-xl font-bold">{t('videoConvertTitle')}</h1>
      <p className="mt-1 text-sm text-muted">{t('videoConvertDesc')}</p>
      <FilePicker label="选择视频" accept="video/*" onPick={(f) => setFile(f[0])} />
      <FileList files={file ? [file] : []} />
      <Field label="输出格式">
        <select className={inputCls} value={fmt} onChange={(e) => setFmt(e.target.value)}>
          <option value="mp4">MP4</option>
          <option value="webm">WebM</option>
          <option value="mov">MOV</option>
        </select>
      </Field>
      <RunBar running={running} progress={progress} status={status} onRun={run} disabled={!file} label="开始处理" />
    </div>
  );
}
