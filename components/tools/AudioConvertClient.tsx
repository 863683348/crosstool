'use client';

import { useState } from 'react';
import { useT } from '@/lib/i18n';
import { withFFmpeg, writeAll, downloadBytes } from '@/lib/ffmpeg';
import { RunBar, FilePicker, FileList, Field, inputCls } from './_mediaShared';

const MIME: Record<string, string> = { mp3: 'audio/mpeg', wav: 'audio/wav', m4a: 'audio/mp4' };
const CODEC: Record<string, string[]> = { mp3: ['libmp3lame'], wav: ['pcm_s16le'], m4a: ['aac'] };

export default function AudioConvertClient() {
  const { t } = useT();
  const [file, setFile] = useState<File | null>(null);
  const [fmt, setFmt] = useState('mp3');
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
        await ff.exec(['-i', inName, '-c:a', ...CODEC[fmt], `out.${fmt}`]);
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
      <h1 className="text-xl font-bold">{t('audioConvertTitle')}</h1>
      <p className="mt-1 text-sm text-muted">{t('audioConvertDesc')}</p>
      <FilePicker label="选择音频" accept="audio/*" onPick={(f) => setFile(f[0])} />
      <FileList files={file ? [file] : []} />
      <Field label="输出格式">
        <select className={inputCls} value={fmt} onChange={(e) => setFmt(e.target.value)}>
          <option value="mp3">MP3</option>
          <option value="wav">WAV</option>
          <option value="m4a">M4A</option>
        </select>
      </Field>
      <RunBar running={running} progress={progress} status={status} onRun={run} disabled={!file} label="开始转换" />
    </div>
  );
}
