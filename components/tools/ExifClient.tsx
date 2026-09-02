'use client';

import { useState } from 'react';
import { useT } from '@/lib/i18n';
import { Download } from 'lucide-react';

interface Tag {
  k: string;
  v: string;
}

function readUInt(buf: DataView, off: number, le: boolean, len: number): number {
  if (len === 2) return buf.getUint16(off, le);
  return buf.getUint32(off, le);
}

// 精简 EXIF 读取：IFD0 常见字段 + GPS（仅 JPEG）
function parseExif(arrayBuffer: ArrayBuffer): Tag[] {
  const dv = new DataView(arrayBuffer);
  if (dv.getUint16(0, false) !== 0xffd8) return [];
  let off = 2;
  while (off < dv.byteLength - 1) {
    if (dv.getUint16(off, false) !== 0xffe1) {
      if (dv.getUint8(off) !== 0xff) break;
      off += 2 + dv.getUint16(off + 1, false);
      continue;
    }
    // APP1
    const exifStart = off + 4;
    if (dv.getUint32(exifStart, false) !== 0x45786966) return []; // "Exif"
    const tiff = exifStart + 6;
    const le = dv.getUint16(tiff, false) === 0x4949;
    const ifd0 = tiff + readUInt(dv, tiff + 4, le, 4);
    const tags: Tag[] = [];
    const count = readUInt(dv, ifd0, le, 2);
    const names: Record<number, string> = { 0x010f: 'Make', 0x0110: 'Model', 0x0112: 'Orientation', 0x0132: 'DateTime', 0x8769: 'ExifIFD', 0x8825: 'GPSIFD' };
    const asc = (o: number) => {
      let s = '';
      let c = 0;
      while (c < 256) {
        const b = dv.getUint8(o + c);
        if (b === 0) break;
        s += String.fromCharCode(b);
        c++;
      }
      return s;
    };
    let gps: Tag[] = [];
    for (let i = 0; i < count; i++) {
      const entry = ifd0 + 2 + i * 12;
      const id = readUInt(dv, entry, le, 2);
      const type = readUInt(dv, entry + 2, le, 2);
      const valOff = tiff + readUInt(dv, entry + 8, le, 4);
      if (id === 0x8825) {
        const gCount = readUInt(dv, valOff, le, 2);
        for (let j = 0; j < gCount; j++) {
          const ge = valOff + 2 + j * 12;
          const gid = readUInt(dv, ge, le, 2);
          if (gid === 0x0001 || gid === 0x0002 || gid === 0x0003) {
            const r = dv.getFloat32(valOff + 8, le);
            const g = dv.getFloat32(valOff + 12, le);
            gps.push({ k: gid === 0x0001 ? 'GPSLatitude' : gid === 0x0002 ? 'GPSLongitude' : 'GPSAltitude', v: `${r},${g}` });
          }
        }
      }
      const name = names[id];
      if (name && (id === 0x010f || id === 0x0110 || id === 0x0112 || id === 0x0132)) {
        tags.push({ k: name, v: type === 2 ? asc(valOff) : String(readUInt(dv, valOff, le, type === 4 ? 4 : 2)) });
      }
    }
    return [...tags, ...gps];
  }
  return [];
}

export default function ExifClient() {
  const { t } = useT();
  const [file, setFile] = useState<File | null>(null);
  const [tags, setTags] = useState<Tag[]>([]);
  const [info, setInfo] = useState('');

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setInfo(`${f.name} · ${(f.size / 1024).toFixed(1)} KB · ${f.type}`);
    f.arrayBuffer().then((ab) => setTags(parseExif(ab)));
  }

  async function clearMeta() {
    if (!file) return;
    const bmp = await createImageBitmap(file);
    const c = document.createElement('canvas');
    c.width = bmp.width;
    c.height = bmp.height;
    c.getContext('2d')!.drawImage(bmp, 0, 0);
    c.toBlob((blob) => {
      if (!blob) return;
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = file.name.replace(/(\.[^.]+)$/, '-clean$1');
      a.click();
      URL.revokeObjectURL(a.href);
    }, 'image/png');
  }

  return (
    <div>
      <h1 className="text-xl font-bold">{t('exifTitle')}</h1>
      <p className="mt-1 text-sm text-muted">{t('exifDesc')}</p>

      <label className="mt-4 inline-block cursor-pointer rounded-lg border border-border bg-panel px-4 py-2 text-sm hover:border-primary">
        {t('dropBig')}
        <input type="file" accept="image/*" className="hidden" onChange={onFile} />
      </label>

      {info && <p className="mt-2 text-xs text-muted">{info}</p>}

      {tags.length > 0 && (
        <div className="mt-3 rounded-card border border-border bg-panel p-3 text-sm">
          <div className="mb-1 font-semibold">{t('exifTitle')}</div>
          {tags.map((x) => (
            <div key={x.k} className="flex gap-2">
              <span className="w-28 shrink-0 text-muted">{x.k}</span>
              <span className="break-all">{x.v}</span>
            </div>
          ))}
        </div>
      )}

      <button className="mt-4 flex items-center gap-1 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-text hover:opacity-90 disabled:opacity-50" onClick={clearMeta} disabled={!file}>
        <Download size={14} /> {t('imgRemoveBgRun')}（清除元数据）
      </button>
    </div>
  );
}
