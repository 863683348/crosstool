'use client';

import { useState } from 'react';
import { useT } from '@/lib/i18n';
import { withFFmpeg, writeAll } from '@/lib/ffmpeg';
import { RunBar, FilePicker, FileList, Field, inputCls } from './_mediaShared';

export default function VideoFrameExtractClient() {
  const { t } = useT();
  const [file, setFile] = useState<File | null>(null);
  const [interval, setInterval] = useState('1');
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('');
  const [frames, setFrames] = useState<{ url: string; name: string }[]>([]);

  async function run() {
    if (!file) return;
    setRunning(true);
    setProgress(0);
    setFrames([]);
    setStatus('加载处理引擎…');
    try {
      await withFFmpeg(async (ff) => {
        const [inName] = await writeAll(ff, [file]);
        setStatus('抽帧…');
        await ff.exec(['-i', inName, '-vf', `fps=1/${interval}`, 'frame%03d.png']);
        const dir = await ff.listDir('/');
        const names = dir
          .filter((d) => !d.isDir && /^frame\d+\.png$/.test(d.name))
          .map((d) => d.name)
          .sort();
        const out: { url: string; name: string }[] = [];
        for (const n of names) {
          const data = (await ff.readFile(n)) as Uint8Array;
          const blob = new Blob([data as BlobPart], { type: 'image/png' });
          out.push({ url: URL.createObjectURL(blob), name: n });
        }
        setFrames(out);
        setStatus(`完成 ✓ 共 ${out.length} 帧（点击缩略图保存）`);
      }, { onProgress: setProgress });
    } catch (e) {
      setStatus('处理失败：' + (e as Error).message);
    } finally {
      setRunning(false);
    }
  }

  return (
    <div>
      <h1 className="text-xl font-bold">{t('videoFrameExtractTitle')}</h1>
      <p className="mt-1 text-sm text-muted">{t('videoFrameExtractDesc')}</p>
      <FilePicker label="选择视频" accept="video/*" onPick={(f) => setFile(f[0])} />
      <FileList files={file ? [file] : []} />
      <Field label="抽帧间隔（秒，如 1 = 每秒 1 帧；2 = 每 2 秒 1 帧）">
        <input className={inputCls} value={interval} onChange={(e) => setInterval(e.target.value)} inputMode="decimal" />
      </Field>
      <RunBar running={running} progress={progress} status={status} onRun={run} disabled={!file} label="提取帧" />
      {frames.length > 0 && (
        <div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-4">
          {frames.map((f, i) => (
            <a
              key={i}
              href={f.url}
              download={f.name}
              className="block overflow-hidden rounded border border-border hover:border-primary"
            >
              <img src={f.url} alt={f.name} className="w-full" />
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
